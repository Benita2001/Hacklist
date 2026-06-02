import { getHackathons } from '@/lib/data';
import { parsePrizeToNumber, formatPrize } from '@/lib/utils';

export async function Ticker() {
  const hackathons = await getHackathons();
  const totalPrize = hackathons.reduce((sum, h) => sum + parsePrizeToNumber(h.prize_pool), 0);
  const aiCount    = hackathons.filter(h => h.category === 'AI'   || h.category === 'Both').length;
  const web3Count  = hackathons.filter(h => h.category === 'Web3' || h.category === 'Both').length;

  const items = [
    `${hackathons.length} Active Hackathons`,
    `${formatPrize(totalPrize)} in Total Prizes`,
    `${aiCount} AI Hackathons`,
    `${web3Count} Web3 Hackathons`,
    `Prize-first. Deadline-sorted.`,
    `Find yours on HackList`,
  ];

  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden"
      style={{ height: 'var(--ticker-height)', backgroundColor: '#3D4820' }}
      aria-hidden="true"
    >
      <div
        className="ticker-track flex items-center h-full whitespace-nowrap"
        style={{ width: 'max-content', transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
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
                width: '1px',
                height: '10px',
                backgroundColor: '#B8C96A',
                marginLeft: '32px',
                opacity: 0.25,
                verticalAlign: 'middle',
              }}
              aria-hidden="true"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
