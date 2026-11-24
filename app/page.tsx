import Image from "next/image";
import Link from "next/link";
import { Droplet, FlaskConical, Heart, MessageCircle, Sparkle, Sun, Waves } from "lucide-react";
import { Eyebrow, Reveal, ScrollParallax } from "@/components/site";
import { Button } from "@/components/ui/button";
import { ConceptGrid } from "@/components/concepts";
import { WaitlistForm } from "@/components/forms";
import { HeroFountain } from "@/components/hero-fountain";

const pillars = [
  { title: "Restore", body: "Support the skin’s moisture barrier and explore ways to help skin feel hydrated and comfortable.", Icon: Droplet },
  { title: "Renew", body: "Explore ways to soften the appearance of fine lines and wrinkles and refine uneven-looking texture.", Icon: Waves },
  { title: "Brighten", body: "Focus on the appearance of sun spots, age spots, discoloration, and dullness for a more even-looking tone.", Icon: Sun },
  { title: "Illuminate", body: "Explore hydration and textures that leave skin looking smooth, luminous, and naturally radiant.", Icon: Sparkle },
];

const steps = [
  { title: "Share your skincare needs", body: "Tell us what you love, what you reach for, and what you wish skincare did better.", Icon: MessageCircle },
  { title: "Vote on what comes next", body: "Explore the textures and finishes we’re considering and tell us which you’d most like to try.", Icon: FlaskConical },
  { title: "Follow the journey", body: "Join the founding community for development updates and more chances to share your perspective.", Icon: Heart },
];

export default function Home() {
  return <>
    <HeroFountain>
      <div className="hero-copy">
        <Eyebrow>The Science of Renewal</Eyebrow>
        <h1>In pursuit of <em>renewal.</em></h1>
        <p className="hero-subheading">Inspired by an age-old pursuit. Informed by modern skin science.</p>
        <p>A new approach to skin restoration, visible signs of aging, and lasting skin health.</p>
        <div className="hero-actions">
          <Button asChild><Link href="/skin-discovery">Be Part of the Discovery</Link></Button>
          <Button asChild variant="text"><Link href="#vision">Discover Our Vision</Link></Button>
        </div>
      </div>
    </HeroFountain>
    <section id="vision" className="philosophy">
      <Reveal className="section-heading wrap">
        <div className="section-mark"><Sparkle size={25} strokeWidth={1.05} aria-hidden="true" /></div>
        <p className="eyebrow centered">Our philosophy</p>
        <h2>Restore. Refine. <em>Illuminate.</em></h2>
        <p>bkr is a luxury skincare brand in research and development. Our science-inspired approach to skin longevity explores moisture barrier support, visible signs of aging, and radiance.</p>
      </Reveal>
      <div className="wrap pillar-grid">
        {pillars.map(({ title, body, Icon }, index) => <section key={title} aria-labelledby={`pillar-${title.toLowerCase()}`}>
          <Reveal className="pillar-content" delay={index * .08}>
            <Icon size={24} strokeWidth={1.25} aria-hidden="true" />
            <h3 id={`pillar-${title.toLowerCase()}`}>{title}</h3>
            <p>{body}</p>
          </Reveal>
        </section>)}
      </div>
      <div className="vision-feature wrap">
        <Reveal>
          <ScrollParallax><Image src="/images/texture.webp" alt="Pearlescent gel cream with soft ridges on champagne stone" fill sizes="(max-width: 760px) 100vw, 48vw" /></ScrollParallax>
        </Reveal>
        <Reveal delay={.1}>
          <Eyebrow>From texture to formulation</Eyebrow>
          <h3>Curiosity, followed by testing.</h3>
          <p>The Fountain of Youth is a metaphor for curiosity about how we care for skin over time. We’ll use customer feedback to shape what we formulate and test, and share what we learn along the way.</p>
          <Button asChild variant="text"><Link href="/our-process">Explore Our Process</Link></Button>
        </Reveal>
      </div>
    </section>
    <section className="community-development section-pad">
      <div className="wrap">
        <Reveal className="section-heading">
          <p className="eyebrow centered">Made together</p>
          <h2>Your Skin. Your Voice. <em>Our Inspiration.</em></h2>
          <p>Your experience will help us choose which ideas to develop first.</p>
        </Reveal>
        <div className="steps">
          {steps.map(({title, body, Icon}, index) => <Reveal key={title} as="article" delay={index * .11}>
            <Icon size={25} strokeWidth={1.25} aria-hidden="true"/>
            <h3>{title}</h3>
            <p>{body}</p>
          </Reveal>)}
        </div>
        <Reveal className="center"><Button asChild><Link href="/skin-discovery">Start Skin Discovery</Link></Button></Reveal>
      </div>
    </section>
    <section className="section-pad wrap home-lab">
      <Reveal className="section-heading">
        <p className="eyebrow centered">The product lab</p>
        <h2>What We’re <em>Exploring.</em></h2>
        <p>Four skincare concepts under development. Which would you like bkr to develop first?</p>
      </Reveal>
      <ConceptGrid reveal />
      <Reveal className="center"><Button asChild variant="outline"><Link href="/product-lab">Compare Product Concepts</Link></Button></Reveal>
    </section>
    <section id="waitlist" className="waitlist-band section-pad">
      <div className="wrap waitlist-layout">
        <Reveal>
          <Eyebrow>The founding community</Eyebrow>
          <h2>Be First to Experience <em>What's Next.</em></h2>
          <p>Follow the development journey and be among the first to hear when we’re ready to launch.</p>
        </Reveal>
        <Reveal delay={.12}><WaitlistForm /></Reveal>
      </div>
    </section>
  </>;
}
