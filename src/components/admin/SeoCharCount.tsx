import { cn } from "@/lib/utils";

interface SeoCharCountProps {
  value: string;
  max: number;
  idealMin?: number;
  idealMax?: number;
  label?: string;
}

const SeoCharCount = ({ value, max, idealMin, idealMax, label }: SeoCharCountProps) => {
  const len = value.length;
  const iMin = idealMin ?? 0;
  const iMax = idealMax ?? max;

  const isOver = len > max;
  const isIdeal = len >= iMin && len <= iMax;
  const isTooShort = len > 0 && len < iMin;

  const color = isOver
    ? "text-destructive"
    : isIdeal
    ? "text-primary"
    : isTooShort
    ? "text-yellow-600 dark:text-yellow-400"
    : "text-muted-foreground";

  const hint = isOver
    ? "Too long — may be truncated in search results"
    : isIdeal
    ? "Good length for SEO"
    : isTooShort
    ? "A bit short — aim for more detail"
    : len === 0
    ? ""
    : "";

  return (
    <span className={cn("text-xs font-normal inline-flex items-center gap-1.5", color)}>
      {len}/{max}
      {hint && <span className="hidden sm:inline">— {hint}</span>}
    </span>
  );
};

export default SeoCharCount;
