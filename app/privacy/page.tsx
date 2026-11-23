import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site";
import { AnalyticsPreferences } from "@/components/analytics";

export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return <><PageIntro label="Privacy" title="Your Information." /><article className="prose-copy">
    <p>This draft describes the prelaunch research platform. The legal entity, mailing address, and final retention periods are pending and will be added before public launch.</p>
    <h2>Research Participation</h2><p>We store questionnaire answers, concept feedback, optional demographics, and campaign attribution to understand skincare preferences. A first-party research cookie helps you resume an incomplete survey and reduces repeat submissions. We ask that you keep identifying or medical details out of free-text fields.</p>
    <h2>Email and Contact</h2><p>When you join the waitlist, we store your email, optional name, and marketing choice. We use Resend to deliver confirmation emails, handle contact messages, and send welcome emails and marketing updates after you opt in and confirm your address. Use the link in our emails to <Link href="/unsubscribe">unsubscribe</Link>.</p>
    <h2>Verification and Optional Analytics</h2><p>Cloudflare Turnstile helps verify submissions when enabled. When you opt in to analytics, we send site interaction events to PostHog. Survey answers, free-text messages, and email addresses are excluded from these events.</p>
    <AnalyticsPreferences />
    <h2>Privacy Requests</h2><p>Use our <Link href="/contact">contact form</Link> to ask about your information or make a privacy request.</p>
  </article></>;
}
