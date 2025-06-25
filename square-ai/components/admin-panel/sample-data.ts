import { Doc, Id } from "../../convex/_generated/dataModel";

export const data: Doc<"users">[] = [
  {
    _id: "" as Id<"users">,
    _creationTime: 10,
    email: "alice.johnson@example.com",
    clerkUserId: "string",
    firstName: "Alice",
    lastName: "Johnson",
    imageUrl: "https://github.com/shadcn.png",
    verified: true,
    isAdmin: false,
  },
  {
    _id: "" as Id<"users">,
    _creationTime: 10,
    email: "tyrese.haliburton@example.com",
    clerkUserId: "string",
    firstName: "Tyrese",
    lastName: "Haliburton",
    imageUrl: "https://github.com/shadcn.png",
    verified: true,
    isAdmin: false,
  },
];
