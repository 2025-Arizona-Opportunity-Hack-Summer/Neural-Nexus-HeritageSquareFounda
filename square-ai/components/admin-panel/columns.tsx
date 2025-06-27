"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserActionMenu } from "./action-menu";

export const columns: ColumnDef<Doc<"users">>[] = [
  {
    accessorKey: "firstName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "verified",
    header: "Verified",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <Badge variant={user.verified ? "default" : "destructive"}>
          {user.verified ? "Verified" : "Not Verified"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isAdmin",
    header: "Admin Privileges",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <Badge variant={user.isAdmin ? "default" : "destructive"}>
          {user.isAdmin ? "Admin" : "Not Admin"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return <UserActionMenu user={user} />;
    },
  },
];
