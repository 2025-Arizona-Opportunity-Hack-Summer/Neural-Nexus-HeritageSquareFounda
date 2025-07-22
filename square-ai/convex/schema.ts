import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const msgPartsSchema = v.array(
  v.union(
    v.object({
      type: v.literal("text"),
      text: v.string(),
    }),
    v.object({
      type: v.literal("reasoning"),
      reasoning: v.string(),
      details: v.union(
        v.array(
          v.object({
            type: v.literal("text"),
            text: v.string(),
            signature: v.optional(v.string()),
          }),
        ),
        v.object({
          type: v.literal("redacted"),
          data: v.string(),
        }),
      ),
      //   details: Array<{
      //     type: 'text';
      //     text: string;
      //     signature?: string;
      // } | {
      //     type: 'redacted';
      //     data: string;
      // }>;
    }),
    v.object({
      type: v.literal("tool-invocation"),
      toolInvocation: v.union(
        v.object({
          state: v.literal("partial-call"),
          toolCallId: v.string(),
          toolname: v.string(),
          args: v.any(),
        }),
        v.object({
          state: v.literal("call"),
          toolCallId: v.string(),
          toolname: v.string(),
          args: v.any(),
        }),
        v.object({
          state: v.literal("result"),
          toolCallId: v.string(),
          toolname: v.string(),
          args: v.any(),
        }),
      ),
    }),
    v.object({
      type: v.literal("source"),
      source: v.object({
        sourceType: v.literal("url"),
        id: v.string(),
        url: v.string(),
        title: v.optional(v.string()),
      }),
    }),
    v.object({
      type: v.literal("step-start"),
    }),
  ),
);

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
    isPinned: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_last_message_at", ["userId", "lastMessageAt"]),
  messages: defineTable({
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
    parts: v.array(v.any()),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_chat_id_created_at", ["chatId", "createdAt"]),
});
// jd7c4e2st0wkk9swyv5kh9wktn7k1r44
