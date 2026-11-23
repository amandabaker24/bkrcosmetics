import type { Metadata } from "next";
import { DiscoverySurvey } from "@/components/survey";

export const metadata: Metadata = { title: "Skin Discovery", description: "Share your skincare priorities, current routine, product preferences, and what you want from restorative skincare." };
export default function SkinDiscovery() { return <DiscoverySurvey />; }
