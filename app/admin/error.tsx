"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { reset: () => void }) {
  return <section className="wrap admin-shell"><h1>Dashboard Unavailable</h1><p className="my-3">The dashboard couldn’t load. Please try again.</p><Button type="button" onClick={reset}>Try Again</Button></section>;
}
