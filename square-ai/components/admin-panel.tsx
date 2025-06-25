"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Calendar,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  registeredAt: string;
  isVerified: boolean;
  lastActive: string;
  role: string;
}

export default function Component() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      registeredAt: "2024-01-15",
      isVerified: true,
      lastActive: "2024-01-20",
      role: "User",
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob.smith@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      registeredAt: "2024-01-18",
      isVerified: false,
      lastActive: "2024-01-19",
      role: "User",
    },
    {
      id: "3",
      name: "Carol Davis",
      email: "carol.davis@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      registeredAt: "2024-01-12",
      isVerified: true,
      lastActive: "2024-01-21",
      role: "Premium",
    },
    {
      id: "4",
      name: "David Wilson",
      email: "david.wilson@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      registeredAt: "2024-01-20",
      isVerified: false,
      lastActive: "2024-01-20",
      role: "User",
    },
    {
      id: "5",
      name: "Emma Brown",
      email: "emma.brown@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      registeredAt: "2024-01-10",
      isVerified: true,
      lastActive: "2024-01-22",
      role: "User",
    },
    {
      id: "6",
      name: "Frank Miller",
      email: "frank.miller@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      registeredAt: "2024-01-22",
      isVerified: false,
      lastActive: "2024-01-22",
      role: "User",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const handleVerificationToggle = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, isVerified: !user.isVerified } : user,
      ),
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const verifiedCount = users.filter((user) => user.isVerified).length;
  const pendingCount = users.filter((user) => !user.isVerified).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage user access and verification status for the app
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-card border-border">
              <Mail className="mr-2 h-4 w-4" />
              Send Notifications
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <UserCheck className="mr-2 h-4 w-4" />
              Bulk Verify
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered users in your app
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {verifiedCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with app access
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Verification
              </CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting admin approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              View and manage all registered users for The Square PHX AI. Toggle
              verification status to grant or revoke app access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Table */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "Premium" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(user.registeredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(user.lastActive).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isVerified ? "default" : "destructive"}
                        >
                          {user.isVerified ? "Active" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={user.isVerified}
                            onCheckedChange={() =>
                              handleVerificationToggle(user.id)
                            }
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm text-muted-foreground">
                            {user.isVerified ? "Verified" : "Verify"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Send Message</DropdownMenuItem>
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No users found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search criteria.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
