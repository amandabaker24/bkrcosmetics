"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useChallenge } from "./challenge";
import { track } from "./analytics";
import { submitError, submitResearch } from "@/lib/client";
import { browserTracking, purchaseIntents } from "@/lib/requests";
import { marketingWording } from "@/lib/survey";

function useSubmission(action: string) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const challenge = useChallenge();
  return {
    busy, status, error, challenge: challenge.fields,
    async run(body: object, message: string, done?: (result: { ok: boolean; recorded?: boolean }) => void) {
      if (busy || status) return;
      setBusy(true);
      setError("");
      try {
        const result = await submitResearch<{ ok: boolean; recorded?: boolean }>(action, { ...body, ...challenge.payload() });
        setStatus(message);
        done?.(result);
      } catch (error) {
        setError(submitError(error));
      } finally {
        challenge.reset();
        setBusy(false);
      }
    },
  };
}

function Status({ error, status }: {error: string; status: string}) {
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (status) return <div className="form-success" role="status"><Check size={18} aria-hidden="true" /><p>{status}</p></div>;
  return null;
}

export function WaitlistForm() {
  const state = useSubmission("waitlist/join");
  const [started, setStarted] = useState(false);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void state.run({
      firstName: fields.get("firstName"), email: fields.get("email"),
      marketingConsent: fields.has("marketingConsent"), tracking: browserTracking(),
    }, "You’re on the waitlist. Thank you for joining the founding community.", () => track("waitlist_signup_completed"));
  }
  if (state.status) return <Status {...state} />;
  return <form className="form-stack" onSubmit={onSubmit} onFocus={() => {
    if (!started) { track("waitlist_signup_started"); setStarted(true); }
  }}>
    <label>First name (optional)<Input name="firstName" autoComplete="given-name" placeholder="Your first name" maxLength={80} /></label>
    <label>Email address<Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" maxLength={254} /></label>
    <label className="check"><input type="checkbox" name="marketingConsent" /><span>{marketingWording}</span></label>
    <p className="form-note">See our <Link href="/privacy">privacy policy</Link> for how we handle your information.</p>
    {state.challenge}
    <Status {...state} />
    <Button type="submit" disabled={state.busy}>{state.busy ? "Joining…" : "Join the Founding Community"}</Button>
  </form>;
}

export function ConceptVote({ slug }: { slug: string }) {
  const state = useSubmission("products/vote");
  const [expanded, setExpanded] = useState(!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (state.status) return <Status {...state} />;
  return <form className="form-stack" onSubmit={event => {
    event.preventDefault();
    if (!expanded) { setExpanded(true); return; }
    void state.run({ slug }, "Your vote is saved. To change it, vote for a different concept.", result => {
      if (result.recorded) track("product_vote_submitted", { concept: slug, source: "standalone" });
    });
  }}>
    {expanded && state.challenge}
    <Status {...state} />
    <Button type="submit" variant="outline" disabled={state.busy}><Heart size={16} aria-hidden="true" />{state.busy ? "Saving…" : expanded && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "Submit Vote" : "Vote to Develop First"}</Button>
  </form>;
}

export function ConceptFeedback({ slug }: { slug: string }) {
  const state = useSubmission("products/feedback");
  if (state.status) return <Status {...state} />;
  return <form className="form-stack" onSubmit={event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const price = fields.get("expectedPrice");
    void state.run({
      slug, purchaseIntent: fields.get("purchaseIntent"),
      expectedPrice: price ? Number(price) : undefined, feedback: fields.get("feedback"), purchaseBarrier: fields.get("purchaseBarrier"),
    }, "Thank you. Your feedback has been recorded.");
  }}>
    <label>Would you consider purchasing this product?<select className="field" name="purchaseIntent" required defaultValue=""><option value="" disabled>Choose an answer</option>{purchaseIntents.map(intent => <option key={intent}>{intent}</option>)}</select></label>
    <label>What price would you expect to pay (USD, optional)?<Input type="number" min="0" max="2000" step="0.01" name="expectedPrice" placeholder="e.g. 40" /></label>
    <label>What would make this product more appealing? (optional)<textarea name="feedback" className="field" maxLength={1000} rows={3} /></label>
    <label>What would prevent you from purchasing it? (optional)<textarea name="purchaseBarrier" className="field" maxLength={500} rows={3} /></label>
    <p className="small">Please leave out names, contact details, and medical information.</p>
    {state.challenge}
    <Status {...state} />
    <Button type="submit" disabled={state.busy}>{state.busy ? "Sending…" : "Send Feedback"}</Button>
  </form>;
}

export function ContactForm() {
  const state = useSubmission("contact");
  if (state.status) return <Status {...state} />;
  return <form className="form-stack" onSubmit={event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void state.run(Object.fromEntries(fields), "Thank you for your message. We’ll be in touch by email.");
  }}>
    <label>Name<Input required name="name" autoComplete="name" maxLength={80} /></label>
    <label>Email<Input required name="email" type="email" autoComplete="email" maxLength={254} /></label>
    <label>Message<textarea required name="message" className="field" rows={5} minLength={5} maxLength={2000} /></label>
    {state.challenge}
    <Status {...state} />
    <Button type="submit" disabled={state.busy}>{state.busy ? "Sending…" : "Send Message"}</Button>
  </form>;
}

export function EmailPreference({ type }: {type: "confirm" | "unsubscribe"}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const confirm = type === "confirm";
  return <form className="form-stack" onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    const token = window.location.hash.slice(1);
    if (!token) { setError("Open the link from your email to continue."); return; }
    setBusy(true);
    setError("");
    try {
      await submitResearch(`waitlist/${type}`, { token });
      window.history.replaceState(null, "", window.location.pathname);
      setStatus(confirm ? "Your email address is confirmed. Thank you for joining us." : "You’ve been unsubscribed from bkr marketing emails.");
    } catch (error) { setError(submitError(error)); } finally { setBusy(false); }
  }}>
    <p>{confirm ? "Confirm your email address to complete your signup." : "Use the preferences link from your bkr email to unsubscribe."}</p>
    <Status error={error} status={status} />
    {!status && <Button type="submit" disabled={busy}>{busy ? "Saving…" : confirm ? "Confirm Email Address" : "Unsubscribe"}</Button>}
    {!status && !error && <p className="small"><Link className="underlined" href={confirm ? "/community" : "/contact"}>{confirm ? "Visit the waitlist" : "Contact us for help"}</Link></p>}
  </form>;
}
