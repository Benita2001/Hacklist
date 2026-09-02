import { getSupabase } from '@/lib/supabase'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://hacklist.io',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://hacklist.io/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://hacklist.io/submit',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  const supabase = getSupabase();
  if (!supabase) return staticPages;

  const { data: hackathons } = await supabase
    .from('hackathons')
    .select('id, created_at')
    .eq('verified', true)

  const hackathonPages: MetadataRoute.Sitemap = (hackathons || []).map((h) => ({
    url: `https://hacklist.io/hackathon/${h.id}`,
    lastModified: new Date(h.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...hackathonPages]
}
