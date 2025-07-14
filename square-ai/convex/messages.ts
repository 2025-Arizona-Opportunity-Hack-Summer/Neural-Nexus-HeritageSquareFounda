import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const create = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    sender: v.union(v.literal("user"), v.literal("ai")),
    isPending: v.boolean(),
  },
  handler: async (ctx, { chatId, content, sender, isPending }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized");

    return await ctx.db.insert("messages", {
      chatId,
      content,
      sender,
      isPending,
      createdAt: Date.now(),
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
