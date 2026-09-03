export type CountryCode = string;

const countryAliases: Record<string, CountryCode> = {
  afghanistan: 'AF',
  antarctica: 'AQ',
  belarus: 'BY',
  brazil: 'BR',
  canada: 'CA',
  china: 'CN',
  crimea: 'UA-CRIMEA',
  cuba: 'CU',
  djibouti: 'DJ',
  donetsk: 'UA-DONETSK',
  germany: 'DE',
  ghana: 'GH',
  'hong kong': 'HK',
  india: 'IN',
  iran: 'IR',
  iraq: 'IQ',
  italy: 'IT',
  kazakhstan: 'KZ',
  kenya: 'KE',
  luhansk: 'UA-LUHANSK',
  mozambique: 'MZ',
  nigeria: 'NG',
  'north korea': 'KP',
  quebec: 'CA-QC',
  'republic of ghana': 'GH',
  russia: 'RU',
  somalia: 'SO',
  sudan: 'SD',
  syria: 'SY',
  tanzania: 'TZ',
  'united republic of tanzania': 'TZ',
  'united states': 'US',
  usa: 'US',
  venezuela: 'VE',
  vietnam: 'VN',
  'western sahara': 'EH',
};

const alpha2Codes = new Set(Object.values(countryAliases).filter((code) => /^[A-Z]{2}$/.test(code)));

export const reusableCountrySets: Record<string, Set<CountryCode>> = {
  openai_api_supported_reviewed_subset: new Set([
    'CA',
    'DE',
    'GH',
    'IN',
    'KE',
    'MZ',
    'NG',
    'TZ',
    'US',
  ]),
};

export function normalizeCountry(input?: string | null): CountryCode | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ');

  return countryAliases[normalized] ?? null;
}

export function normalizeCountryList(countries: string[] = []): CountryCode[] {
  return countries.map((country) => normalizeCountry(country)).filter((country): country is CountryCode => Boolean(country));
}

export function isRecognizedCountryCode(code: CountryCode): boolean {
  return alpha2Codes.has(code) || code.includes('-');
}
