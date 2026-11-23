import type { Metadata } from "next";
import { WaitlistForm } from "@/components/forms";
import { PageIntro } from "@/components/site";

export const metadata: Metadata = { title: "The Founding Community", description: "Join the bkr waitlist for launch news and product development updates." };
export default function Community() {
  return <>
    <PageIntro label="The founding community" title="Be First to Experience What's Next.">Follow bkr from early concept to launch.</PageIntro>
    <div className="wrap page-body grid-two">
      <div className="prose-copy !m-0 !w-full">
        <h2 className="!mt-0">What You Can Look Forward To.</h2>
        <ul><li>Early access to launch announcements</li><li>Opportunities to provide product feedback</li><li>Behind-the-scenes formulation updates</li><li>Potential invitations to future product testing</li></ul>
        <p>Check the marketing consent box if you’d like to receive updates by email.</p>
      </div>
      <div className="surface"><WaitlistForm /></div>
    </div>
  </>;
}
