import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

export const create = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    sender: v.union(v.literal("user"), v.literal("ai")),
  },
  handler: async (ctx, { chatId, content, sender }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Unauthenticated");

    const user = await ctx.runQuery(api.users.current);
    if (!user) throw new Error("Unauthorized");

    return await ctx.db.insert("messages", {
      chatId,
      content,
      sender,
      createdAt: Date.now(),
    });
  },
});
