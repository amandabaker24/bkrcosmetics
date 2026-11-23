"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { browserTracking } from "@/lib/requests";
import concepts from "@/lib/concepts.json";

const projectKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const consentKey = "ml-analytics-consent";
let analyticsClient: typeof import("posthog-js").default | undefined;
let permitted = false;

type Event = "landing_page_viewed" | "survey_started" | "survey_step_completed" | "survey_completed" | "product_concept_viewed" | "product_vote_submitted" | "waitlist_signup_started" | "waitlist_signup_completed";

export function track(event: Event, properties: { step?: number; concept?: string; source?: "survey" | "standalone" } = {}) {
  if (permitted) analyticsClient?.capture(event, properties);
}

async function configure(allowed: boolean) {
  permitted = allowed;
  if (!projectKey) return;
  if (allowed && !analyticsClient) {
    const { default: posthog } = await import("posthog-js");
    if (!permitted) return;
    if (!analyticsClient) {
      posthog.init(projectKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        autocapture: false, capture_pageview: false, capture_pageleave: false,
        disable_session_recording: true, disable_surveys: true, disable_external_dependency_loading: true,
        capture_performance: false, person_profiles: "never", persistence: "memory",
        advanced_disable_flags: true, ip: false,
        custom_campaign_params: [], save_campaign_params: false, save_referrer: false,
        before_send: event => {
          if (!permitted || !event || event.event.startsWith("$")) return null;
          const { token, distinct_id, step, concept, source } = event.properties ?? {};
          return { uuid: event.uuid, event: event.event, timestamp: event.timestamp, properties: { token, distinct_id, step, concept, source, $geoip_disable: true, $process_person_profile: false } };
        },
      });
      analyticsClient = posthog;
    }
  }
  if (permitted) analyticsClient?.opt_in_capturing({ captureEventName: false });
  else analyticsClient?.opt_out_capturing();
}

function trackPage(path: string) {
  if (path === "/") track("landing_page_viewed");
  const concept = concepts.find(item => path === `/product-lab/${item.slug}`);
  if (concept) track("product_concept_viewed", { concept: concept.slug });
}

export function AnalyticsPreferences() {
  if (!projectKey) return null;
  return <Button type="button" variant="outline" onClick={() => window.dispatchEvent(new Event("ml-analytics-settings"))}>Manage analytics preferences</Button>;
}

export function Analytics() {
  const path = usePathname();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    browserTracking();
  }, [path]);
  useEffect(() => {
    if (!projectKey || path.startsWith("/admin") || path.startsWith("/unsubscribe") || path === "/community/confirm") return;
    const open = () => setVisible(true);
    window.addEventListener("ml-analytics-settings", open);
    let stored: string | null = null;
    try { stored = localStorage.getItem(consentKey); } catch {}
    let active = true;
    void configure(stored === "yes").then(() => { if (active) trackPage(path); }).catch(() => {});
    setVisible(stored !== "no" && stored !== "yes");
    return () => { active = false; window.removeEventListener("ml-analytics-settings", open); };
  }, [path]);

  if (!visible || path.startsWith("/admin") || path === "/unsubscribe" || path === "/community/confirm") return null;
  function choose(accept: boolean) {
    try { localStorage.setItem(consentKey, accept ? "yes" : "no"); } catch {}
    void configure(accept).then(() => { if (accept) trackPage(path); }).catch(() => {});
    setVisible(false);
  }
  return <aside className="surface consent-panel" aria-label="Optional analytics">
    <strong>Optional analytics</strong><p className="small">Allow anonymous usage events to help us improve the site. Your answers and email address stay out of analytics.</p>
    <div className="flex flex-wrap gap-2 mt-3"><Button onClick={() => choose(true)}>Allow analytics</Button><Button variant="outline" onClick={() => choose(false)}>Decline</Button></div>
  </aside>;
}
