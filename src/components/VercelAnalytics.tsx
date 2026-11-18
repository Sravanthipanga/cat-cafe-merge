/**
 * Vercel Web Analytics — native (iOS/Android) variant.
 *
 * @vercel/analytics is web-only, so on native this is a no-op.
 * Metro picks VercelAnalytics.web.tsx instead when bundling for web.
 */
export default function VercelAnalytics() {
  return null;
}
