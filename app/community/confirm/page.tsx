import type { Metadata } from "next";
import { PageIntro } from "@/components/site";
import { EmailPreference } from "@/components/forms";

export const metadata: Metadata = { title: "Confirm Your Email", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function ConfirmPage() {
  return <><PageIntro label="The founding community" title="Confirm Your Email." /><div className="prose-copy surface"><EmailPreference type="confirm" /></div></>;
}
