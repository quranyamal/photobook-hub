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

export const metadata: Metadata = {
  title: "PhotoBook Hub — Personalized Photobooks",
  description:
    "Create and order stunning personalized photobooks. Upload your photos, design your book, and receive a beautiful printed keepsake.",
};

export default async function Home() {
  const session = await auth();
  return <MarketingPage isLoggedIn={!!session} isAdmin={session?.user.role === UserRole.ADMIN} />;
}

const steps = [
  {
    number: "01",
    title: "Upload your photos",
    description: "Drag and drop your favourite photos from any device.",
  },
  {
    number: "02",
    title: "Design your book",
    description: "Choose a layout, add captions, and arrange pages your way.",
  },
  {
    number: "03",
    title: "Order & receive",
    description: "We print and deliver a professionally bound photobook to your door.",
  },
];

const features = [
  {
    icon: BookOpen,
    name: "Professional printing",
    description: "Premium paper and binding that lasts for generations.",
  },
  {
    icon: ImageIcon,
    name: "Easy photo upload",
    description: "Upload directly from your device — no app required.",
  },
  {
    icon: Truck,
    name: "Fast delivery",
    description: "Printed and shipped within 5 business days.",
  },
  {
    icon: Palette,
    name: "Custom layouts",
    description: "Pick from multiple layout options to match your style.",
  },
  {
    icon: Shield,
    name: "Secure payments",
    description: "Your data and payment details are always protected.",
  },
  {
    icon: Clock,
    name: "Satisfaction guarantee",
    description: "Not happy? We'll reprint or refund — no questions asked.",
  },
];

function MarketingPage({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.svg" width={165} height={33} alt="PhotoBook Hub" unoptimized priority />
          </Link>
          <nav className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get started</Button>
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
                Memories, beautifully bound
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Turn your photos into a photobook you&apos;ll treasure forever
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Upload your photos, design your book, and receive a professionally printed keepsake — delivered straight to your door.
              </p>
              {!isLoggedIn && (
                <div className="flex flex-wrap gap-4">
                  <Link href="/register">
                    <Button size="lg">Create your first book</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" size="lg">Sign in</Button>
                  </Link>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Join thousands of families preserving their memories
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
            <h2 className="text-3xl font-bold text-center">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-8 mt-12">
              {steps.map((step) => (
                <Card key={step.number}>
                  <CardHeader>
                    <p className="text-5xl font-bold text-primary/20">{step.number}</p>
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
              Everything you need to create a beautiful photobook
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {features.map(({ icon: Icon, name, description }) => (
                <div key={name} className="p-6 rounded-xl border border-border bg-card">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="py-24 px-4 bg-primary text-primary-foreground text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to create your first photobook?
            </h2>
            <p className="text-primary-foreground/80">
              It only takes a few minutes to upload your photos and place an order.
            </p>
            {!isLoggedIn && (
              <div className="pt-2">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  >
                    Get started free
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
              <Link href="/brand" className="hover:text-foreground transition-colors">Style guide</Link>
            )}
            {!isLoggedIn && (
              <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            )}
          </nav>
        </div>
      </footer>

    </div>
  );
}
