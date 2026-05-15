import type { Metadata } from 'next';
import { AboutClient } from './AboutClient';

export const metadata: Metadata = {
  title: 'About',
  description: 'HackList is a prize-first, deadline-sorted hackathon discovery aggregator built for builders.',
};

export default function AboutPage() {
  return <AboutClient />;
}
