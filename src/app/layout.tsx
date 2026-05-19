import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SiMas",
  description: "Sistem Informasi Mastrip",
  applicationName: "SiMas",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const isAdmin = !!data?.user;

  return (
    <html lang="id" className={`${outfit.variable} h-full antialiased light`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <AppHeader isAdmin={isAdmin} />
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
        <BottomNav isAdmin={isAdmin} />
      </body>
    </html>
  );
}
