import Link from 'next/link';

export type CatalogueStatus = 'ready' | 'unavailable' | 'error';

type CatalogueReadStateProps = {
  label: string;
  status: CatalogueStatus;
};

export function CatalogueReadState({ label, status }: CatalogueReadStateProps) {
  const message = status === 'unavailable'
    ? 'The catalogue is temporarily unavailable. Please retry shortly.'
    : status === 'error'
      ? 'We could not load this catalogue. Please retry shortly.'
      : `No ${label.toLowerCase()} listed yet. Check back soon.`;

  return (
    <div className="catalogue-read-state" role={status === 'ready' ? undefined : 'status'}>
      <p>{message}</p>
      {status !== 'ready' && <Link href="/">Refresh catalogue</Link>}
    </div>
  );
}
