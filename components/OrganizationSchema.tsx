import Script from 'next/script'

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OnSite Club',
    url: 'https://shop.onsiteclub.ca',
    logo: 'https://shop.onsiteclub.ca/assets/logo-onsite-club.png',
    description:
      'Premium lifestyle apparel brand for construction workers, carpenters, framers, and trades professionals across Canada.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
    },
    sameAs: [
      'https://onsiteclub.ca',
      'https://instagram.com/onsiteclub',
    ],
  }

  return (
    <Script
      id="schema-organization"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
