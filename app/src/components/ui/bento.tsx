import { clsx } from "clsx";
import { motion } from "framer-motion";

export function FUIBentoGridDark() {
  return (
    <div className="py-10 md:py-16 container mx-auto min-w-screen flex flex-col px-6">
      <h1 className="font-display font-bold tracking-tight text-3xl md:text-4xl text-[var(--m-text-primary)] text-center mx-auto">
        Superpowers
      </h1>
      <p className="max-w-3xl text-lg font-medium tracking-tight mt-2 text-[var(--m-text-secondary)] text-center mx-auto">
        Everything you need to build the future.
      </p>
      
      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-6 lg:grid-rows-2">
        <BentoCard
          eyebrow="Insight"
          title="Get perfect clarity"
          description="M-Chat analyzes your entire codebase and external documents in seconds, giving you unprecedented understanding of your projects."
          graphic={
            <div className="absolute inset-0 bg-[url(https://framerusercontent.com/images/ghyfFEStl6BNusZl0ZQd5r7JpM.png)] bg-cover bg-center opacity-80" />
          }
          className="max-lg:rounded-t-3xl lg:col-span-3 lg:rounded-tl-3xl"
        />
        <BentoCard
          eyebrow="Analysis"
          title="Deep data mining"
          description="Upload CSVs or connect databases. Our models extract trends, generate charts, and find the needle in the haystack."
          graphic={
            <div className="absolute inset-0 bg-[url(https://framerusercontent.com/images/7CJtT0Pu3w1vNADktNltoMFC9J4.png)] bg-cover bg-center opacity-80" />
          }
          className="lg:col-span-3 lg:rounded-tr-3xl"
        />
        <BentoCard
          eyebrow="Speed"
          title="Built for power users"
          description="It's never been faster to iterate. Use keyboard shortcuts, voice dictation, and streaming responses to stay in flow."
          graphic={
            <div className="absolute inset-0 bg-[url(https://framerusercontent.com/images/gR21e8Wh6l3pU6CciDrqt8wjHM.png)] bg-cover bg-center bg-black opacity-80" />
          }
          className="lg:col-span-2 lg:rounded-bl-3xl"
        />
        <BentoCard
          eyebrow="Source"
          title="Connect everything"
          description="Seamlessly integrate with your local file system, Supabase, and your favorite tools for total context."
          graphic={
            <div className="absolute inset-0 bg-[url(https://framerusercontent.com/images/PTO3RQ3S65zfZRFEGZGpiOom6aQ.png)] bg-cover bg-center opacity-80" />
          }
          className="lg:col-span-2"
        />
        <BentoCard
          eyebrow="Limitless"
          title="Generate anything"
          description="From complex React components to beautiful UI mockups, M-Chat turns your ideas into reality instantly."
          graphic={
            <div className="absolute inset-0 bg-[url(https://framerusercontent.com/images/h496iPSwtSnGZwpJyErl6cLWdtE.png)] bg-cover bg-center opacity-80" />
          }
          className="max-lg:rounded-b-3xl lg:col-span-2 lg:rounded-br-3xl"
        />
      </div>
    </div>
  );
}

export function BentoCard({
  className = "",
  eyebrow,
  title,
  description,
  graphic,
  fade = [],
}: {
  className?: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  graphic?: React.ReactNode;
  fade?: ("top" | "bottom")[];
}) {
  return (
    <motion.div
      initial="idle"
      whileHover="active"
      variants={{ idle: {}, active: {} }}
      className={clsx(
        className,
        "group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08]",
        "bg-[var(--m-bg-card)] shadow-lg shadow-black/20"
      )}
    >
      <div className="relative h-[22rem] sm:h-[26rem] shrink-0 bg-[#0a0a10]">
        {graphic}
        {fade.includes("top") && (
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--m-bg-card)] to-50% opacity-25" />
        )}
        {fade.includes("bottom") && (
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--m-bg-card)] to-50% opacity-25" />
        )}
      </div>
      
      {/* Increased padding and height to ensure text fits */}
      <div className="relative p-5 sm:p-6 z-20 isolate mt-[-80px] h-auto min-h-[10rem] bg-[#0c0c14]/80 backdrop-blur-xl border-t border-white/[0.05]">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--m-accent-blue)]">
          {eyebrow}
        </h3>
        <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[var(--m-text-primary)]">
          {title}
        </p>
        <p className="mt-2 text-sm text-[var(--m-text-secondary)] leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
