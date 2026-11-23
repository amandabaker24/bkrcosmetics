import type { Metadata } from "next";
import { PageIntro } from "@/components/site";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = { title: "Contact" };
export default function ContactPage() {
  return <><PageIntro label="Contact" title="Let’s Hear From You.">Have a question about the research, our product concepts, or your email preferences?</PageIntro><div className="prose-copy surface"><ContactForm /></div></>;
}
