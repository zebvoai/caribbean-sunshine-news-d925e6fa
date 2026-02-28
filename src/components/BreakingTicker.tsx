import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

interface TickerItem {
  id: string;
  title: string;
  slug: string;
}

const BreakingTicker = ({ items }: { items: TickerItem[] }) => {
  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div className="bg-destructive/5 border-b border-destructive/10 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="flex-shrink-0 bg-destructive text-destructive-foreground px-5 py-3 flex items-center gap-2 relative z-10">
          <Zap className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-[10px] font-body font-bold uppercase tracking-[0.15em]">Breaking</span>
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="ticker-track flex items-center gap-16 py-3 px-6">
            {doubled.map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                to={`/news/${item.slug}`}
                className="whitespace-nowrap text-sm font-body font-medium text-foreground/80 hover:text-destructive transition-colors flex-shrink-0 flex items-center gap-3"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-destructive/40 flex-shrink-0" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingTicker;
