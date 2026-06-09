'use client';

import { useState, useRef } from 'react';

type OpportunityType = 'Hackathon' | 'Bounty' | 'Grant' | 'Program' | 'Job';

interface FormData {
  opportunity_name: string;
  organizer:        string;
  apply_url:        string;
  category:         'AI' | 'Web3' | 'Both' | '';
  description:      string;
  deadline:         string;
  prize_pool:       string;
  format:           'Online' | 'In-Person' | 'Hybrid' | 'Remote' | '';
  free_to_enter:    'Yes' | 'No' | '';
  reward:           string;
  platform:         string;
  amount:           string;
  ecosystem:        string;
  stipend:          string;
  duration:         string;
  program_type:     'Fellowship' | 'Accelerator' | 'Incubator' | '';
  salary:           string;
  location:         string;
  is_organizer:     'Yes' | 'No' | '';
  your_name:        string;
  your_email:       string;
  telegram_handle:  string;
}

type FormErrors = Partial<Record<keyof FormData | 'opportunity_type', string>>;

const inputBase: React.CSSProperties = {
  width:        '100%',
  padding:      '12px 16px',
  borderRadius: '8px',
  fontSize:     'var(--text-sm)',
  lineHeight:   'var(--leading-normal)',
};

const labelBase: React.CSSProperties = {
  display:      'block',
  fontSize:     '13px',
  fontWeight:   500,
  marginBottom: '8px',
};

const errorStyle: React.CSSProperties = {
  fontSize:  '12px',
  color:     'var(--color-danger-text)',
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
                padding:    '8px 18px',
                borderRadius: '50px',
                fontSize:   '13px',
                fontWeight: 500,
                cursor:     'pointer',
                transition: 'background-color var(--duration-base), color var(--duration-base), border-color var(--duration-base)',
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

const sectionLabels: Record<OpportunityType, string> = {
  Hackathon: 'About the Hackathon',
  Bounty:    'About the Bounty',
  Grant:     'About the Grant',
  Program:   'About the Program',
  Job:       'About the Job',
};

const nameLabelMap: Record<OpportunityType, string> = {
  Hackathon: 'Hackathon Name *',
  Bounty:    'Bounty Name *',
  Grant:     'Grant Name *',
  Program:   'Program Name *',
  Job:       'Job Title *',
};

const namePlaceholderMap: Record<OpportunityType, string> = {
  Hackathon: 'e.g. Agora Agents Hackathon',
  Bounty:    'e.g. Smart Contract Audit Bounty',
  Grant:     'e.g. Solana Foundation Grant',
  Program:   'e.g. a16z Crypto Startup School',
  Job:       'e.g. Senior AI Engineer',
};

const organizerLabelMap: Record<OpportunityType, string> = {
  Hackathon: 'Organizer *',
  Bounty:    'Organizer *',
  Grant:     'Organizer *',
  Program:   'Organizer *',
  Job:       'Company *',
};

const descPlaceholderMap: Record<OpportunityType, string> = {
  Hackathon: 'One or two sentences describing the hackathon focus and who it is for.',
  Bounty:    'One or two sentences describing the bounty task and requirements.',
  Grant:     'One or two sentences describing the grant focus and eligibility.',
  Program:   'One or two sentences describing the program and who it is for.',
  Job:       'One or two sentences describing the role and what you are looking for.',
};

const EMPTY: FormData = {
  opportunity_name: '',
  organizer:        '',
  apply_url:        '',
  category:         '',
  description:      '',
  deadline:         '',
  prize_pool:       '',
  format:           '',
  free_to_enter:    '',
  reward:           '',
  platform:         '',
  amount:           '',
  ecosystem:        '',
  stipend:          '',
  duration:         '',
  program_type:     '',
  salary:           '',
  location:         '',
  is_organizer:     '',
  your_name:        '',
  your_email:       '',
  telegram_handle:  '',
};

function validate(f: FormData, type: OpportunityType | ''): FormErrors {
  const e: FormErrors = {};

  if (!type) {
    e.opportunity_type = 'Please select an opportunity type';
    return e;
  }

  if (!f.opportunity_name.trim()) e.opportunity_name = 'Required';
  if (!f.organizer.trim())        e.organizer        = 'Required';
  if (!f.apply_url.trim())        e.apply_url        = 'Required';
  else if (!/^https:\/\/.+/.test(f.apply_url.trim())) e.apply_url = 'Must start with https://';
  if (!f.category)                e.category         = 'Required';

  if (type !== 'Bounty') {
    if (!f.format) e.format = 'Required';
  }
  if (type === 'Hackathon') {
    if (!f.free_to_enter) e.free_to_enter = 'Required';
  }
  if (type === 'Program') {
    if (!f.program_type) e.program_type = 'Required';
  }

  if (!f.is_organizer)      e.is_organizer = 'Required';
  if (!f.your_name.trim())  e.your_name    = 'Required';
  if (!f.your_email.trim()) e.your_email   = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.your_email.trim())) e.your_email = 'Must be a valid email address';
  if (f.description.length > 200) e.description = 'Max 200 characters';

  return e;
}

