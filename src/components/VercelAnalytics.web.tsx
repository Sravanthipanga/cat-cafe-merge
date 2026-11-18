import { Analytics } from '@vercel/analytics/react';

/**
 * Vercel Web Analytics — web variant.
 *
 * Metro resolves this file instead of VercelAnalytics.tsx when bundling
 * for web, so the web-only @vercel/analytics package never enters a
 * native bundle. Renders the real <Analytics /> component, which loads
 * the Vercel insights script and reports page views for the deployment
 * where Web Analytics is enabled in the Vercel dashboard.
 */
export default function VercelAnalytics() {
  return <Analytics />;
}
