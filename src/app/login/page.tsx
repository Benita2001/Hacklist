import Link from 'next/link';
import { LoginForm } from './LoginForm';

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === 'string' && params.next.startsWith('/') && !params.next.startsWith('//') ? params.next : '/';

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '96px 24px' }}>
      <p style={{ marginBottom: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px' }}>Account</p>
      <h1 className="font-serif" style={{ margin: '0 0 16px', fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 400 }}>Sign in to save opportunities.</h1>
      <p style={{ maxWidth: '560px', margin: '0 0 32px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Use a verified email to save opportunities, follow updates, and manage alerts.</p>
      <LoginForm nextPath={nextPath} initialError={params.error} />
      <p style={{ marginTop: '28px', fontSize: '13px', color: 'var(--color-text-muted)' }}><Link href={nextPath}>Continue browsing</Link></p>
    </main>
  );
}
