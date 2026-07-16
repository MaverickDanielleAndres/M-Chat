import RuixenMoonChat from '@/components/ui/ruixen-moon-chat';

export function EmptyState() {
  // h-full lets the EmptyState fill the chat area so its `justify-center`
  // actually centers the hero vertically instead of pinning to the top.
  return (
    <div className="h-full">
      <RuixenMoonChat />
    </div>
  );
}