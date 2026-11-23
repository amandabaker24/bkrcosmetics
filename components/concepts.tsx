import Image from "next/image";
import Link from "next/link";
import concepts from "@/lib/concepts.json";
import { Button } from "./ui/button";
import { ConceptVote } from "./forms";
import { Reveal } from "./site";

export function ConceptGrid({ reveal = false }: { reveal?: boolean }) {
  return <div className="concept-grid">
    {concepts.map((concept, index) => {
      const contents = <>
        <Link className="product-photo" href={`/product-lab/${concept.slug}`} aria-label={`Explore ${concept.name}`}>
          <Image src={concept.imageUrl} alt={`Packaging mockup for ${concept.name}`} fill sizes="(max-width: 540px) 100vw, (max-width: 1100px) 33vw, 400px" />
        </Link>
        <div className="concept-copy">
          <p className="tag">{concept.status}</p>
          <h3><Link href={`/product-lab/${concept.slug}`}>{concept.name}</Link></h3>
          <p>{concept.description}</p>
          <Button variant="text" asChild><Link href={`/product-lab/${concept.slug}`}>Explore Concept</Link></Button>
          <ConceptVote slug={concept.slug} />
        </div>
      </>;
      return reveal
        ? <Reveal key={concept.slug} as="article" className="concept-card" delay={index * .11}>{contents}</Reveal>
        : <article key={concept.slug} className="concept-card">{contents}</article>;
    })}
  </div>;
}
