import {
  MoreHorizontal,
  ShieldBan,
  ShieldCheck,
  ShieldOff,
  ShieldUser,
} from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { changeUserAdminStatus, verifyUser } from "./actions";

export function UserActionMenu({ user }: { user: Doc<"users"> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {user.verified ? (
          <DropdownMenuItem onClick={() => verifyUser()}>
            <ShieldBan />
            Deboard User
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => verifyUser()}>
            <ShieldCheck />
            Verify User
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {user.isAdmin ? (
          <DropdownMenuItem onClick={() => changeUserAdminStatus()}>
            <ShieldOff />
            Remove Admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => changeUserAdminStatus()}>
            <ShieldUser />
            Make Admin
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
