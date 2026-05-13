import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { NewsletterFallback } from './NewsletterFallback';

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'Get the best AI and Web3 hackathons delivered every Monday morning.',
};

const sectionLabel = [
  'block',
  'text-[length:var(--text-xs)]',
  'font-medium',
  'uppercase',
  'tracking-[var(--tracking-caps)]',
  'text-[color:var(--color-text-muted)]',
  'mb-[var(--space-4)]',
].join(' ');

const divider = 'h-px bg-[var(--color-border-default)] border-none my-[var(--space-8)]';

const whatYouGet = [
  'New hackathons added that week',
  'Closing soon alerts — never miss a deadline',
  'Prize pool highlights',
];

export default function NewsletterPage() {
  return (
    <PageShell>
      <div className="pt-[var(--space-8)] pb-[var(--space-20)] max-w-[var(--max-width-form)] mx-auto">

        {/* Page header */}
        <div className="flex flex-col gap-[var(--space-2)] mb-[var(--space-2)]">
          <h1
            className={[
              'text-[length:var(--text-3xl)]',
              'font-bold',
              'text-[color:var(--color-text-primary)]',
              'leading-[var(--leading-tight)]',
            ].join(' ')}
          >
            Stay ahead of every deadline.
          </h1>
          <p
            className={[
              'text-[length:var(--text-base)]',
              'text-[color:var(--color-text-secondary)]',
              'leading-[var(--leading-relaxed)]',
            ].join(' ')}
          >
            Get the best AI and Web3 hackathons delivered every Monday morning.
            Prize-first. Deadline-sorted.
          </p>
        </div>

        <hr className={divider} />

        {/* What you get */}
        <div>
          <span className={sectionLabel}>What You Get</span>
          <ul className="flex flex-col gap-[var(--space-3)]">
            {whatYouGet.map((item) => (
              <li key={item} className="flex items-start gap-[var(--space-3)]">
                <span
                  className="mt-[5px] shrink-0 w-[6px] h-[6px] rounded-[var(--radius-sm)] bg-[var(--color-accent)]"
                  aria-hidden="true"
                />
                <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <hr className={divider} />

        {/* Brevo embed + fallback */}
        <div>
          {/* Paste Brevo embed code here */}
          <div id="brevo-form" />

          <NewsletterFallback />
        </div>

        {/* Fine print */}
        <p
          className={[
            'mt-[var(--space-4)]',
            'text-[length:var(--text-xs)]',
            'text-[color:var(--color-text-muted)]',
            'text-center',
          ].join(' ')}
        >
          No spam. Unsubscribe anytime. ~300 builders already subscribed.
        </p>

      </div>
    </PageShell>
  );
}