export function SubmitForm() {
  const [opportunityType, setOpportunityType] = useState<OpportunityType | ''>('');
  const [form, setForm]             = useState<FormData>(EMPTY);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const firstErrorRef               = useRef<HTMLDivElement>(null);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleTypeChange(t: OpportunityType) {
    setOpportunityType(t);
    setForm(prev => ({
      ...prev,
      opportunity_name: '',
      organizer:        '',
      apply_url:        '',
      category:         '',
      description:      '',
      deadline:         '',
      prize_pool:       '',
      format:           '',
      free_to_enter:    '',
      reward:           '',
      platform:         '',
      amount:           '',
      ecosystem:        '',
      stipend:          '',
      duration:         '',
      program_type:     '',
      salary:           '',
      location:         '',
    }));
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form, opportunityType);
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
        body: JSON.stringify({ ...form, opportunity_type: opportunityType }),
      });

      if (res.status === 429) {
        setErrors({ opportunity_name: 'Too many submissions. Please try again later.' });
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
        setErrors({ opportunity_name: 'Something went wrong. Please try again.' });
        return;
      }

      setSubmitted(true);
    } catch {
      setErrors({ opportunity_name: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)', borderRadius: '16px' }}
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

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Opportunity Type Selector */}
      <div ref={errors.opportunity_type ? firstErrorRef : null} style={fieldGap}>
        <label className="form-label" style={labelBase}>
          What type of opportunity are you listing? *
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(['Hackathon', 'Bounty', 'Grant', 'Program', 'Job'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              data-active={opportunityType === t}
              className="form-radio-pill"
              style={{
                padding:    '8px 18px',
                borderRadius: '50px',
                fontSize:   '13px',
                fontWeight: 500,
                cursor:     'pointer',
                transition: 'background-color var(--duration-base), color var(--duration-base), border-color var(--duration-base)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {errors.opportunity_type && <p style={errorStyle}>{errors.opportunity_type}</p>}
      </div>

      {opportunityType && (
        <>
          <p
            className="form-section-label"
            style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginBottom: 'var(--space-5)', marginTop: 'var(--space-6)' }}
          >
            {sectionLabels[opportunityType]}
          </p>

          {/* Name */}
          <div ref={!errors.opportunity_type && hasErrors ? firstErrorRef : null} style={fieldGap}>
            <label htmlFor="opportunity_name" className="form-label" style={labelBase}>
              {nameLabelMap[opportunityType]}
            </label>
            <input
              id="opportunity_name"
              type="text"
              value={form.opportunity_name}
              onChange={e => set('opportunity_name', e.target.value)}
              placeholder={namePlaceholderMap[opportunityType]}
              className="form-input"
              style={inputBase}
            />
            {errors.opportunity_name && <p style={errorStyle}>{errors.opportunity_name}</p>}
          </div>

          {/* Organizer / Company */}
          <div style={fieldGap}>
            <label htmlFor="organizer" className="form-label" style={labelBase}>
              {organizerLabelMap[opportunityType]}
            </label>
            <input
              id="organizer"
              type="text"
              value={form.organizer}
              onChange={e => set('organizer', e.target.value)}
              placeholder={opportunityType === 'Job' ? 'e.g. OpenAI' : 'e.g. Agora Labs'}
              className="form-input"
              style={inputBase}
            />
            {errors.organizer && <p style={errorStyle}>{errors.organizer}</p>}
          </div>

          {/* Hackathon / Bounty / Grant: value field + deadline in grid */}
          {(opportunityType === 'Hackathon' || opportunityType === 'Bounty' || opportunityType === 'Grant') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', ...fieldGap }}>
              <div>
                {opportunityType === 'Hackathon' && (
                  <>
                    <label htmlFor="prize_pool" className="form-label" style={labelBase}>Prize Pool</label>
                    <input id="prize_pool" type="text" value={form.prize_pool} onChange={e => set('prize_pool', e.target.value)} placeholder="$50,000 or NVIDIA DGX Spark" className="form-input" style={inputBase} />
                  </>
                )}
                {opportunityType === 'Bounty' && (
                  <>
                    <label htmlFor="reward" className="form-label" style={labelBase}>Reward</label>
                    <input id="reward" type="text" value={form.reward} onChange={e => set('reward', e.target.value)} placeholder="$5,000 or Up to $10,000" className="form-input" style={inputBase} />
                  </>
                )}
                {opportunityType === 'Grant' && (
                  <>
                    <label htmlFor="amount" className="form-label" style={labelBase}>Amount</label>
                    <input id="amount" type="text" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. Up to $50,000 or Fully Funded" className="form-input" style={inputBase} />
                  </>
                )}
              </div>
              <div>
                <label htmlFor="deadline" className="form-label" style={labelBase}>
                  {opportunityType === 'Hackathon' ? 'Submission Deadline' : 'Deadline'}
                </label>
                <input id="deadline" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="form-input" style={inputBase} />
              </div>
            </div>
          )}

          {/* Program: Stipend full-width, then Duration + Deadline grid */}
          {opportunityType === 'Program' && (
            <>
              <div style={fieldGap}>
                <label htmlFor="stipend" className="form-label" style={labelBase}>Stipend</label>
                <input id="stipend" type="text" value={form.stipend} onChange={e => set('stipend', e.target.value)} placeholder="e.g. $20,000 or Fully Funded" className="form-input" style={inputBase} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', ...fieldGap }}>
                <div>
                  <label htmlFor="duration" className="form-label" style={labelBase}>Duration</label>
                  <input id="duration" type="text" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 12 weeks, 6 months" className="form-input" style={inputBase} />
                </div>
                <div>
                  <label htmlFor="deadline" className="form-label" style={labelBase}>Deadline</label>
                  <input id="deadline" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="form-input" style={inputBase} />
                </div>
              </div>
            </>
          )}

          {/* Job: Salary only (no deadline) */}
          {opportunityType === 'Job' && (
            <div style={fieldGap}>
              <label htmlFor="salary" className="form-label" style={labelBase}>Salary</label>
              <input id="salary" type="text" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g. $120,000 – $180,000 or Competitive" className="form-input" style={inputBase} />
            </div>
          )}

          {/* Apply URL */}
          <div style={fieldGap}>
            <label htmlFor="apply_url" className="form-label" style={labelBase}>Apply URL *</label>
            <input id="apply_url" type="url" value={form.apply_url} onChange={e => set('apply_url', e.target.value)} placeholder="https://..." className="form-input" style={inputBase} />
            {errors.apply_url && <p style={errorStyle}>{errors.apply_url}</p>}
          </div>

          {/* Category */}
          <div style={fieldGap}>
            <label className="form-label" style={labelBase}>Category *</label>
            <RadioPills options={['AI', 'Web3', 'Both'] as const} value={form.category} onChange={v => set('category', v)} error={errors.category} />
          </div>

          {/* Hackathon: Format + Free to Enter */}
          {opportunityType === 'Hackathon' && (
            <>
              <div style={fieldGap}>
                <label className="form-label" style={labelBase}>Format *</label>
                <RadioPills options={['Online', 'In-Person', 'Hybrid'] as const} value={form.format as 'Online' | 'In-Person' | 'Hybrid' | ''} onChange={v => set('format', v)} error={errors.format} />
              </div>
              <div style={fieldGap}>
                <label className="form-label" style={labelBase}>Free to Enter? *</label>
                <RadioPills options={['Yes', 'No'] as const} value={form.free_to_enter} onChange={v => set('free_to_enter', v)} error={errors.free_to_enter} />
              </div>
            </>
          )}

          {/* Bounty: Platform */}
          {opportunityType === 'Bounty' && (
            <div style={fieldGap}>
              <label htmlFor="platform" className="form-label" style={labelBase}>Platform</label>
              <input id="platform" type="text" value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="e.g. Gitcoin, Superteam, Immunefi" className="form-input" style={inputBase} />
            </div>
          )}

          {/* Grant: Ecosystem + Format */}
          {opportunityType === 'Grant' && (
            <>
              <div style={fieldGap}>
                <label htmlFor="ecosystem" className="form-label" style={labelBase}>Ecosystem</label>
                <input id="ecosystem" type="text" value={form.ecosystem} onChange={e => set('ecosystem', e.target.value)} placeholder="e.g. Solana, Ethereum, General" className="form-input" style={inputBase} />
              </div>
              <div style={fieldGap}>
                <label className="form-label" style={labelBase}>Format *</label>
                <RadioPills options={['Online', 'In-Person'] as const} value={form.format as 'Online' | 'In-Person' | ''} onChange={v => set('format', v)} error={errors.format} />
              </div>
            </>
          )}

          {/* Program: Format + Program Type */}
          {opportunityType === 'Program' && (
            <>
              <div style={fieldGap}>
                <label className="form-label" style={labelBase}>Format *</label>
                <RadioPills options={['Remote', 'In-Person', 'Hybrid'] as const} value={form.format as 'Remote' | 'In-Person' | 'Hybrid' | ''} onChange={v => set('format', v)} error={errors.format} />
              </div>
              <div style={fieldGap}>
                <label className="form-label" style={labelBase}>Program Type *</label>
                <RadioPills options={['Fellowship', 'Accelerator', 'Incubator'] as const} value={form.program_type} onChange={v => set('program_type', v)} error={errors.program_type} />
              </div>
            </>
          )}

          {/* Job: Format + Location */}
          {opportunityType === 'Job' && (
            <>
              <div style={fieldGap}>
                <label className="form-label" style={labelBase}>Format *</label>
                <RadioPills options={['Remote', 'In-Person', 'Hybrid'] as const} value={form.format as 'Remote' | 'In-Person' | 'Hybrid' | ''} onChange={v => set('format', v)} error={errors.format} />
              </div>
              <div style={fieldGap}>
                <label htmlFor="location" className="form-label" style={labelBase}>Location</label>
                <input id="location" type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. San Francisco, CA or Remote" className="form-input" style={inputBase} />
              </div>
            </>
          )}

          {/* Description */}
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
              placeholder={descPlaceholderMap[opportunityType]}
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
            <input id="your_name" type="text" value={form.your_name} onChange={e => set('your_name', e.target.value)} placeholder="Full name" className="form-input" style={inputBase} />
            {errors.your_name && <p style={errorStyle}>{errors.your_name}</p>}
          </div>

          <div style={fieldGap}>
            <label htmlFor="your_email" className="form-label" style={labelBase}>Email Address *</label>
            <input id="your_email" type="email" value={form.your_email} onChange={e => set('your_email', e.target.value)} placeholder="you@example.com" className="form-input" style={inputBase} />
            {errors.your_email && <p style={errorStyle}>{errors.your_email}</p>}
          </div>

          <div style={{ ...fieldGap, marginBottom: '32px' }}>
            <label htmlFor="telegram_handle" className="form-label" style={labelBase}>Telegram Handle</label>
            <input id="telegram_handle" type="text" value={form.telegram_handle} onChange={e => set('telegram_handle', e.target.value)} placeholder="@yourhandle" className="form-input" style={inputBase} />
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
        </>
      )}
    </form>
  );
}
