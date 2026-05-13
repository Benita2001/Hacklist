import { getAllHackathons } from '@/lib/data';
import { formatPrize } from '@/lib/utils';

export function Ticker() {
  const hackathons = getAllHackathons();
  const totalPrize = hackathons.reduce((sum, h) => sum + h.prizePool, 0);
  const aiCount   = hackathons.filter(h => h.category === 'AI'   || h.category === 'Both').length;
  const web3Count = hackathons.filter(h => h.category === 'Web3' || h.category === 'Both').length;

  const items = [
    `${hackathons.length} Active Hackathons`,
    `${formatPrize(totalPrize)} in Total Prizes`,
    `${aiCount} AI Hackathons`,
    `${web3Count} Web3 Hackathons`,
    `Prize-first. Deadline-sorted.`,
    `Find yours on HackList`,
  ];

  /* Duplicate for seamless infinite scroll */
  const doubled = [...items, ...items];

  /* Background hardcoded to always dark moss — must not change with theme */
  return (
    <div
      className="overflow-hidden"
      style={{ height: 'var(--ticker-height)', backgroundColor: '#3D4820' }}
      aria-hidden="true"
    >
      <div
        className="ticker-track flex items-center h-full whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              paddingLeft: '32px',
              paddingRight: '32px',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              letterSpacing: 'var(--tracking-caps)',
              textTransform: 'uppercase',
              color: '#B8C96A',
            }}
          >
            {item}
            <span
              style={{
                display: 'inline-block',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#8FA040',
                marginLeft: '32px',
                opacity: 0.7,
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
