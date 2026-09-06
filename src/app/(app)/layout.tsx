import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { UserRole } from "@/generated/prisma/enums";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <Image src="/logo.svg" width={165} height={33} alt="PhotoBook Hub" unoptimized priority />
            </Link>
            {session?.user && (
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                {session.user.role === UserRole.ADMIN && (
                  <Link
                    href="/admin/orders"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.nav.admin}
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  {session.user.name ?? session.user.email}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                >
                  <Button type="submit" variant="outline" size="sm">
                    {t.nav.signOut}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
