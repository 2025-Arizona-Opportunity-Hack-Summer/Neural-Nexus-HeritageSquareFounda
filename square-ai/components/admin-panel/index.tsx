"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserCheck, UserX, Mail, ArrowLeft } from "lucide-react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";

export function AdminPanel({ users }: { users: Doc<"users">[] }) {
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
                {users.filter((user) => user.verified).length}
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
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter((user) => !user.verified).length}
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
            <DataTable columns={columns} data={users} />
          </CardContent>
        </Card>

        <div className="fixed bottom-6 left-6 z-50">
          <div className="group relative">
            <Link href="/chat">
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
              <div className="bg-foreground text-background px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap shadow-lg">
                Back to chat
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-foreground rotate-45"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
