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
  }).index("byClerkUserId", ["clerkUserId"]),
});
