import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized");
    const id: Id<"users"> = user._id;

    return await ctx.db.insert("chats", {
      title,
      userId: id,
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { id: v.id("chats") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized");

    return await ctx.db.get(id);
  },
});

export const getAllCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized");
    const userId: Id<"users"> = user._id;

    return await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

export const del = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, { chatId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const chat = await ctx.db.get(chatId);
    const user = await ctx.runQuery(api.users.current);
    if (!user || !chat) throw new Error("Unauthorized");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(chatId);
  },
});

export const updateTitle = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    return await ctx.db.patch(chatId, { title });
  },
});
