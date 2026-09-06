import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Clock,
  ImageIcon,
  Palette,
  Shield,
  Truck,
} from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = {
  title: "PhotoBook Hub — Personalized Photobooks",
  description:
    "Create and order stunning personalized photobooks. Upload your photos, design your book, and receive a beautiful printed keepsake.",
};

const featureIcons = [BookOpen, ImageIcon, Truck, Palette, Shield, Clock];

export default async function Home() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const t = getDictionary(locale);

  return (
    <MarketingPage
      isLoggedIn={!!session}
      isAdmin={session?.user.role === UserRole.ADMIN}
      t={t}
    />
  );
}

function MarketingPage({
  isLoggedIn,
  isAdmin,
  t,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  t: ReturnType<typeof getDictionary>;
}) {
  const stepNumbers = ["01", "02", "03"];

  return (
    <div className="min-h-screen flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.svg" width={165} height={33} alt="PhotoBook Hub" unoptimized priority />
          </Link>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">{t.nav.dashboard}</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">{t.nav.login}</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">{t.nav.getStarted}</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero + Video */}
        <section className="pt-4 pb-8 px-4">
          <div
            className="max-w-7xl mx-auto"
            style={{ display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "center" }}
          >

            {/* Text */}
            <div style={{ flex: "3 1 0", minWidth: "280px" }} className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {t.home.badge}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                {t.home.title}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                {t.home.subtitle}
              </p>
              {!isLoggedIn && (
                <div className="flex flex-wrap gap-4">
                  <Link href="/register">
                    <Button size="lg">{t.home.createBook}</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" size="lg">{t.home.signIn}</Button>
                  </Link>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {t.home.socialProof}
              </p>
            </div>

            {/* Portrait video — height-driven so it always fits the viewport */}
            <div style={{ flex: "2 1 0", minWidth: "200px", display: "flex", justifyContent: "center" }}>
              <div
                className="relative rounded-2xl overflow-hidden border border-border shadow-sm"
                style={{
                  height: "calc(100vh - 64px - 3rem)",
                  width: "calc((100vh - 64px - 3rem) * 9 / 16)",
                  maxWidth: "100%",
                }}
              >
                <iframe
                  src="https://www.youtube.com/embed/BnVDW8STZoA?autoplay=1&mute=1&loop=1&playlist=BnVDW8STZoA"
                  title="PhotoBook Hub — see how it works"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>

          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-muted/40 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center">{t.home.howItWorksTitle}</h2>
            <div className="grid sm:grid-cols-3 gap-8 mt-12">
              {t.home.steps.map((step, i) => (
                <Card key={i}>
                  <CardHeader>
                    <p className="text-5xl font-bold text-primary/20">{stepNumbers[i]}</p>
                    <CardTitle className="mt-2">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center">
              {t.home.featuresTitle}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {t.home.features.map((feature, i) => {
                const Icon = featureIcons[i];
                return (
                  <div key={i} className="p-6 rounded-xl border border-border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="py-24 px-4 bg-primary text-primary-foreground text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t.home.ctaTitle}
            </h2>
            <p className="text-primary-foreground/80">
              {t.home.ctaSubtitle}
            </p>
            {!isLoggedIn && (
              <div className="pt-2">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  >
                    {t.home.ctaButton}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" width={110} height={22} alt="PhotoBook Hub" unoptimized />
            <span>© {new Date().getFullYear()} PhotoBook Hub</span>
          </div>
          <nav className="flex gap-4">
            {isAdmin && (
              <Link href="/brand" className="hover:text-foreground transition-colors">{t.nav.styleGuide}</Link>
            )}
            {!isLoggedIn && (
              <Link href="/login" className="hover:text-foreground transition-colors">{t.nav.login}</Link>
            )}
          </nav>
        </div>
      </footer>

    </div>
  );
}
