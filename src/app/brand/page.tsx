import Image from 'next/image';

const swatches = [
  { name: 'Ink', token: '--hl-ink', value: '#12180B', className: 'brand-review__swatch--ink' },
  { name: 'Forest', token: '--hl-forest', value: '#26350F', className: 'brand-review__swatch--forest' },
  { name: 'Forest 2', token: '--hl-forest-2', value: '#344816', className: 'brand-review__swatch--forest-2' },
  { name: 'Cream', token: '--hl-cream', value: '#F5F1E7', className: 'brand-review__swatch--cream' },
  { name: 'Paper', token: '--hl-paper', value: '#FFFDF8', className: 'brand-review__swatch--paper' },
  { name: 'Olive', token: '--hl-olive', value: '#9BAD46', className: 'brand-review__swatch--olive' },
  { name: 'Signal', token: '--hl-signal', value: '#C9DD68', className: 'brand-review__swatch--signal' },
  { name: 'Gold', token: '--hl-gold', value: '#8B6A27', className: 'brand-review__swatch--gold' },
];

const typeRoles = [
  ['Display', 'Newsreader', 'Editorial headlines and statements'],
  ['Interface', 'Manrope', 'Navigation, controls, and body copy'],
  ['Evidence', 'IBM Plex Mono', 'Source URLs, timestamps, and identifiers'],
];

export const metadata = { title: 'Brand review' };

export default function BrandReviewPage() {
  return (
    <main className="brand-review">
      <header className="brand-review__header">
        <div>
          <p className="brand-review__eyebrow">Internal engineering review</p>
          <h1>HackList brand kit</h1>
          <p className="brand-review__lede">
            A local review surface for the supplied compass, provisional tokens, and deferred identity decisions.
          </p>
        </div>
        <p className="brand-review__status">Stage 7A / rights pending</p>
      </header>

      <section className="brand-review__marks" aria-labelledby="brand-mark-title">
        <div className="brand-review__section-heading">
          <p className="brand-review__eyebrow">01 / Source mark</p>
          <h2 id="brand-mark-title">The supplied compass remains unchanged</h2>
        </div>
        <div className="brand-review__mark-grid">
          <figure className="brand-review__mark brand-review__mark--light">
            <Image src="/hacklist-logo.png" alt="Supplied HackList compass mark" width={420} height={420} priority />
            <figcaption>Existing PNG on the light study surface</figcaption>
          </figure>
          <figure className="brand-review__mark brand-review__mark--dark">
            <Image src="/hacklist-logo.png" alt="Supplied HackList compass mark on a dark study surface" width={420} height={420} />
            <figcaption>Source asset previewed without recoloring</figcaption>
          </figure>
        </div>
      </section>

      <section className="brand-review__section" aria-labelledby="brand-token-title">
        <div className="brand-review__section-heading">
          <p className="brand-review__eyebrow">02 / Token study</p>
          <h2 id="brand-token-title">Color roles stay functional</h2>
        </div>
        <div className="brand-review__swatches">
          {swatches.map((swatch) => (
            <article className="brand-review__swatch-card" key={swatch.token}>
              <div className={`brand-review__swatch ${swatch.className}`} />
              <p>{swatch.name}</p>
              <code>{swatch.token}</code>
              <small>{swatch.value}</small>
            </article>
          ))}
        </div>
        <p className="brand-review__note">Digital-study values only. Final print values and logo sampling await rights and source approval.</p>
      </section>

      <section className="brand-review__section" aria-labelledby="brand-type-title">
        <div className="brand-review__section-heading">
          <p className="brand-review__eyebrow">03 / Typography</p>
          <h2 id="brand-type-title">One role per voice</h2>
        </div>
        <div className="brand-review__type-grid">
          {typeRoles.map(([role, family, use]) => (
            <article className="brand-review__type-card" key={role}>
              <p className="brand-review__type-role">{role}</p>
              <h3 style={{ fontFamily: role === 'Display' ? 'var(--hl-font-display)' : role === 'Evidence' ? 'var(--hl-font-evidence)' : 'var(--hl-font-interface)' }}>{family}</h3>
              <p>{use}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-review__section" aria-labelledby="brand-motion-title">
        <div className="brand-review__section-heading">
          <p className="brand-review__eyebrow">04 / Motion</p>
          <h2 id="brand-motion-title">Signals move around a stable core</h2>
        </div>
        <div className="brand-review__motion-card">
          <div className="brand-review__motion-rings" aria-hidden="true">
            <span />
            <span />
            <i />
          </div>
          <div>
            <p className="brand-review__type-role">Radar study</p>
            <p>One restrained sweep communicates discovery. Reduced motion leaves the rings and signal point static.</p>
          </div>
        </div>
      </section>

      <footer className="brand-review__footer">
        <p>Deferred until owner approval: vector master, lockups, favicon family, templates, final print values, and font licensing.</p>
      </footer>
    </main>
  );
}
