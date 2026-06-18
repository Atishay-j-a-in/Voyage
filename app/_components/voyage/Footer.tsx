import { Section } from "./shared/Section";
import { Sparkles, X as XLogo, LinkedIn, Mail } from "./shared/icons";

export function Footer(): React.ReactElement {
  return (
    <Section id="about" className="py-12 md:py-14">
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 w-full">
        <div className="flex flex-col gap-2 items-center md:items-start">
          <div className="flex items-center gap-1.5 text-white text-[15px] font-bold tracking-[-0.02em]">
            <span>VOYAGE</span>
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-neon)]" />
          </div>
          <p className="text-white/45 text-xs">© 2026 Voyage. All rights reserved.</p>
        </div>

        <nav className="flex flex-wrap justify-center items-center gap-x-7 gap-y-2 text-white/70 text-sm">
          <a href="#features" className="hover:text-white transition-colors duration-300">Features</a>
          <a href="#integrations" className="hover:text-white transition-colors duration-300">Integrations</a>
          <a href="#pricing" className="hover:text-white transition-colors duration-300">Pricing</a>
          
          <a href="#privacy" className="hover:text-white transition-colors duration-300">Privacy</a>
          <a href="#terms" className="hover:text-white transition-colors duration-300">Terms</a>
        </nav>

        <div className="flex items-center gap-3 text-white/70">
          <a
            href="#"
            aria-label="X"
            className="h-9 w-9 rounded-full flex items-center justify-center border border-white/10 transition-colors duration-300 hover:text-white hover:border-white/30"
          >
            <XLogo className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="LinkedIn"
            className="h-9 w-9 rounded-full flex items-center justify-center border border-white/10 transition-colors duration-300 hover:text-white hover:border-white/30"
          >
            <LinkedIn className="h-4 w-4" />
          </a>
          <a
            href="mailto:hello@voyage.app"
            aria-label="Email"
            className="h-9 w-9 rounded-full flex items-center justify-center border border-white/10 transition-colors duration-300 hover:text-white hover:border-white/30"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Section>
  );
}

