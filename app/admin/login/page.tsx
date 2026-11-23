import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin-login";
import { PageIntro } from "@/components/site";

export const metadata: Metadata = { title: "Admin Sign-In", robots: { index: false, follow: false } };
export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return <><PageIntro label="bkr research" title="Admin Sign-In." /><div className="surface prose-copy"><AdminLogin /></div></>;
}
