// What search engines and link previews are told about each page: its
// canonical address, its share image, and structured data as JSON-LD.
//
// Rules this file keeps:
//   - No review or rating markup of any kind.
//   - No markup that presents a case as real work: the cases are mock until
//     demo mode is off, so they are never described in structured data.
//   - Location and service area are stated only once the principals have set
//     them in site.json. Until then the area served is Australia, which the
//     site already says. No town is guessed.
import faqsJson from '../content/faqs.json';
import { site, services, products, origin, has, serviceHref, type Service } from './data';

export interface Crumb {
  name: string;
  href: string;
}
export interface Faq {
  q: string;
  a: string;
}

const base = origin ?? '';
export const abs = (path: string): string => `${base}${path}`;
const ORG = abs('/#organization');
const SITE = abs('/#website');

/** "/services/x" -> "services-x"; "/" -> "home". Names the share image for a page. */
export function shareKey(pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
  return clean === '' ? 'home' : clean.replace(/\//g, '-');
}

/** The questions on a page that have an answer. Unanswered ones stay off the page. */
export function faqsFor(page: string): Faq[] {
  const list = (faqsJson as Record<string, unknown>)[page];
  if (!Array.isArray(list)) return [];
  return (list as Faq[]).filter((f) => f.a && f.a !== 'TODO');
}

// Until a service area is set, the country is stated: the site says the firm is
// Australian owned and works with Australian businesses. No town is guessed.
const place = () => ({
  areaServed: has('serviceArea') ? site.serviceArea : { '@type': 'Country', name: 'Australia' },
  ...(has('location') ? { address: { '@type': 'PostalAddress', addressLocality: site.location, addressCountry: 'AU' } } : {}),
});

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG,
    name: site.name,
    url: abs('/'),
    logo: abs('/og/logo.png'),
    description: site.description,
    slogan: site.tagline,
    // What the firm does, in the words a search engine or an AI tool can match a question to.
    knowsAbout: [...services.map((s) => s.name), ...services.flatMap((s) => s.products.map((p) => p.name))],
    ...(has('email') ? { email: site.email } : {}),
    ...place(),
  };
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE,
    url: abs('/'),
    name: site.name,
    description: site.description,
    inLanguage: 'en-AU',
    publisher: { '@id': ORG },
  };
}

/** The business as a service provider: on the homepage and the contact page. */
export function professionalService(pathname: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': abs('/#business'),
    name: site.name,
    url: abs('/'),
    image: abs(`/og/${shareKey(pathname)}.png`),
    description: site.description,
    parentOrganization: { '@id': ORG },
    ...(has('email') ? { email: site.email } : {}),
    ...place(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.what, url: abs(serviceHref(s)) },
      })),
    },
  };
}

export function serviceSchema(s: Service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': abs(`${serviceHref(s)}#service`),
    name: s.name,
    serviceType: s.name,
    description: s.what,
    url: abs(serviceHref(s)),
    provider: { '@id': ORG },
    ...(has('serviceArea') ? { areaServed: site.serviceArea } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: s.name,
      itemListElement: s.products.map((p) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: p.name, description: p.line },
      })),
    },
  };
}

/** The three Savers plans as offers. Only while their prices are on show. */
export function saversSchema() {
  if (!products.display.savers) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': abs('/savers#service'),
    name: 'Keystroke Savers',
    description: products.savers.what,
    url: abs('/savers'),
    provider: { '@id': ORG },
    offers: products.savers.tiers.map((t) => {
      const price = Number(t.monthly.replace(/[^\d.]/g, ''));
      return {
        '@type': 'Offer',
        name: t.name,
        description: `${t.hours} hours a month. ${t.suits}`,
        url: abs('/savers'),
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price,
          priceCurrency: 'AUD',
          valueAddedTaxIncluded: false,
          unitCode: 'MON',
          unitText: 'month',
        },
      };
    }),
  };
}

export function faqSchema(list: Faq[]) {
  if (!list.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbs(crumbs: Crumb[]) {
  if (!crumbs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', href: '/' }, ...crumbs].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.href),
    })),
  };
}

/** Titles are kept to 60 characters: the name is added only when it fits. */
export function fullTitle(title: string): string {
  if (title.includes(site.name)) return title;
  const withName = `${title} | ${site.name}`;
  return withName.length <= 60 ? withName : title;
}
