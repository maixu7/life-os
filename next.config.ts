import type { NextConfig } from "next";

const prod = process.env.NODE_ENV === "production";

// Content Security Policy: the page may only run code from this site (plus the
// OCR library from jsDelivr), can't be put inside another site's frame, and
// can't send forms anywhere else. Pictures and lookups (Open Food Facts,
// Wikipedia) may come from any https site.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net${prod ? "" : " 'unsafe-eval'"}`,
  "worker-src 'self' blob: https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https: blob: data:${prod ? "" : " ws: http://localhost:*"}`,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  ...(prod ? ["upgrade-insecure-requests"] : []),
].join("; ");

const security = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), bluetooth=(), serial=(), hid=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't tell attackers what the site runs on
  productionBrowserSourceMaps: false, // ship only minified code, never the readable source
  compiler: { removeConsole: prod ? { exclude: ["error"] } : false },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      // Private data must never be kept in shared caches.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }] },
    ];
  },
};

export default nextConfig;
