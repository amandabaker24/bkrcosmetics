"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Sparkle } from "lucide-react";
import { Button } from "./ui/button";
import { useChallenge } from "./challenge";
import { track } from "./analytics";
import { Eyebrow } from "./site";
import { WaitlistForm } from "./forms";
import { ages, answersSchema, answerSchemas, discoverySources, questionKeys, questions, type Answers, type QuestionKey } from "@/lib/survey";
import concepts from "@/lib/concepts.json";
import { submitError, submitResearch } from "@/lib/client";
import { browserTracking } from "@/lib/requests";
import { countries } from "@/lib/countries";

type SurveyAnswers = Partial<Omit<Answers, "priorityConcern">> & { priorityConcern?: string };
type SurveyData = { status: "IN_PROGRESS" | "COMPLETED"; answers: SurveyAnswers };

function isOpenQuestion(key: QuestionKey): key is "repurchases" | "feedback" | "switching" {
  return key === "repurchases" || key === "feedback" || key === "switching";
}

export function DiscoverySurvey() {
  const [stage, setStage] = useState<"intro" | "questions" | "done">("intro");
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStage = useRef(stage);
  const challenge = useChallenge();
  const key = questionKeys[step];
  const question = questions[key];

  useLayoutEffect(() => {
    const openingSurvey = previousStage.current === "intro";
    previousStage.current = stage;
    heading.current?.focus({ preventScroll: true });
    if (openingSurvey) {
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      heading.current?.closest("section")?.scrollIntoView({ block: "start" });
    }
  }, [stage, step]);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await submitResearch<SurveyData>("survey/start", { tracking: browserTracking(), ...challenge.payload() });
      if (response.status === "IN_PROGRESS" && !answerSchemas.priorityConcern.safeParse(response.answers.priorityConcern).success) {
        delete response.answers.priorityConcern;
      }
      setAnswers(response.answers);
      if (response.status === "COMPLETED") {
        setStage("done");
      } else {
        const firstUnanswered = questionKeys.findIndex(key => response.answers[key] === undefined);
        setStep(firstUnanswered === -1 ? questionKeys.length - 1 : firstUnanswered);
        setStage("questions");
        if (!Object.keys(response.answers).length) track("survey_started");
      }
    } catch (error) { setError(submitError(error)); } finally { challenge.reset(); setBusy(false); }
  }

  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const current = answerSchemas[key].safeParse(answers[key] ?? (isOpenQuestion(key) ? "" : undefined));
    if (!current.success) { setError("Choose an answer to continue."); return; }
    const updated = { ...answers, [key]: current.data };
    setAnswers(updated);
    setBusy(true);
    setError("");
    try {
      if (step === questionKeys.length - 1) {
        const full = answersSchema.safeParse(updated);
        if (!full.success) { setError("Please review the earlier questions before submitting."); return; }
        const response = await submitResearch<{ ok: boolean; recorded: boolean; answers: Answers }>("survey/complete", { answers: full.data });
        setAnswers(response.answers);
        if (response.recorded) {
          track("survey_step_completed", { step: step + 1 });
          track("survey_completed");
          if (response.answers.product !== "none") track("product_vote_submitted", { concept: response.answers.product, source: "survey" });
        }
        setStage("done");
      } else {
        if (current.data !== undefined) await submitResearch("survey/progress", { key, answer: current.data });
        track("survey_step_completed", { step: step + 1 });
        setStep(step + 1);
      }
    } catch (error) { setError(submitError(error)); } finally { setBusy(false); }
  }

  function setAnswer<K extends QuestionKey>(key: K, value: Answers[K]) {
    setError("");
    setAnswers(previous => ({ ...previous, [key]: value }));
  }

  if (stage === "intro") return <section className="discovery-intro wrap">
    <div>
      <Eyebrow>Skin discovery</Eyebrow><h1>Let’s Talk About <em>Your Skin.</em></h1>
      <p>Tell us about your routine, the textures you love, and what you want from skincare. Your answers will help us decide what to develop first.</p>
      <p className="small">{questionKeys.length} questions · No account required</p>
      <form onSubmit={start} className="form-stack">
        {challenge.fields}
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Opening survey…" : "Start Your Skin Discovery"}</Button>
      </form>
    </div>
    <div className="texture-image"><Image src="/images/texture.webp" alt="A pearlescent skincare texture in warm light" fill loading="eager" sizes="(max-width: 760px) 100vw, 47vw" /></div>
  </section>;

  if (stage === "done") return <section className="survey-shell surface">
    <Sparkle size={29} className="text-primary" aria-hidden="true" />
    <h1 ref={heading} tabIndex={-1}>Thank You for Helping Shape the Future of Skincare.</h1>
    <p>Here’s what you told us about your skincare preferences.</p>
    <dl className="survey-summary">
      <div><dt>Your skin</dt><dd>{answers.skinType?.type}{answers.skinType?.sensitive && answers.skinType.type !== "Sensitive" ? " with sensitivity" : ""}</dd></div>
      <div><dt>Your highest priority</dt><dd>{answers.priorityConcern}</dd></div>
      <div><dt>Textures you enjoy</dt><dd>{answers.textures?.join(", ")}</dd></div>
      <div><dt>Your product choice</dt><dd>{concepts.find(concept => concept.slug === answers.product)?.name ?? "None of these concepts"}</dd></div>
    </dl>
    <div className="surface"><h2 className="mb-3 text-4xl">Follow what comes next.</h2><p className="mb-4">Join the founding community for development updates and launch news.</p><WaitlistForm /></div>
    <Button asChild variant="text" className="mt-3"><Link href="/product-lab">Explore the Product Lab</Link></Button>
  </section>;

  const selected = key === "ingredients" ? answers.ingredients?.choices
    : key === "skinType" ? answers.skinType?.type
    : answers[key];

  const selectedOptions: string[] = Array.isArray(selected) ? selected : [];

  function changeOption(option: string) {
    if (key === "skinType") { setAnswer(key, { type: option as Answers["skinType"]["type"], sensitive: option !== "Sensitive" && !!answers.skinType?.sensitive }); return; }
    if (!question.multiple) {
      const parsed = answerSchemas[key].safeParse(option);
      if (parsed.success) setAnswer(key, parsed.data);
      return;
    }
    if (key === "concerns" || key === "results" || key === "frustrations" || key === "textures" || key === "ingredients" || key === "performance") {
      const current = selectedOptions;
      const next = current.includes(option) ? current.filter(value => value !== option)
        : option === question.exclusive ? [option] : [...current.filter(value => value !== question.exclusive), option];
      if (question.max && next.length > question.max) return;
      if (key === "ingredients") setAnswer(key, { ...answers.ingredients, choices: next as Answers["ingredients"]["choices"] });
      else setAnswer(key, next as Answers[typeof key]);
    }
  }

  function demographicSelect(name: "age" | "country" | "discovery", label: string, options: readonly string[]) {
    return <label>{label}<select className="field" disabled={busy} value={answers.demographics?.[name] ?? ""} onChange={event => {
      const update = answerSchemas.demographics.safeParse({ ...answers.demographics, [name]: event.target.value || undefined });
      if (update.success) setAnswer("demographics", update.data);
    }}><option value="">Prefer not to say</option>{options.map(value => <option key={value}>{value}</option>)}</select></label>;
  }

  return <section className="survey-shell surface">
    <div className="survey-top"><Eyebrow>Skin discovery</Eyebrow><p className="small">Question {step + 1} of {questionKeys.length}</p></div>
    <progress className="progress" value={step + 1} max={questionKeys.length} aria-label="Survey progress" />
    <form onSubmit={advance}>
      <h1 ref={heading} id="question-title" tabIndex={-1}>{question.title}</h1>
      <p className="survey-hint" id="question-hint">{question.hint}</p>
      {question.options && <fieldset disabled={busy} aria-labelledby="question-title" aria-describedby="question-hint"><div className="option-grid">
        {question.options.map(option => {
          const checked = question.multiple ? selectedOptions.includes(option) : selected === option;
          const concept = key === "product" ? concepts.find(item => item.slug === option) : undefined;
          return <label className="option" key={option}>
            <input type={question.multiple ? "checkbox" : "radio"} name={key} checked={checked} disabled={!!(question.max && Array.isArray(selected) && !checked && selected.length >= question.max)} onChange={() => changeOption(option)} />
            {concept && <Image src={concept.imageUrl} alt="" width={56} height={56} />}
            <span>{concept?.name ?? (option === "none" ? "None of these" : option)}{concept && <span className="block small text-[var(--muted)]">{concept.description}</span>}</span>
          </label>;
        })}
      </div></fieldset>}
      {key === "skinType" && <label className="check survey-extra"><input type="checkbox" checked={Boolean(answers.skinType?.sensitive || answers.skinType?.type === "Sensitive")} disabled={busy || !answers.skinType || answers.skinType.type === "Sensitive"} onChange={event => { if (answers.skinType) setAnswer("skinType", { ...answers.skinType, sensitive: event.target.checked }); }} /><span>My skin is also sensitive.</span></label>}
      {key === "ingredients" && <label className="form-stack survey-extra">Ingredients you prefer to avoid (optional)<input className="field" disabled={busy} maxLength={300} value={answers.ingredients?.avoid ?? ""} onChange={event => setAnswer("ingredients", { choices: answers.ingredients?.choices ?? [], avoid: event.target.value })} /></label>}
      {isOpenQuestion(key) && <div className="form-stack">
        <textarea className="field" disabled={busy} aria-labelledby="question-title" aria-describedby="question-hint feedback-length" rows={key === "repurchases" ? 4 : 6} maxLength={key === "repurchases" ? 600 : 1000} value={answers[key] ?? ""} onChange={event => setAnswer(key, event.target.value)} />
        <p className="small" id="feedback-length">{answers[key]?.length ?? 0} / {key === "repurchases" ? "600" : "1,000"} characters</p>
      </div>}
      {key === "demographics" && <div className="form-stack">
        {demographicSelect("age", "Age range", ages)}
        {demographicSelect("country", "Country or region", countries)}
        {demographicSelect("discovery", "How did you hear about us?", discoverySources)}
      </div>}
      {error && <p className="form-error mt-3" role="alert">{error}</p>}
      <div className="survey-actions">
        <Button type="button" variant="outline" disabled={busy || step === 0} onClick={() => { setError(""); setStep(step - 1); }}>Back</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : step === questionKeys.length - 1 ? "Submit My Answers" : "Continue"}</Button>
      </div>
    </form>
  </section>;
}
