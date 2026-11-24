"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X, Sparkle } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "./ui/button";

const navigation = [
  ["Our Vision", "/about"], ["Skin Discovery", "/skin-discovery"],
  ["Product Lab", "/product-lab"], ["Our Process", "/our-process"],
];

function Wordmark() {
  return <Link href="/" className="wordmark" aria-label="bkr home">bkr</Link>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  if (path === "/admin" || path.startsWith("/admin/")) return null;

  return <header className={path === "/" ? "site-header site-header-home" : "site-header"}>
    <div className="nav-shell">
      <Wordmark />
      <nav aria-label="Primary" className="desktop-nav">
        {navigation.map(([label, href]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>)}
      </nav>
      <Button asChild variant="outline" className="nav-cta"><Link href="/community">Join the Waitlist</Link></Button>
      <button type="button" className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    <nav id="mobile-nav" aria-label="Mobile" className="mobile-nav" hidden={!open}>
      {navigation.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={path === href ? "page" : undefined}>{label}</Link>)}
      <Link href="/community" onClick={() => setOpen(false)}>Join the Waitlist</Link>
    </nav>
  </header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="wrap">
    <div className="footer-main">
      <div><Wordmark /><p>The Science of Renewal.</p></div>
      <nav aria-label="Footer">{[...navigation, ["Founding Community", "/community"], ["Contact", "/contact"]].map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} bkr</span><nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/unsubscribe">Email preferences</Link></nav></div>
  </div></footer>;
}

export function Reveal({ children, className, as = "div", delay = 0 }: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article";
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const Element = as === "article" ? motion.article : motion.div;
  return <Element
    className={className}
    initial={false}
    whileInView={reducedMotion ? undefined : { y: [24, 0], opacity: [.62, 1] }}
    viewport={{ once: true, amount: .12 }}
    transition={{ duration: .72, delay, ease: [.22, 1, .36, 1] }}
  >{children}</Element>;
}

export function ScrollParallax({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [20, -20]);

  return <div ref={frame} className="texture-image scroll-parallax">
    <motion.div className="scroll-parallax-image" style={{ y }}>{children}</motion.div>
  </div>;
}

export function Eyebrow({ children }: {children: ReactNode}) {
  return <p className="eyebrow"><span aria-hidden="true" />{children}</p>;
}

export function PageIntro({ label, title, children }: {label: string; title: string; children?: ReactNode}) {
  return <section className="page-intro wrap"><Sparkle aria-hidden="true" size={24} strokeWidth={1.2} /><p className="eyebrow centered">{label}</p><h1>{title}</h1>{children && <p className="intro-copy">{children}</p>}</section>;
}
