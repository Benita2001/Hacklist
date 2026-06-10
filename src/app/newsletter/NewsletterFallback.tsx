'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function NewsletterFallback() {
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder — replace with Brevo API call or remove once embed is live
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-3)]">
      <Input
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        type="email"
        showIcon={false}
      />
      <Button variant="primary" size="lg" className="w-full">
        Subscribe
      </Button>
    </form>
  );
}
