import type { Metadata } from "next";
import { PageIntro } from "@/components/site";
import { EmailPreference } from "@/components/forms";

export const metadata: Metadata = { title: "Email Preferences", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function UnsubscribePage() {
  return <><PageIntro label="The founding community" title="Email Preferences." /><div className="prose-copy surface"><EmailPreference type="unsubscribe" /></div></>;
}
