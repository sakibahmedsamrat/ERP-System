import prisma, { withDbTimeout } from '@/lib/prisma';
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import { getSession } from "@/lib/auth";
import NextTopLoader from 'nextjs-toploader';
import { unstable_cache } from 'next/cache';

const inter = Inter({ subsets: ["latin"], display: 'swap' });

const getUserProfileImage = unstable_cache(
  async (userId: string, loginUserId?: string) => {
    try {
      const user = await withDbTimeout(
        prisma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              ...(loginUserId ? [{ userId: loginUserId }] : []),
              { userId: userId }
            ]
          },
          select: { profileImage: true },
        }),
        3500,
        null
      );
      if (user) {
        return { profileImage: user.profileImage || null };
      }

      // Fallback check for KPI worker accounts where id is worker.id
      const worker = await withDbTimeout(
        prisma.worker.findFirst({
          where: {
            OR: [
              { id: userId },
              ...(loginUserId ? [{ workerId: loginUserId }] : []),
              { workerId: userId }
            ]
          },
          select: { photoUrl: true },
        }),
        3000,
        null
      );
      return { profileImage: worker?.photoUrl || null };
    } catch {
      return { profileImage: null };
    }
  },
  ['user-profile-image'],
  { revalidate: 60, tags: ['user-profile'] }
);

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

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
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    console.warn('Layout getSession fallback:', err);
  }

  let fullUser = session?.user;
  if (session?.user?.id) {
    try {
      const dbUser = await getUserProfileImage(session.user.id, session.user.userId);
      fullUser = { ...session.user, profileImage: dbUser?.profileImage || null };
    } catch (err) {
      console.warn('Layout getUserProfileImage fallback:', err);
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
