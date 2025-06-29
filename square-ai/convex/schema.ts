import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    clerkUserId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.string(),
    verified: v.boolean(),
    isAdmin: v.boolean(),
  }).index("by_clerk_user_id", ["clerkUserId"]),
  chats: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    lastMessageAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_last_message_at", ["userId", "lastMessageAt"]),
  messages: defineTable({
    chatId: v.id("chats"),
    sender: v.union(v.literal("user"), v.literal("ai")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_chat_id_created_at", ["chatId", "createdAt"]),
});
