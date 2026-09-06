import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === UserRole.ADMIN) redirect("/admin/orders");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, createdAt: true },
  });

  const memberSince = user.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user.name ?? user.email}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user.email} · Member since {memberSince}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/projects">
          <Card className="hover:ring-primary/30 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Create and manage your photobook projects.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/orders">
          <Card className="hover:ring-primary/30 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                View and track your photobook orders.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
