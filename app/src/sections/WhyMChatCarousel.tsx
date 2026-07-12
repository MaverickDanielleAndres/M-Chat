import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CarouselFeature = {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

type FeatureCarouselProps = {
  features: CarouselFeature[];
  autoPlayInterval?: number;
};

const AUTO_PLAY_DEFAULT = 4000;
const CHIP_HEIGHT = 56;
const CHIP_GAP = 14; 
const VISIBLE_BUFFER = 2; 

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function WhyMChatCarousel({
  features,
  autoPlayInterval = AUTO_PLAY_DEFAULT,
}: FeatureCarouselProps) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const total = features.length;
  const currentIndex = ((step % total) + total) % total;

  const nextStep = useCallback(() => setStep((s) => s + 1), []);

  const handleChipClick = (index: number) => {
    const forward = (index - currentIndex + total) % total;
    const backward = (currentIndex - index + total) % total;
    if (forward <= backward) setStep((s) => s + forward);
    else setStep((s) => s - backward);
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(nextStep, autoPlayInterval);
    return () => clearInterval(t);
  }, [nextStep, paused, autoPlayInterval]);

  useEffect(() => {
    if (mobileScrollRef.current) {
      const target = mobileScrollRef.current;
      const chip = target.children[currentIndex] as HTMLElement;
      if (chip) {
        const scrollLeft = chip.offsetLeft - target.clientWidth / 2 + chip.clientWidth / 2;
        target.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [currentIndex]);

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex;
    const len = total;
    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;
    if (normalizedDiff === 0) return "active";
    if (normalizedDiff === -1) return "prev";
    if (normalizedDiff === 1) return "next";
    return "hidden";
  };

  const trackHeight = (VISIBLE_BUFFER * 2 + 1) * CHIP_HEIGHT + VISIBLE_BUFFER * 2 * CHIP_GAP;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] flex flex-col-reverse lg:flex-row min-h-[420px] lg:min-h-[460px] border border-white/[0.05] bg-[#0c0c14]">
        
        {/* Left column */}
        <div
          className="w-full lg:w-[40%] relative flex items-center justify-center py-8 md:py-10 overflow-hidden bg-[#0a0a10]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onWheel={(e) => {
            if (Math.abs(e.deltaY) > 20) {
              if (e.deltaY > 0) setStep((s) => s + 1);
              else setStep((s) => s - 1);
            }
          }}
        >
          {/* Mobile Horizontal */}
          <div 
            ref={mobileScrollRef}
            className="w-full flex lg:hidden overflow-x-auto snap-x snap-mandatory px-6 py-8 gap-3 z-10 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {features.map((feature, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={feature.id}
                  onClick={() => handleChipClick(index)}
                  className={cn(
                    "shrink-0 snap-center flex items-center justify-center gap-2 px-5 py-3 rounded-full text-center border transition-colors duration-300",
                    isActive
                      ? "bg-[var(--m-accent-blue)] text-white border-[var(--m-accent-blue)] shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <feature.icon size={16} strokeWidth={1.8} className={isActive ? "text-white" : "text-white/50"} />
                  <span className="font-semibold text-xs tracking-tight uppercase whitespace-nowrap">
                    {feature.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop Fade */}
          <div className="hidden lg:block absolute inset-x-0 top-0 h-14 z-30 pointer-events-none bg-gradient-to-b from-[#0a0a10] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-14 z-30 pointer-events-none bg-gradient-to-t from-[#0a0a10] to-transparent" />

          {/* Desktop Track */}
          <div className="hidden lg:block relative w-full max-w-[260px] mx-auto z-10" style={{ height: trackHeight }}>
            <motion.div 
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -20) setStep((s) => s + 1);
                else if (info.offset.y > 20) setStep((s) => s - 1);
              }}
            >
              {features.map((feature, index) => {
                const distance = index - currentIndex;
                const wrappedDistance = wrap(-VISIBLE_BUFFER, total - VISIBLE_BUFFER, distance);
                const isActive = wrappedDistance === 0;

                return (
                  <motion.button
                    key={feature.id}
                    onClick={() => handleChipClick(index)}
                    style={{ height: CHIP_HEIGHT, top: trackHeight / 2 - CHIP_HEIGHT / 2 }}
                    animate={{
                      y: wrappedDistance * (CHIP_HEIGHT + CHIP_GAP) + (wrappedDistance === 0 ? 0 : Math.sign(wrappedDistance) * Math.min(Math.abs(wrappedDistance), 1) * CHIP_GAP),
                      opacity: isActive ? 1 : Math.max(0, 1 - Math.abs(wrappedDistance) * 0.35),
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 34, mass: 0.9 }}
                    className={cn(
                      "absolute inset-x-0 flex items-center justify-center gap-2 px-4 rounded-full text-center border transition-colors duration-300",
                      isActive
                        ? "bg-[var(--m-accent-blue)] text-white border-[var(--m-accent-blue)] z-20 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <feature.icon size={14} strokeWidth={1.8} className={isActive ? "text-white" : "text-white/50"} />
                    <span className="font-semibold text-xs tracking-tight uppercase truncate">
                      {feature.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Right column: Cards */}
        <div className="flex-1 min-h-[320px] md:min-h-[400px] lg:min-h-[460px] relative flex items-center justify-center px-6 py-10 overflow-hidden border-b lg:border-b-0 lg:border-l border-white/[0.05]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
          
          <div className="relative w-full max-w-[400px] aspect-[16/10] flex items-center justify-center">
            {features.map((feature, index) => {
              const status = getCardStatus(index);
              const isActive = status === "active";
              const isPrev = status === "prev";
              const isNext = status === "next";

              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -40 : isNext ? 40 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.9 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.3 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 32, mass: 0.85 }}
                  className="absolute inset-0 rounded-2xl overflow-hidden border border-white/[0.1] bg-[#12121a] shadow-2xl flex flex-col p-8"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--m-accent-blue)]/10 flex items-center justify-center mb-6">
                    <feature.icon size={24} className="text-[var(--m-accent-blue)]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.label}</h3>
                  <p className="text-white/70 leading-relaxed text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
            {features.map((f, i) => (
              <div
                key={f.id}
                onClick={() => handleChipClick(i)}
                className={cn("rounded-full cursor-pointer transition-all duration-300", i === currentIndex ? "w-4 bg-[var(--m-accent-blue)]" : "w-1.5 bg-white/20")}
                style={{ height: '4px' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
