import { cn } from "@/lib/utils";

interface SeoCharCountProps {
  value: string;
  max: number;
  idealMin?: number;
  idealMax?: number;
}

const SeoCharCount = ({ value, max, idealMin, idealMax }: SeoCharCountProps) => {
  const len = value.length;
  const iMin = idealMin ?? 0;
  const iMax = idealMax ?? max;
  const isIdeal = len >= iMin && len <= iMax;
  const remaining = iMax - len;

  const color = len === 0
    ? "text-muted-foreground"
    : isIdeal
    ? "text-primary"
    : "text-muted-foreground";

  return (
    <span className={cn("text-xs font-normal inline-flex items-center gap-1.5", color)}>
      {len}/{iMax}
      {len > 0 && isIdeal && <span className="hidden sm:inline">✓ Good for SEO</span>}
      {len > 0 && len < iMin && <span className="hidden sm:inline">— Need {iMin - len} more characters</span>}
    </span>
  );
};

export default SeoCharCount;
