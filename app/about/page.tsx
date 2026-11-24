import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/site";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Our Vision" };
export default function AboutPage() {
  return <>
    <PageIntro label="Our vision" title="The Science of Renewal.">bkr is developing luxury, science-inspired restorative skincare for skin longevity, visible signs of aging, moisture barrier support, and radiance.</PageIntro>
    <section className="wrap grid-two page-body">
      <div className="texture-image"><Image src="/images/texture.webp" alt="Detail of a pearlescent cream texture" fill sizes="(max-width: 760px) 100vw, 48vw" /></div>
      <div className="prose-copy !w-full !m-0"><h2 className="!mt-0">Restore. Refine. Illuminate.</h2>
        <p>Skin changes over time. We’re exploring how daily care can support the moisture barrier, soften the look of fine lines, and bring out skin’s natural radiance.</p>
        <p>What you tell us about your routine helps us decide which formulas to develop. As they take shape, we’ll share why we’re considering each ingredient, what we plan to test, and what we learn.</p>
        <Button asChild><Link href="/skin-discovery">Share Your Skincare Preferences</Link></Button>
      </div>
    </section>
  </>;
}
