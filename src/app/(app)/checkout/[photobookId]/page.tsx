import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSubtotalCents } from "@/config/pricing";
import type { PhotobookSize, CoverType } from "@/generated/prisma/enums";
import { CheckoutForm } from "./_components/checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ photobookId: string }>;
}) {
  const { photobookId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const photobook = await db.photobook.findFirst({
    where: {
      id: photobookId,
      project: { userId: session.user.id },
    },
    select: {
      id: true,
      size: true,
      coverType: true,
      pageCount: true,
      project: { select: { id: true, title: true } },
    },
  });

  if (!photobook) notFound();

  const subtotalCents = getSubtotalCents(
    photobook.size as PhotobookSize,
    photobook.coverType as CoverType
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/projects/${photobook.project.id}/editor`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Editor
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Checkout</h1>
      </div>

      <CheckoutForm
        photobookId={photobook.id}
        projectTitle={photobook.project.title}
        size={photobook.size as PhotobookSize}
        coverType={photobook.coverType as CoverType}
        pageCount={photobook.pageCount}
        subtotalCents={subtotalCents}
      />
    </div>
  );
}
