// src/app/components/SEO.tsx
// Usage: drop <SEO title="..." description="..." /> at the top of any page component
// Requires: npm install react-helmet-async
// Also wrap your app root with <HelmetProvider> from react-helmet-async

import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

export function SEO({ title, description, canonical, ogImage }: SEOProps) {
  const fullTitle = `${title} | Campus Guide`;
  const image = ogImage ?? "https://campusguide.ng/icon-512x512.png";
  const url = canonical ?? "https://campusguide.ng";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
