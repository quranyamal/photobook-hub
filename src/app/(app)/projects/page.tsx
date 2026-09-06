import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewProjectDialog } from "./_components/new-project-dialog";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  READY: "Ready",
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
};

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your photobook projects
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center gap-4">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create one to get started.
          </p>
          <NewProjectDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="hover:ring-primary/30 transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle>{p.title}</CardTitle>
                  <CardDescription>
                    {p._count.photos}{" "}
                    {p._count.photos === 1 ? "photo" : "photos"} ·{" "}
                    {p.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </CardDescription>
                  <CardAction>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASS[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </CardAction>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
