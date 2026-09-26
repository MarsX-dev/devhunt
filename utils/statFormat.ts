export interface StatItem {
  label: string;
  value: number | string; // a string is shown as is (no count-up)
  delta?: number;
  deltaLabel?: string;
}

// 7,036 stays exact; 24,127,478 becomes 24.1M.
export const formatStat = (n: number) =>
  n >= 100_000 ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : n.toLocaleString('en-US');
