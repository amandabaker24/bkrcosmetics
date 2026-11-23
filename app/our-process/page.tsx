import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Our Process" };
export default function ProcessPage() {
  return <>
    <PageIntro label="Our process" title="From Your Routine to Our Lab.">We’re at the research stage. Your feedback will help us decide which ideas to develop further.</PageIntro>
    <div className="prose-copy">
      <h2>Listening</h2><p>We’re learning where everyday skincare falls short, from how a formula sits under makeup to how much people would realistically pay for it.</p>
      <h2>Prioritizing Concepts</h2><p>We’ll review the survey and product lab feedback to identify which textures, finishes, and price ranges deserve a closer look.</p>
      <h2>Exploring Formulations</h2><p>We’ll explore ingredients and textures, then plan testing for tolerability, the feel of each formula, and the visible effects we set out to study. We’ll share what we learn as development progresses.</p>
      <Button asChild><Link href="/product-lab">Explore the Product Lab</Link></Button>
    </div>
  </>;
}
