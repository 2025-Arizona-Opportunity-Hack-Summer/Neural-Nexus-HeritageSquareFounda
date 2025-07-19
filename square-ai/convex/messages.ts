import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { msgPartsSchema } from "./schema";

export const create = mutation({
  args: {
    chatId: v.id("chats"),
    uiId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("system"),
      v.literal("assistant"),
      v.literal("data"),
    ),
    content: v.string(),
    createdAt: v.number(),
    parts: msgPartsSchema,
  },
  handler: async (ctx, { chatId, content, role, createdAt, parts, uiId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized");

    return await ctx.db.insert("messages", {
      chatId,
      content,
      createdAt,
      role,
      parts,
      uiId,
    });
  },
});

export const getAllByChatId = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, { chatId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized");

    return await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chatId))
      .collect();
  },
});
