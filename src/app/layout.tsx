export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import { getSession } from "@/lib/auth";
import NextTopLoader from 'nextjs-toploader';

import { PrismaClient } from '@prisma/client';

const inter = Inter({ subsets: ["latin"] });
const prisma = new PrismaClient();

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
  let fullUser = session?.user;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (dbUser) {
      fullUser = { ...session.user, profileImage: dbUser.profileImage };
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <NextTopLoader
          color="#2563eb"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
        />
        <MainLayout user={fullUser}>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
