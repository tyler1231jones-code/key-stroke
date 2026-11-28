// What search engines and link previews are told about each page: its
// canonical address, its share image, and structured data as JSON-LD.
//
// Rules this file keeps:
//   - No review or rating markup of any kind.
//   - No markup that presents a case as real work: the cases are mock until
//     demo mode is off, so they are never described in structured data.
//   - Location and service area are stated only once the principals have set
//     them in site.json. The firm is based in Brisbane and serves all of
//     Australia (owner, 28 November 2026), so the area served is the country
//     and the address names the city only: no street is published.
import faqsJson from '../content/faqs.json';
import socialJson from '../content/social.json';
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
export const ORG = abs('/#organization');
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

// The area served is the whole country: the firm works with businesses across
// Australia from Brisbane. serviceArea in site.json is the words the footer
// shows; for search engines it is the country, so the city never narrows it.
const AREA = { '@type': 'Country', name: 'Australia' };
const place = () => ({
  areaServed: AREA,
  ...(has('location')
    ? { address: { '@type': 'PostalAddress', addressLocality: site.location, ...(site.region ? { addressRegion: site.region } : {}), addressCountry: 'AU' } }
    : {}),
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
    // The profiles that point back to the site, so search engines know they are the same business.
    ...(Object.values(socialJson.profiles).length ? { sameAs: Object.values(socialJson.profiles) } : {}),
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
    areaServed: AREA,
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

/** The Savers plans as offers. Only while their prices are on show. */
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
        name: `Keystroke Savers ${t.name}: ${t.hours} hours a month`,
        description: `${t.hours} hours of our time a month, for any of our services. ${t.suits}`,
        url: abs('/savers'),
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price,
          priceCurrency: 'AUD',
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
