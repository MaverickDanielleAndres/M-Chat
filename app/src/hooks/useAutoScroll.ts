import { useEffect, useRef, useState } from 'react';

export function useAutoScroll(deps: React.DependencyList) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isAtBottom) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, deps);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100;
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
    
    setIsAtBottom(atBottom);
    lastScrollTop.current = scrollTop;
  };

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    setIsAtBottom(true);
  };

  return { containerRef, isAtBottom, handleScroll, scrollToBottom };
}
