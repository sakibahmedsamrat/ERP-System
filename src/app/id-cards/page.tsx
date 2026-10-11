import IdCardsClient from '@/components/id-cards/IdCardsClient';

export default function IdCardsPage({
  searchParams
}: {
  searchParams?: { tab?: string; [key: string]: string | undefined };
}) {
  const initialTab = searchParams?.tab === 'visitor' ? 'visitor' : 'employee';

  return <IdCardsClient initialTab={initialTab} searchParams={searchParams} />;
}
