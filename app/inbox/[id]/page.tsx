import LetterDetail from './LetterDetail';

export default async function InboxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LetterDetail letterId={id} />;
}
