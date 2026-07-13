"use client";
import { useState, useEffect } from "react";
import { Bot, Cpu, Sparkles, Network, Box, Search, Database, Triangle, Github, FileText } from "lucide-react";

const ICONS = [
  { icon: Bot, name: "OpenAI" },
  { icon: Cpu, name: "Claude" },
  { icon: Sparkles, name: "Gemini" },
  { icon: Network, name: "Meta Llama" },
  { icon: Box, name: "Hugging Face" },
  { icon: Search, name: "Perplexity" },
  { icon: Database, name: "Supabase" },
  { icon: Triangle, name: "Vercel" },
  { icon: Github, name: "GitHub Copilot" },
  { icon: FileText, name: "Notion AI" },
];

function SemiCircleOrbit({ radius, centerX, centerY, count, iconSize }: any) {
  return (
    <>
      {/* Semi-circle glow background */}
      <div className="absolute inset-0 flex justify-center">
        <div
          className="
            w-[1000px] h-[1000px] rounded-full 
            bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.25),transparent_70%)]
            dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25),transparent_70%)]
            blur-3xl 
            -mt-40 
            pointer-events-none
          "
          style={{ zIndex: 0 }}
        />
      </div>

      {/* Orbit icons */}
      {Array.from({ length: count }).map((_, index) => {
        const angle = (index / (count - 1)) * 180;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);
        const icon = ICONS[index % ICONS.length];

        // Tooltip positioning — above or below based on angle
        const tooltipAbove = angle > 90;

        return (
          <div
            key={index}
            className="absolute flex flex-col items-center group hover:z-50 transition-all duration-300"
            style={{
              left: `${centerX + x - iconSize / 2}px`,
              top: `${centerY - y - iconSize / 2}px`,
              zIndex: 5,
            }}
          >
            <div 
              className="flex items-center justify-center rounded-full bg-card border border-white/10 shadow-[0_4_15px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-300 group-hover:scale-125 group-hover:bg-[#12121a] group-hover:border-[var(--m-accent-blue)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]" 
              style={{ width: iconSize, height: iconSize }}
            >
              <icon.icon size={iconSize * 0.5} className="text-foreground/50 transition-colors duration-300 group-hover:text-foreground drop-shadow-md" />
            </div>

            {/* Tooltip */}
            <div
              className={`absolute ${tooltipAbove ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
                } hidden group-hover:block whitespace-nowrap rounded-lg bg-card border border-border px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xl text-center`}
            >
              {icon.name}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-black ${tooltipAbove ? "top-full" : "bottom-full"
                  }`}
              ></div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function MultiOrbitSemiCircle() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const baseWidth = Math.min(size.width * 0.8, 700);
  const centerX = baseWidth / 2;
  const centerY = baseWidth * 0.5;

  const iconSize =
    size.width < 480
      ? Math.max(32, baseWidth * 0.055)
      : size.width < 768
        ? Math.max(42, baseWidth * 0.065)
        : Math.max(52, baseWidth * 0.075);

  return (
    <section className="py-10 md:py-16 relative min-h-[60vh] w-full overflow-hidden">
      <div className="relative flex flex-col items-center text-center z-10">
        <h1 className="my-6 text-2xl md:text-3xl font-display font-bold text-foreground">Model Ecosystem</h1>
        <p className="mb-12 max-w-2xl text-muted-foreground text-sm md:text-base">
          Chat with OpenAI, Claude, Gemini, and more, all from one intelligent workspace.
        </p>

        <div
          className="relative"
          style={{ width: baseWidth, height: baseWidth * 0.6 }}
        >
          <SemiCircleOrbit radius={baseWidth * 0.22} centerX={centerX} centerY={centerY} count={6} iconSize={iconSize} />
          <SemiCircleOrbit radius={baseWidth * 0.36} centerX={centerX} centerY={centerY} count={8} iconSize={iconSize} />
          <SemiCircleOrbit radius={baseWidth * 0.5} centerX={centerX} centerY={centerY} count={10} iconSize={iconSize} />
        </div>
      </div>
    </section>
  );
}
