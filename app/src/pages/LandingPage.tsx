import { Navigation } from '@/sections/Navigation';
import { Hero } from '@/sections/Hero';
import { AICapabilities } from '@/sections/AICapabilities';
import MultiOrbitSemiCircle from '@/components/ui/multi-orbit-semi-circle';
import { FUIBentoGridDark } from '@/components/ui/bento';
import { Features8 } from '@/components/blocks/features-8';
import { WhyMChat } from '@/sections/WhyMChat';
import { Pricing } from '@/sections/Pricing';
import { Testimonials } from '@/sections/Testimonials';
import { FAQ } from '@/sections/FAQ';
import { CTA } from '@/sections/CTA';
import { LandingFooter } from '@/sections/LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      <Navigation />
      <Hero />
      <AICapabilities />
      <MultiOrbitSemiCircle />
      <FUIBentoGridDark />
      <Features8 />
      <WhyMChat />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <LandingFooter />
    </div>
  );
}
