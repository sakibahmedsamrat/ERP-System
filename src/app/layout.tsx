export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import { getSession } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP System",
  description: "Modern ERP Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <MainLayout user={session?.user}>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
