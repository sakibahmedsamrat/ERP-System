import prisma from '@/lib/prisma';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import { getSession } from "@/lib/auth";
import NextTopLoader from 'nextjs-toploader';
import { unstable_cache } from 'next/cache';

const inter = Inter({ subsets: ["latin"], display: 'swap' });

const getUserProfileImage = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });
  },
  ['user-profile-image'],
  { revalidate: 300, tags: ['user-profile'] }
);

export const metadata: Metadata = {
  title: "ERP System",
  description: "Modern ERP Management System",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  let fullUser = session?.user;
  if (session?.user?.id) {
    const dbUser = await getUserProfileImage(session.user.id);
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
