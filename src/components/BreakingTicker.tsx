import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

interface TickerItem {
  id: string;
  title: string;
  slug: string;
}

const BreakingTicker = ({ items }: { items: TickerItem[] }) => {
  if (!items.length) return null;

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="bg-destructive/5 border-b border-destructive/10 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="flex-shrink-0 bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          <span className="text-[11px] font-body font-bold uppercase tracking-wider">Breaking</span>
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div className="ticker-track flex items-center gap-12 py-2.5 px-4">
            {doubled.map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                to={`/news/${item.slug}`}
                className="whitespace-nowrap text-sm font-body font-medium text-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
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
