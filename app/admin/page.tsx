import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { getAdmin } from "@/lib/admin-auth";
import { analytics, filtersSchema, productLabel, reportPriorityConcerns, reportProducts, reportVersions, themes, type Filters, type Count } from "@/lib/reporting";
import { ages, ingredients, prices, skinTypes } from "@/lib/survey";
import { ResearchChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Research Dashboard", robots: { index: false, follow: false } };
const percent = (count: number, total: number) => total ? `${Math.round(100 * count / total)}%` : "—";
const leaders = (data: Count[]) => data.filter(item => item.count === data[0]?.count).map(item => item.name).join(", ") || "—";

function query(filters: Filters, page?: number) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (name !== "page" && typeof value === "string" && value) params.set(name, value);
  }
  if (page) params.set("page", String(page));
  return params.toString();
}

function FilterSelect({ name, label, values, value, display = (item: string) => item }: {name: string; label: string; values: readonly string[]; value?: string; display?: (item: string) => string}) {
  return <label>{label}<select className="field" name={name} defaultValue={value ?? ""}><option value="">All</option>{values.map(item => <option key={item} value={item}>{display(item)}</option>)}</select></label>;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!(await getAdmin())) redirect("/admin/login");
  const requested = filtersSchema.safeParse(await searchParams);
  const filters: Filters = requested.success ? requested.data : {};
  const report = await analytics(filters);
  const filterQuery = query(filters);
  const summary = [
    ["Completed surveys", report.completed],
    ["Survey completion", percent(report.completed, report.started)],
    ["Active, confirmed subscribers", report.subscribers],
    ["Marketing opt-in", percent(report.optedIn, report.subscribers)],
    ["Most requested renewal concept", leaders(report.surveyVotes)],
    ["Most common skin concerns", leaders(report.concerns)],
    ["Most common textures", leaders(report.textures)],
    ["Most selected price response", leaders(report.prices.filter(item => item.count > 0).sort((a, b) => b.count - a.count))],
  ];
  return <div className="wrap admin-shell">
    <div className="admin-heading"><h1>Research Dashboard</h1><form action={signOut}><Button variant="outline" type="submit">Sign Out</Button></form></div>
    <section className="surface">
      <h2>Filters</h2>
      <p className="small mb-3">Dates use UTC and include both endpoints. Survey filters apply to the cohort by start date. Subscriber metrics use signup date and traffic source. Standalone product activity uses date only.</p>
      {!requested.success && <p className="form-error mb-3" role="alert">Some filters were invalid. Showing all responses. Check the date range and selections.</p>}
      <form method="get" action="/admin" className="filter-form">
        <label>Start date<Input type="date" name="from" defaultValue={filters.from} /></label>
        <label>End date<Input type="date" name="to" defaultValue={filters.to} /></label>
        <FilterSelect name="age" label="Age range" values={ages} value={filters.age} />
        <FilterSelect name="skin" label="Skin type" values={skinTypes} value={filters.skin} />
        <FilterSelect name="version" label="Survey edition" values={reportVersions} value={filters.version} display={version => version === "discovery-1" ? "Original discovery" : "Renewal discovery"} />
        <FilterSelect name="concern" label="Highest-priority concern" values={reportPriorityConcerns} value={filters.concern} />
        <FilterSelect name="ingredient" label="Ingredient preference" values={ingredients} value={filters.ingredient} />
        <FilterSelect name="product" label="Product preference" values={reportProducts} value={filters.product} display={productLabel} />
        <FilterSelect name="price" label="Willingness to pay" values={prices} value={filters.price} />
        <FilterSelect name="source" label="Traffic source" values={[...new Set([...report.sources, ...(filters.source ? [filters.source] : [])])]} value={filters.source} />
        <label>Search open feedback<Input name="q" type="search" defaultValue={filters.q} maxLength={200} /></label>
        <FilterSelect name="theme" label="Feedback theme" values={themes.map(([name]) => name)} value={filters.theme} />
        <Button type="submit">Apply Filters</Button>
        <Button asChild variant="outline"><Link href="/admin">Clear Filters</Link></Button>
      </form>
    </section>
    <div className="metrics">{summary.map(([label, value]) => <div className="surface metric" key={label}><p className="small">{label}</p><strong>{value}</strong></div>)}</div>
    <div className="admin-heading">
      <p className="small">{report.started} started · {report.pending} pending email confirmation · {report.optedIn} active marketing opt-ins</p>
      <Button asChild variant="outline"><a href={`/api/admin/export${filterQuery ? `?${filterQuery}` : ""}`}>Export Survey CSV</a></Button>
    </div>
    <div className="chart-grid">
      <ResearchChart title="Skin Concerns" data={report.concerns} />
      <ResearchChart title="Skin Types and Sensitivity" data={report.skin} />
      <ResearchChart title="Highest-Priority Concerns" data={report.primaryConcerns} />
      <ResearchChart title="Renewal Survey Product Votes" data={report.surveyVotes} />
      <ResearchChart title="Product Lab Priority Votes" data={report.standaloneVotes} />
      {report.historicalSurveyVotes.length > 0 && <ResearchChart title="Original Survey Product Votes" data={report.historicalSurveyVotes} />}
      {report.historicalStandaloneVotes.length > 0 && <ResearchChart title="Original Product Lab Interest" data={report.historicalStandaloneVotes} />}
      <ResearchChart title="Future Testing Interest" data={report.testingInterest} />
      <ResearchChart title="Willingness to Pay" data={report.prices} />
      <ResearchChart title="Texture Preferences" data={report.textures} />
      <ResearchChart title="Survey Completions Over Time" data={report.surveyTimeline} timeline />
      <ResearchChart title="Confirmed Signups by Signup Date" data={report.waitlistTimeline} timeline />
    </div>
    <section className="surface admin-section">
      <h2>Customer Segments by Product</h2>
      <p className="small">Segments combine age range and highest-priority concern. The vote share is the percentage of the segment that chose each concept, including respondents who chose none in the denominator. Segments with at least five responses rank ahead of smaller samples. Within each group, segments are ordered by vote share. Product selection filters the cards while retaining the full segment denominator.</p>
      {!report.segments.length && <p className="mt-3">Renewal concept segments are available for the four concepts currently in development.</p>}
      <div className="chart-grid">
        {report.segments.map(({ slug, name, votes, segments, ingredients: ingredientCounts, prices: priceCounts }) => {
          const first = segments[0];
          const counts = (items: Count[]) => items.slice(0, 3).map(({ name, count }) => `${name} (${count})`).join(" · ");
          return <article key={slug} className="surface chart-card">
            <h3>{name}</h3>
            <p>{votes} survey {votes === 1 ? "vote" : "votes"}</p>
            {first ? <p className="mt-2"><strong>{first.age} · {first.concern}</strong><br />{first.votes} of {first.sample} chose this concept ({percent(first.votes, first.sample)}).{first.sample < 5 && " Small sample."}</p> : <p className="mt-2">Segment results appear when voters share their age range.</p>}
            {votes > 0 && <dl className="detail-data small">
              <div><dt>Most selected ingredient preferences among voters</dt><dd>{counts(ingredientCounts)}</dd></div>
              <div><dt>Most selected price responses among voters</dt><dd>{counts(priceCounts)}</dd></div>
            </dl>}
            {segments.length > 0 && <details className="mt-3">
              <summary className="cursor-pointer">View all segments with votes</summary>
              <div className="table-scroll"><table><thead><tr><th scope="col">Age range</th><th scope="col">Priority concern</th><th scope="col">Vote share</th><th scope="col">Ingredient preferences among voters</th><th scope="col">Price responses among voters</th></tr></thead>
                <tbody>{segments.map(segment => <tr key={`${segment.age}-${segment.concern}`}><td>{segment.age}</td><td>{segment.concern}</td><td>{segment.votes}/{segment.sample} ({percent(segment.votes, segment.sample)}){segment.sample < 5 && " · Small sample"}</td><td>{counts(segment.ingredients)}</td><td>{counts(segment.prices)}</td></tr>)}</tbody>
              </table></div>
            </details>}
          </article>;
        })}
      </div>
    </section>
    <section className="surface admin-section">
      <h2>Product Insights</h2>
      <p>These counts describe the selected sample. Respondents could choose several textures. The sensitivity group can overlap other skin types.</p>
      {report.insights.length ? <ul className="insight-list">{report.insights.map(({ type, sample, texture, count }) => <li key={type}><strong>{type}</strong> · {count} of {sample} selected {texture.toLowerCase()}, the most selected texture in this group.{sample < 10 && " Small sample."}</li>)}</ul> : <p>No completed surveys in this cohort.</p>}
    </section>
    <section className="surface admin-section">
      <h2>Open-Ended Survey Feedback</h2>
      <p>{report.feedbackCount} matching responses. Keyword grouping can assign multiple themes to the same response.</p>
      {report.feedback.length > 0 && <div className="table-scroll" tabIndex={0} role="region" aria-label="Open-ended feedback table"><table><thead><tr><th scope="col">Date</th><th scope="col">Question</th><th scope="col">Feedback</th><th scope="col">Themes</th></tr></thead><tbody>{report.feedback.map((item, index) => <tr key={index}><td>{item.date}</td><td>{item.question}</td><td className="break-words min-w-56 max-w-lg">{item.text}</td><td>{item.themes.join(", ") || "—"}</td></tr>)}</tbody></table></div>}
      <div className="flex gap-3 mt-3">
        {report.feedbackPage > 1 && <Button asChild variant="outline"><Link href={`/admin?${query(filters, report.feedbackPage - 1)}`}>Previous</Link></Button>}
        {report.feedbackPage * 25 < report.feedbackCount && <Button asChild variant="outline"><Link href={`/admin?${query(filters, report.feedbackPage + 1)}`}>Next</Link></Button>}
      </div>
    </section>
    <section className="surface admin-section">
      <h2>Standalone Product Feedback</h2>
      <p>{report.standaloneFeedbackCount} responses. Showing up to the 25 most recent.</p>
      {report.standaloneFeedback.length > 0 && <div className="table-scroll" tabIndex={0} role="region" aria-label="Product feedback table"><table><thead><tr><th scope="col">Date</th><th scope="col">Concept</th><th scope="col">Purchase intent</th><th scope="col">Expected price</th><th scope="col">What would help</th><th scope="col">Purchase barrier</th></tr></thead><tbody>{report.standaloneFeedback.map((item, index) => <tr key={index}><td>{item.date}</td><td>{item.product}</td><td>{item.intent}</td><td>{item.expectedPrice === undefined ? "—" : `$${item.expectedPrice}`}</td><td className="max-w-48 break-words">{item.appeal || "—"}</td><td className="max-w-48 break-words">{item.barrier || "—"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
