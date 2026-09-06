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
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

export default async function DashboardPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session) redirect("/login");
  if (session.user.role === UserRole.ADMIN) redirect("/admin/orders");

  const t = getDictionary(locale);

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, createdAt: true },
  });

  const memberSince = user.createdAt.toLocaleDateString(
    locale === "ar" ? "ar-SA" : locale === "id" ? "id-ID" : "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t.dashboard.welcome}, {user.name ?? user.email}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user.email} · {t.dashboard.memberSince} {memberSince}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/projects">
          <Card className="hover:ring-primary/30 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle>{t.dashboard.projects}</CardTitle>
              <CardDescription>{t.dashboard.projectsDesc}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/orders">
          <Card className="hover:ring-primary/30 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle>{t.dashboard.orders}</CardTitle>
              <CardDescription>{t.dashboard.ordersDesc}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
