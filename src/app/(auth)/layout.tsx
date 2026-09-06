import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <Link href="/">
          <Image src="/logo.svg" width={165} height={33} alt="PhotoBook Hub" unoptimized priority />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
