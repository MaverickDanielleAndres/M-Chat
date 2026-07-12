import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer',
    company: 'Stripe',
    content: 'M-Chat transformed how I write code. The code generation is incredibly accurate, and analyzing images within the same conversation saves hours daily. It\'s become my main IDE companion.',
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'Linear',
    content: 'We use M-Chat for everything from brainstorming features to analyzing user feedback. The 20 free prompts are generous, and upgrading to Pro was a complete no-brainer.',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Data Scientist',
    company: 'Anthropic',
    content: 'The spreadsheet analysis is a game-changer. Upload a CSV and get instant insights, visualizations, and statistical analysis in plain English. Nothing else comes close.',
  },
  {
    name: 'David Kim',
    role: 'Creative Director',
    company: 'Figma',
    content: 'As a creative professional, I need an AI that understands nuance and creative context. M-Chat delivers exactly that. It\'s become essential to my entire workflow.',
  },
  {
    name: 'Aisha Patel',
    role: 'Research Analyst',
    company: 'DeepMind',
    content: 'The research capabilities are outstanding. Complex questions get well-structured, nuanced responses with cited sources. Document analysis happens in seconds, not hours.',
  },
  {
    name: 'James Wilson',
    role: 'Business Consultant',
    company: 'McKinsey',
    content: 'I recommend M-Chat to all my clients. Business planning, data analysis, and presentation building — it\'s the most versatile AI workspace I\'ve used across 15+ years.',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className="text-[var(--m-text-secondary)] fill-[var(--m-text-secondary)]"
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--m-bg-base)' }}>
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Background orbs */}
      <div className="orb-indigo absolute w-[500px] h-[500px] -right-48 top-1/2 -translate-y-1/2 opacity-20" />
      <div className="orb-amber absolute w-[300px] h-[300px] left-0 bottom-0 opacity-15" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6 px-4 md:px-12"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--m-accent-blue)] mb-3">
              Social Proof
            </p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-[var(--m-text-primary)] tracking-tight leading-[1.1]">
              Loved by creators
              <br />
              everywhere.
            </h2>
          </div>

          <div className="flex gap-10 md:gap-14 border-t md:border-t-0 md:border-l border-white/10 pt-5 md:pt-0 md:pl-14">
            <div>
              <p className="text-2xl font-bold text-[var(--m-text-primary)] mb-1">4.9</p>
              <StarRating count={5} />
              <p className="text-[9px] text-[var(--m-text-secondary)] mt-1 uppercase tracking-wider">avg rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--m-text-primary)] mb-1">5k+</p>
              <p className="text-[9px] text-[var(--m-text-secondary)] uppercase tracking-wider">happy users</p>
            </div>
          </div>
        </motion.div>

        {/* Marquee testimonial track */}
        <div className="relative w-full overflow-hidden flex mt-8 pb-4 mask-edges">
          <div className="flex animate-marquee gap-4 whitespace-nowrap min-w-max hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials].map((testimonial, i) => (
              <div
                key={`${testimonial.name}-${i}`}
                className="w-[320px] shrink-0 group relative rounded-2xl border border-white/[0.05] bg-[var(--m-bg-card)]/50 hover:border-white/[0.1] hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 whitespace-normal flex flex-col"
              >
                  <div className="p-6">
                    <Quote className="text-white/[0.04] fill-white/[0.04] w-8 h-8 mb-4 rotate-180" />
                    <StarRating count={5} />
                    <p className="text-[13px] text-[var(--m-text-secondary)] leading-relaxed mt-4 line-clamp-4">
                      {testimonial.content}
                    </p>
                  </div>
                  
                  <div className="p-6 pt-0 mt-auto flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white/90 bg-white/10"
                    >
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--m-text-primary)]">
                        {testimonial.name}
                      </h4>
                      <p className="text-[10px] text-[var(--m-text-secondary)]">
                        {testimonial.role} <span className="mx-0.5">&middot;</span> {testimonial.company}
                      </p>
                    </div>
                  </div>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
