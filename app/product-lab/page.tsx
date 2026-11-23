import type { Metadata } from "next";
import { ConceptGrid } from "@/components/concepts";
import { PageIntro } from "@/components/site";
import concepts from "@/lib/concepts.json";

export const metadata: Metadata = { title: "Product Lab", description: "Compare four restorative skincare concepts and vote for the one you would like bkr to develop first." };
export default function ProductLab() {
  return <>
    <PageIntro label="The product lab" title="Skincare, Still Taking Shape.">Explore four concepts under development. Compare textures, potential ingredients, and proposed prices, then vote for the one you’d most like bkr to develop first. You can change your vote by choosing a different concept in this browser.</PageIntro>
    <div className="wrap page-body">
      <ConceptGrid />
      <section className="surface compare" aria-labelledby="compare-title">
        <h2 id="compare-title">Compare the Concepts.</h2>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Product concept comparison">
          <table><thead><tr><th scope="col">What we’re exploring</th>{concepts.map(concept => <th scope="col" key={concept.slug}>{concept.name}</th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">Texture</th>{concepts.map(c => <td key={c.slug}>{c.texture}</td>)}</tr>
              <tr><th scope="row">Intended benefits</th>{concepts.map(c => <td key={c.slug}>{c.benefits.join(" · ")}</td>)}</tr>
              <tr><th scope="row">Potential ingredients</th>{concepts.map(c => <td key={c.slug}>{c.ingredients.join(", ")}</td>)}</tr>
              <tr><th scope="row">Proposed price</th>{concepts.map(c => <td key={c.slug}>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(c.proposedPrice)} USD / 50 mL</td>)}</tr>
              <tr><th scope="row">Development status</th>{concepts.map(c => <td key={c.slug}>{c.status}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </>;
}
