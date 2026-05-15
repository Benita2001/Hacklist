'use client';

import { useState, useRef } from 'react';

interface FormData {
  hackathon_name: string;
  organizer: string;
  prize_pool: string;
  deadline: string;
  apply_url: string;
  category: 'AI' | 'Web3' | 'Both' | '';
  format: 'Online' | 'In-Person' | 'Hybrid' | '';
  free_to_enter: 'Yes' | 'No' | '';
  is_organizer: 'Yes' | 'No' | '';
  description: string;
  your_name: string;
  your_email: string;
  telegram_handle: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

/* Layout-only — colors live in globals.css .form-input */
const inputBase: React.CSSProperties = {
  width:         '100%',
  padding:       '14px 16px',
  borderRadius:  '10px',
  fontSize:      'var(--text-sm)',
  lineHeight:    'var(--leading-normal)',
  transition:    'border-color var(--duration-base), background-color var(--duration-base)',
};

const labelBase: React.CSSProperties = {
  display:       'block',
  fontSize:      '13px',
  fontWeight:    500,
  marginBottom:  '8px',
};

const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color:    'var(--color-danger-text)',
  marginTop: '6px',
};

const fieldGap: React.CSSProperties = { marginBottom: '20px' };

function RadioPills<T extends string>({
  options,
  value,
  onChange,
  error,
}: {
  options: readonly T[];
  value: T | '';
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              data-active={active}
              className="form-radio-pill"
              style={{
                padding:       '8px 18px',
                borderRadius:  '50px',
                fontSize:      '13px',
                fontWeight:    500,
                cursor:        'pointer',
                transition:    'background-color var(--duration-base), color var(--duration-base), border-color var(--duration-base)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error && <p style={errorStyle}>{error}</p>}
    </>
  );
}

const EMPTY: FormData = {
  hackathon_name: '',
  organizer:      '',
  prize_pool:     '',
  deadline:       '',
  apply_url:      '',
  category:       '',
  format:         '',
  free_to_enter:  '',
  is_organizer:   '',
  description:    '',
  your_name:      '',
  your_email:     '',
  telegram_handle: '',
};

function validate(f: FormData): FormErrors {
  const e: FormErrors = {};
  if (!f.hackathon_name.trim()) e.hackathon_name = 'Required';
  if (!f.organizer.trim())      e.organizer      = 'Required';
  if (!f.apply_url.trim())      e.apply_url      = 'Required';
  else if (!/^https:\/\/.+/.test(f.apply_url.trim())) e.apply_url = 'Must start with https://';
  if (!f.category)              e.category       = 'Required';
  if (!f.format)                e.format         = 'Required';
  if (!f.free_to_enter)         e.free_to_enter  = 'Required';
  if (!f.is_organizer)          e.is_organizer   = 'Required';
  if (!f.your_name.trim())      e.your_name      = 'Required';
  if (!f.your_email.trim())     e.your_email     = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.your_email.trim())) e.your_email = 'Must be a valid email address';
  if (f.description.length > 200) e.description = 'Max 200 characters';
  return e;
}

