import Link from "next/link";
import { PageIntro } from "@/components/site";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <><PageIntro label="bkr" title="Page Not Found.">This address may have changed.</PageIntro><div className="center page-body"><Button asChild><Link href="/">Return Home</Link></Button></div></>;
}
