import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";
import { api } from "./_generated/api";

export const all = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      firstName: data.first_name!,
      lastName: data.last_name!,
      email: data.email_addresses[0]!.email_address,
      clerkUserId: data.id,
      imageUrl: data.has_image ? data.image_url : "",
      verified: false,
      isAdmin: false,
    };

    const user = await userByClerkUserId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByClerkUserId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByClerkUserId(ctx, identity.subject);
}

async function userByClerkUserId(ctx: QueryCtx, clerkUserId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

export const verify = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    const user = await userByClerkUserId(ctx, clerkUserId);
    if (!user) return null;

    return await ctx.db.patch(user._id, { verified: !user.verified });
  },
});

export const changeAdminStatus = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    const user = await userByClerkUserId(ctx, clerkUserId);
    if (!user) return null;

    return await ctx.db.patch(user._id, { isAdmin: !user.isAdmin });
  },
});

export const bulkVerify = mutation({
  args: { clerkUserIds: v.array(v.string()) },
  handler: async (ctx, { clerkUserIds }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }

    clerkUserIds.forEach((clerkId) =>
      ctx.runMutation(api.users.verify, { clerkUserId: clerkId }),
    );

    return "success";
  },
});
