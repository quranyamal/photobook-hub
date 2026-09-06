import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Brand | PhotoBook Hub",
  description: "PhotoBook Hub brand style guide — colors, typography, and UI components.",
};

const colorTokens = [
  { name: "Primary", cssVar: "--primary", description: "Amber — CTAs, links, focus rings" },
  { name: "Primary Foreground", cssVar: "--primary-foreground", description: "Text on primary" },
  { name: "Accent", cssVar: "--accent", description: "Terracotta — secondary highlights" },
  { name: "Accent Foreground", cssVar: "--accent-foreground", description: "Text on accent" },
  { name: "Background", cssVar: "--background", description: "Warm cream page background" },
  { name: "Foreground", cssVar: "--foreground", description: "Warm charcoal body text" },
  { name: "Card", cssVar: "--card", description: "Slightly richer than background" },
  { name: "Muted", cssVar: "--muted", description: "Subtle section backgrounds" },
  { name: "Muted Foreground", cssVar: "--muted-foreground", description: "Secondary text" },
  { name: "Secondary", cssVar: "--secondary", description: "Light terracotta tint" },
  { name: "Border", cssVar: "--border", description: "Warm light border" },
  { name: "Destructive", cssVar: "--destructive", description: "Error / danger" },
];

const typographyScale = [
  { label: "Display", className: "text-5xl font-bold tracking-tight", sample: "Memories, beautifully bound" },
  { label: "H1", className: "text-4xl font-bold tracking-tight", sample: "Create your photobook" },
  { label: "H2", className: "text-3xl font-semibold", sample: "How it works" },
  { label: "H3", className: "text-2xl font-semibold", sample: "Upload your photos" },
  { label: "H4", className: "text-xl font-medium", sample: "Project settings" },
  { label: "Body", className: "text-base", sample: "Turn moments into memories with a beautiful, professionally printed photobook." },
  { label: "Small", className: "text-sm text-muted-foreground", sample: "Created on 6 September 2026" },
  { label: "Caption", className: "text-xs text-muted-foreground", sample: "DRAFT · 12 photos" },
];

export default function BrandPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">

      {/* Header */}
      <div className="space-y-2">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">Brand Style Guide</h1>
        <p className="text-muted-foreground text-lg">
          PhotoBook Hub visual identity — colors, typography, and UI components.
        </p>
      </div>

      {/* Logo */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Logo</h2>
          <hr className="border-border mb-6" />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex items-center justify-center p-10 rounded-xl border border-border bg-background">
            <Image src="/logo.svg" width={220} height={44} alt="PhotoBook Hub logo" unoptimized />
          </div>
          <div className="flex items-center justify-center p-10 rounded-xl" style={{ background: "var(--foreground)" }}>
            <Image src="/logo.svg" width={165} height={33} alt="PhotoBook Hub logo on dark" unoptimized />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Minimum display size: 120 px wide. Always maintain clear space equal to the height of the book icon on all sides.
        </p>
      </section>

      {/* Color Palette */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Color Palette</h2>
          <hr className="border-border mb-6" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {colorTokens.map(({ name, cssVar, description }) => (
            <div key={cssVar} className="space-y-2">
              <div
                className="h-16 rounded-lg border border-border"
                style={{ background: `var(${cssVar})` }}
              />
              <div>
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                <code className="text-xs text-muted-foreground">{cssVar}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Typography</h2>
          <hr className="border-border mb-6" />
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Typeface: <strong>Inter</strong> — sans-serif, variable weight.
          Monospace: <strong>Geist Mono</strong> — used for order numbers and code.
        </p>
        <div className="space-y-6">
          {typographyScale.map(({ label, className, sample }) => (
            <div key={label} className="flex items-baseline gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
              <span className="text-xs text-muted-foreground w-16 shrink-0 font-mono">{label}</span>
              <p className={className}>{sample}</p>
            </div>
          ))}
        </div>
      </section>

      {/* UI Components */}
      <section className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-1">UI Components</h2>
          <hr className="border-border mb-6" />
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Buttons</h3>
          {(["default", "outline", "secondary", "ghost", "destructive", "link"] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">{variant}</span>
              <Button variant={variant} size="sm">Small</Button>
              <Button variant={variant}>Default</Button>
              <Button variant={variant} size="lg">Large</Button>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cards</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Summer 2025</CardTitle>
                <CardDescription>12 photos · Created Sep 6</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A collection of beach memories from the family summer trip.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Order #00042</CardTitle>
                <CardDescription>Placed on Sep 6, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Status: <span className="font-medium text-primary">In Production</span></p>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Estimated delivery: Sep 12</p>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Form elements */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Form Elements</h3>
          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl">
            <div className="space-y-1.5">
              <Label htmlFor="demo-default">Default</Label>
              <Input id="demo-default" placeholder="Enter your email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-disabled">Disabled</Label>
              <Input id="demo-disabled" placeholder="Not editable" disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-error">Error</Label>
              <Input id="demo-error" placeholder="Invalid value" aria-invalid />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