export function SubmitForm() {
  const [form, setForm]             = useState<FormData>(EMPTY);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const firstErrorRef               = useRef<HTMLDivElement>(null);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.status === 429) {
        setErrors({ hackathon_name: 'Too many submissions. Please try again later.' });
        return;
      }

      if (res.status === 400) {
        const data = await res.json() as { errors?: FormErrors };
        if (data.errors) {
          setErrors(data.errors);
          setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        }
        return;
      }

      if (!res.ok) {
        setErrors({ hackathon_name: 'Something went wrong. Please try again.' });
        return;
      }

      setSubmitted(true);
    } catch {
      setErrors({ hackathon_name: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          textAlign:    'center',
          padding:      'var(--space-12) var(--space-6)',
          borderRadius: '16px',
        }}
        className="submit-info-card"
      >
        <div
          style={{
            width: '52px', height: '52px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-5)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 11L8.5 15.5L18 6" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3
          className="font-serif"
          style={{ fontSize: 'var(--text-2xl)', fontWeight: 400, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.01em' }}
        >
          Submission received.
        </h3>
        <p className="submit-info-card-text" style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', maxWidth: '380px', margin: '0 auto' }}>
          We&apos;ll review your listing and reach back to you via Telegram or Email within 12 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>

      <p className="form-section-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginBottom: 'var(--space-5)' }}>
        About the Hackathon
      </p>

      <div ref={Object.keys(errors).length > 0 ? firstErrorRef : null} style={fieldGap}>
        <label htmlFor="hackathon_name" className="form-label" style={labelBase}>Hackathon Name *</label>
        <input
          id="hackathon_name"
          type="text"
          value={form.hackathon_name}
          onChange={e => set('hackathon_name', e.target.value)}
          placeholder="e.g. Agora Agents Hackathon"
          className="form-input"
          style={inputBase}
        />
        {errors.hackathon_name && <p style={errorStyle}>{errors.hackathon_name}</p>}
      </div>

      <div style={fieldGap}>
        <label htmlFor="organizer" className="form-label" style={labelBase}>Organizer *</label>
        <input
          id="organizer"
          type="text"
          value={form.organizer}
          onChange={e => set('organizer', e.target.value)}
          placeholder="e.g. Agora Labs"
          className="form-input"
          style={inputBase}
        />
        {errors.organizer && <p style={errorStyle}>{errors.organizer}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', ...fieldGap }}>
        <div>
          <label htmlFor="prize_pool" className="form-label" style={labelBase}>Prize Pool</label>
          <input
            id="prize_pool"
            type="text"
            value={form.prize_pool}
            onChange={e => set('prize_pool', e.target.value)}
            placeholder="$50,000 or NVIDIA DGX Spark"
            className="form-input"
            style={inputBase}
          />
        </div>
        <div>
          <label htmlFor="deadline" className="form-label" style={labelBase}>Submission Deadline</label>
          <input
            id="deadline"
            type="date"
            value={form.deadline}
            onChange={e => set('deadline', e.target.value)}
            className="form-input"
            style={inputBase}
          />
        </div>
      </div>

      <div style={fieldGap}>
        <label htmlFor="apply_url" className="form-label" style={labelBase}>Apply URL *</label>
        <input
          id="apply_url"
          type="url"
          value={form.apply_url}
          onChange={e => set('apply_url', e.target.value)}
          placeholder="https://..."
          className="form-input"
          style={inputBase}
        />
        {errors.apply_url && <p style={errorStyle}>{errors.apply_url}</p>}
      </div>

      <div style={fieldGap}>
        <label className="form-label" style={labelBase}>Category *</label>
        <RadioPills options={['AI', 'Web3', 'Both'] as const} value={form.category} onChange={v => set('category', v)} error={errors.category} />
      </div>

      <div style={fieldGap}>
        <label className="form-label" style={labelBase}>Format *</label>
        <RadioPills options={['Online', 'In-Person', 'Hybrid'] as const} value={form.format} onChange={v => set('format', v)} error={errors.format} />
      </div>

      <div style={fieldGap}>
        <label className="form-label" style={labelBase}>Free to Enter? *</label>
        <RadioPills options={['Yes', 'No'] as const} value={form.free_to_enter} onChange={v => set('free_to_enter', v)} error={errors.free_to_enter} />
      </div>

      <div style={{ ...fieldGap, marginBottom: '32px' }}>
        <label htmlFor="description" className="form-label" style={labelBase}>
          Description
          <span className="form-char-count" style={{ fontWeight: 400, marginLeft: '6px' }}>
            ({form.description.length}/200)
          </span>
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="One or two sentences describing the hackathon focus and who it is for."
          rows={3}
          className="form-input"
          style={{ ...inputBase, resize: 'vertical', minHeight: '88px' }}
        />
        {errors.description && <p style={errorStyle}>{errors.description}</p>}
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border-muted)', marginBottom: '28px' }} />

      <p className="form-section-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginBottom: 'var(--space-5)' }}>
        About You
      </p>

      <div style={fieldGap}>
        <label className="form-label" style={labelBase}>Are you the organizer? *</label>
        <RadioPills options={['Yes', 'No'] as const} value={form.is_organizer} onChange={v => set('is_organizer', v)} error={errors.is_organizer} />
      </div>

      <div style={fieldGap}>
        <label htmlFor="your_name" className="form-label" style={labelBase}>Your Name *</label>
        <input
          id="your_name"
          type="text"
          value={form.your_name}
          onChange={e => set('your_name', e.target.value)}
          placeholder="Full name"
          className="form-input"
          style={inputBase}
        />
        {errors.your_name && <p style={errorStyle}>{errors.your_name}</p>}
      </div>

      <div style={fieldGap}>
        <label htmlFor="your_email" className="form-label" style={labelBase}>Email Address *</label>
        <input
          id="your_email"
          type="email"
          value={form.your_email}
          onChange={e => set('your_email', e.target.value)}
          placeholder="you@example.com"
          className="form-input"
          style={inputBase}
        />
        {errors.your_email && <p style={errorStyle}>{errors.your_email}</p>}
      </div>

      <div style={{ ...fieldGap, marginBottom: '32px' }}>
        <label htmlFor="telegram_handle" className="form-label" style={labelBase}>Telegram Handle</label>
        <input
          id="telegram_handle"
          type="text"
          value={form.telegram_handle}
          onChange={e => set('telegram_handle', e.target.value)}
          placeholder="@yourhandle"
          className="form-input"
          style={inputBase}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width:           '100%',
          padding:         '16px var(--space-6)',
          borderRadius:    '50px',
          backgroundColor: submitting ? 'var(--color-moss-light)' : 'var(--color-moss)',
          color:           'var(--btn-primary-text)',
          fontSize:        'var(--text-base)',
          fontWeight:      500,
          border:          'none',
          cursor:          submitting ? 'not-allowed' : 'pointer',
          transition:      'background-color var(--duration-base)',
        }}
        onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss-light)'; }}
        onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-moss)'; }}
      >
        {submitting ? 'Submitting...' : 'Submit Opportunity →'}
      </button>

      <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Reviewed within 12 hours.
      </p>
    </form>
  );
}
