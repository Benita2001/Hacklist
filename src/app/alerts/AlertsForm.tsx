'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { OpportunityType } from '@/domain/opportunities/types';

const options: Array<{ value: OpportunityType; label: string }> = [
  { value: 'hackathon', label: 'Hackathons' },
  { value: 'bounty', label: 'Bounties' },
  { value: 'grant', label: 'Grants' },
  { value: 'program', label: 'Programs' },
  { value: 'job', label: 'Jobs' },
];

export function AlertsForm() {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<OpportunityType[]>(['hackathon']);
  const [cadence, setCadence] = useState('immediate');
  const [normalAlerts, setNormalAlerts] = useState(true);
  const [provisionalAlerts, setProvisionalAlerts] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [timezone, setTimezone] = useState('UTC');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  function toggleType(type: OpportunityType) {
    setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/me/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_types: selectedTypes,
          cadence,
          normal_alerts: normalAlerts,
          provisional_alerts: provisionalAlerts,
          quiet_hours: quietHoursEnabled ? { start: quietStart, end: quietEnd, timezone } : {},
          return_to: '/alerts',
        }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };
      if (response.status === 401) {
        router.push('/login?next=%2Falerts');
        return;
      }
      if (!response.ok || !body.ok) {
        setMessage(body.error === 'invalid_alert_preferences' ? 'Check the alert settings and try again.' : 'Alert settings are temporarily unavailable.');
        return;
      }
      setMessage('Alert preferences saved.');
    } catch {
      setMessage('Alert settings are temporarily unavailable.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="alerts-form" onSubmit={save}>
      <fieldset>
        <legend>Opportunity types</legend>
        <div className="alerts-form__choices">
          {options.map((option) => (
            <label className="alerts-form__choice" key={option.value}>
              <input type="checkbox" checked={selectedTypes.includes(option.value)} onChange={() => toggleType(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="alerts-form__field" htmlFor="alert-cadence">
        <span>Delivery cadence</span>
        <select id="alert-cadence" value={cadence} onChange={(event) => setCadence(event.target.value)}>
          <option value="immediate">Immediate</option>
          <option value="daily">Daily digest</option>
          <option value="weekly">Weekly digest</option>
        </select>
      </label>

      <fieldset>
        <legend>Alert permissions</legend>
        <label className="alerts-form__choice">
          <input type="checkbox" checked={normalAlerts} onChange={(event) => setNormalAlerts(event.target.checked)} />
          <span>Normal verified and registration-open alerts</span>
        </label>
        <label className="alerts-form__choice">
          <input type="checkbox" checked={provisionalAlerts} onChange={(event) => setProvisionalAlerts(event.target.checked)} />
          <span>Provisional alerts from strong official signals</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Quiet hours</legend>
        <label className="alerts-form__choice">
          <input type="checkbox" checked={quietHoursEnabled} onChange={(event) => setQuietHoursEnabled(event.target.checked)} />
          <span>Pause delivery during quiet hours</span>
        </label>
        {quietHoursEnabled && (
          <div className="alerts-form__quiet-grid">
            <label className="alerts-form__field" htmlFor="quiet-start"><span>Start</span><input id="quiet-start" type="time" value={quietStart} onChange={(event) => setQuietStart(event.target.value)} /></label>
            <label className="alerts-form__field" htmlFor="quiet-end"><span>End</span><input id="quiet-end" type="time" value={quietEnd} onChange={(event) => setQuietEnd(event.target.value)} /></label>
            <label className="alerts-form__field" htmlFor="quiet-timezone"><span>Timezone</span><input id="quiet-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Africa/Lagos" /></label>
          </div>
        )}
      </fieldset>

      <button className="alerts-form__submit" type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save alert preferences'}</button>
      {message && <p className="alerts-form__message" role="status">{message}</p>}
      <p className="alerts-form__note"><Link href="/login?next=%2Falerts">Sign in</Link> with a verified email before saving alert preferences.</p>
    </form>
  );
}
