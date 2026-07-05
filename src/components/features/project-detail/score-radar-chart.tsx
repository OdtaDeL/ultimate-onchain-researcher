import type { ScoreCategory } from "./mock-data";

// Pure-SVG radar (spider) chart for the per-category score breakdown.
// No chart library: 7 axes max and a single data series don't justify a
// dependency, and inline SVG inherits theme colors via currentColor so
// light/dark mode work with zero extra wiring. Rendered inside the
// Scoring Breakdown accordion above the exact-number progress bars —
// the radar gives shape-at-a-glance, the bars keep the precise values.

interface ScoreRadarChartProps {
  /** Sub-categories only (no "overall"); needs >= 3 axes to form a polygon. */
  categories: ScoreCategory[];
}

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 88; // leaves room for labels inside the viewBox
const LABEL_OFFSET = 22;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1];

function polarPoint(index: number, total: number, r: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2; // start at 12 o'clock
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

function polygonPoints(total: number, radiusFor: (index: number) => number): string {
  return Array.from({ length: total }, (_, i) => {
    const { x, y } = polarPoint(i, total, radiusFor(i));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export function ScoreRadarChart({ categories }: ScoreRadarChartProps) {
  const total = categories.length;
  if (total < 3) return null;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-[280px]"
      role="img"
      aria-label={`Score radar: ${categories.map((c) => `${c.label} ${c.score}`).join(", ")}`}
    >
      {/* Grid rings + spokes */}
      <g className="text-muted-foreground" opacity={0.25} fill="none" stroke="currentColor" strokeWidth={1}>
        {GRID_LEVELS.map((level) => (
          <polygon key={level} points={polygonPoints(total, () => RADIUS * level)} />
        ))}
        {categories.map((category, i) => {
          const { x, y } = polarPoint(i, total, RADIUS);
          return <line key={category.key} x1={CENTER} y1={CENTER} x2={x} y2={y} />;
        })}
      </g>

      {/* Data polygon */}
      <g className="text-accent">
        <polygon
          points={polygonPoints(total, (i) => RADIUS * (categories[i].score / 100))}
          fill="currentColor"
          fillOpacity={0.18}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {categories.map((category, i) => {
          const { x, y } = polarPoint(i, total, RADIUS * (category.score / 100));
          return <circle key={category.key} cx={x} cy={y} r={3} fill="currentColor" />;
        })}
      </g>

      {/* Axis labels */}
      <g className="text-muted-foreground" fill="currentColor" fontSize={11} fontWeight={500}>
        {categories.map((category, i) => {
          const { x, y } = polarPoint(i, total, RADIUS + LABEL_OFFSET);
          return (
            <text key={category.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle">
              {category.label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
