import { formatDate } from '@/lib/utils';
import { OpportunityIntentActions } from './OpportunityIntentActions';

type OpportunityTrustPanelProps = {
  organizer: string;
  verified: boolean;
  applicationUrl: string | null;
  deadline: string | null;
  deadlineText: string | null;
  opportunityId: string;
  returnTo: string;
};

function deadlineLabel(deadline: string | null, deadlineText: string | null): string {
  return deadline ? formatDate(deadline) : deadlineText ?? 'Not announced yet';
}

export function OpportunityTrustPanel({
  organizer,
  verified,
  applicationUrl,
  deadline,
  deadlineText,
  opportunityId,
  returnTo,
}: OpportunityTrustPanelProps) {
  return (
    <aside className="opportunity-trust-panel" aria-labelledby="opportunity-trust-title">
      <div>
        <p className="opportunity-trust-panel__eyebrow">Listing record</p>
        <h2 id="opportunity-trust-title">Check the details before you apply</h2>
      </div>
      <dl className="opportunity-trust-panel__facts">
        <div>
          <dt>Listing status</dt>
          <dd>{verified ? 'Verified' : 'Review required'}</dd>
        </div>
        <div>
          <dt>Organizer</dt>
          <dd>{organizer}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{deadlineLabel(deadline, deadlineText)}</dd>
        </div>
        <div>
          <dt>Application page</dt>
          <dd>
            {applicationUrl ? (
              <a href={applicationUrl} target="_blank" rel="noopener noreferrer">Open organizer page</a>
            ) : 'Not announced yet'}
          </dd>
        </div>
      </dl>
      <p className="opportunity-trust-panel__note">
        Confirm the final terms on the organizer&apos;s page before applying.
      </p>
      <OpportunityIntentActions opportunityId={opportunityId} returnTo={returnTo} />
    </aside>
  );
}
