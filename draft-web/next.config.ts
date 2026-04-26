import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const securityHeaders = [
  // Prevents browsers from MIME-sniffing a response away from the declared content-type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevents the app from being embedded in an iframe (clickjacking protection).
  { key: "X-Frame-Options", value: "DENY" },
  // Controls how much referrer info is included with requests leaving the site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables browser features the app doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
