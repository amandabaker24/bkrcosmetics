import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site";

export const metadata: Metadata = { title: "Terms of Use" };
export default function TermsPage() {
  return <><PageIntro label="Terms of use" title="Participating in Our Research." /><article className="prose-copy">
    <p>These draft terms cover the prelaunch site. The operating entity, governing law, and effective date are pending and will be added before public launch.</p>
    <h2>Product Concepts</h2><p>Concept images, potential ingredients, intended finishes, and suggested prices represent early development ideas. Formulations and plans may change as we learn more.</p>
    <h2>Submitting Feedback</h2><p>Participation is voluntary. Please share your own opinions and avoid submitting personal details about others. We use submissions to guide skincare development and improve the research experience.</p>
    <h2>Questions</h2><p>For information about your data, see our <Link href="/privacy">privacy policy</Link>. For other questions, <Link href="/contact">contact us</Link>.</p>
  </article></>;
}
