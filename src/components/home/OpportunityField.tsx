import Link from 'next/link';
import type { Hackathon } from '@/lib/types';
import type { Bounty, Grant, Job, Program } from '@/components/home/TabBrowser';

type OpportunitySignal = {
  id: string;
  name: string;
  organizer: string;
  type: string;
  href: string;
  deadline: string | null;
  deadlineText: string | null;
  verified: boolean;
};

type OpportunityFieldProps = {
  hackathons: Hackathon[];
  bounties: Bounty[];
  grants: Grant[];
  programs: Program[];
  jobs: Job[];
};

function deadlineLabel(item: Pick<OpportunitySignal, 'deadline' | 'deadlineText'>): string {
  return item.deadline ?? item.deadlineText ?? 'Not announced yet';
}

function signalsFrom(props: OpportunityFieldProps): OpportunitySignal[] {
  const signals: OpportunitySignal[] = [];
  const hackathon = props.hackathons[0];
  if (hackathon) signals.push({
    id: hackathon.id,
    name: hackathon.name,
    organizer: hackathon.organizer,
    type: 'Hackathon',
    href: `/hackathon/${hackathon.id}`,
    deadline: hackathon.deadline,
    deadlineText: hackathon.deadline_text,
    verified: hackathon.verified,
  });
  const bounty = props.bounties[0];
  if (bounty) signals.push({
    id: bounty.id,
    name: bounty.name,
    organizer: bounty.organizer,
    type: 'Bounty',
    href: `/bounty/${bounty.id}`,
    deadline: bounty.deadline,
    deadlineText: bounty.deadline_text,
    verified: bounty.verified,
  });
  const grant = props.grants[0];
  if (grant) signals.push({
    id: grant.id,
    name: grant.name,
    organizer: grant.organizer,
    type: 'Grant',
    href: `/grant/${grant.id}`,
    deadline: grant.deadline,
    deadlineText: grant.deadline_text,
    verified: grant.verified,
  });
  const program = props.programs[0];
  if (program) signals.push({
    id: program.id,
    name: program.name,
    organizer: program.organizer,
    type: 'Program',
    href: `/program/${program.id}`,
    deadline: program.deadline,
    deadlineText: program.deadline_text,
    verified: program.verified,
  });
  const job = props.jobs[0];
  if (job) signals.push({
    id: job.id,
    name: job.title,
    organizer: job.company,
    type: 'Job',
    href: `/job/${job.id}`,
    deadline: job.deadline,
    deadlineText: job.deadline_text,
    verified: job.verified,
  });
  return signals.slice(0, 4);
}

function CompassMark() {
  return (
    <div className="opportunity-field__compass" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function OpportunityField(props: OpportunityFieldProps) {
  const signals = signalsFrom(props);

  return (
    <section className="opportunity-field" aria-labelledby="opportunity-field-title">
      <div className="opportunity-field__intro">
        <div>
          <p className="opportunity-field__eyebrow">Current catalogue</p>
          <h2 id="opportunity-field-title">Browse what is open</h2>
          <p className="opportunity-field__description">
            Explore hackathons, bounties, grants, programs, and jobs in one place.
          </p>
        </div>
        <p className="opportunity-field__freshness">Verified listings · live catalogue</p>
      </div>

      <div className="opportunity-field__panel">
        <div className="opportunity-field__radar" aria-hidden="true">
          <div className="opportunity-field__radar-ring opportunity-field__radar-ring--outer" />
          <div className="opportunity-field__radar-ring opportunity-field__radar-ring--middle" />
          <div className="opportunity-field__radar-ring opportunity-field__radar-ring--inner" />
          <div className="opportunity-field__radar-sweep" />
          <CompassMark />
          {signals.map((signal, index) => (
            <span
              className={`opportunity-field__dot opportunity-field__dot--${index + 1}`}
              key={signal.id}
            />
          ))}
        </div>

        <div className="opportunity-field__list">
          {signals.length === 0 ? (
            <div className="opportunity-field__empty">
              <p>No opportunities are available right now.</p>
              <span>Check back soon. We update regularly.</span>
            </div>
          ) : signals.map((signal, index) => (
            <Link className="opportunity-field__item" href={signal.href} key={signal.id}>
              <span className="opportunity-field__index">0{index + 1}</span>
              <span className="opportunity-field__item-body">
                <strong>{signal.name}</strong>
                <span>{signal.organizer} · {signal.type}</span>
              </span>
              <span className="opportunity-field__item-meta">
                <span className={signal.verified ? 'opportunity-field__status opportunity-field__status--verified' : 'opportunity-field__status'}>
                  {signal.verified ? 'Verified' : 'Review'}
                </span>
                <small>{deadlineLabel(signal)}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
