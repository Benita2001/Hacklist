import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { AlertsForm } from './AlertsForm';

export const metadata: Metadata = {
  title: 'Alert settings',
  description: 'Manage verified email alerts for HackList opportunities.',
};

export default function AlertsPage() {
  return (
    <PageShell>
      <div className="alerts-page">
        <Link className="alerts-page__back" href="/">Back to opportunities</Link>
        <p className="alerts-page__eyebrow">Account / alert settings</p>
        <h1>Choose the opportunities worth a notification.</h1>
        <p className="alerts-page__lede">Save verified email preferences for the five HackList opportunity types. Provisional alerts stay off until you opt in.</p>
        <AlertsForm />
      </div>
    </PageShell>
  );
}
