import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ConceptFeedback, ConceptVote } from "@/components/forms";
import { PageIntro } from "@/components/site";
import concepts from "@/lib/concepts.json";

export function generateStaticParams() { return concepts.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps<"/product-lab/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = concepts.find(item => item.slug === slug);
  return found ? { title: found.name, description: found.description } : {};
}

export default async function ConceptPage({ params }: PageProps<"/product-lab/[slug]">) {
  const { slug } = await params;
  const concept = concepts.find(item => item.slug === slug);
  if (!concept) {
    if (["silk-glass-essence", "texture-refining-serum", "glass-veil-gel-cream"].includes(slug)) permanentRedirect("/product-lab");
    notFound();
  }
  return <>
    <PageIntro label={concept.status} title={concept.name}>{concept.description}</PageIntro>
    <div className="wrap page-body">
      <section className="grid-two concept-details">
        <div className="product-photo detail-photo"><Image src={concept.imageUrl} alt={`Concept packaging for ${concept.name}`} fill sizes="(max-width: 760px) 100vw, 48vw" /></div>
        <div className="surface" id="interest"><h2 className="text-5xl">The Concept.</h2>
          <dl className="detail-data">
            <div><dt>Intended benefits</dt><dd><ul>{concept.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul></dd></div>
            <div><dt>Texture</dt><dd>{concept.texture}</dd></div>
            <div><dt>Potential ingredients</dt><dd>{concept.ingredients.join(", ")}</dd></div>
            <div><dt>Proposed retail price</dt><dd>${concept.proposedPrice} USD / 50 mL</dd></div>
            <div><dt>Development status</dt><dd>{concept.status}. Formulation, packaging, and price are provisional.</dd></div>
          </dl>
          <ConceptVote slug={slug} />
        </div>
      </section>
      <section className="prose-copy surface">
        <h2 className="!mt-0">What Do You Think?</h2>
        <p>Your feedback will help us decide whether and how to develop this concept.</p>
        <ConceptFeedback slug={slug} />
      </section>
      <div className="center"><Link className="underlined" href="/product-lab">Back to the Product Lab</Link></div>
    </div>
  </>;
}
