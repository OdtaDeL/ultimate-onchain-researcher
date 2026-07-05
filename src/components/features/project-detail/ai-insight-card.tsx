import { Sparkles } from "lucide-react";
import { Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";
import type { ScoreCategory } from "./mock-data";

// "AI Insight" — a natural-language research summary synthesized
// deterministically from the scoring engine's own component scores plus
// unlock/momentum data. This is rule-based text generation, NOT an LLM
// call: the demo constraint is zero external services, and the scoring
// engine is already the app's single source of analytical truth, so the
// prose can never contradict the numbers shown directly above it.

export interface AiInsightInput {
  name: string;
  score: number;
  scoreCategories: ScoreCategory[];
  nextUnlock: { dateLabel: string; percentOfSupply: number | null };
  changePercent24h: number | null;
}

export function generateProjectInsight(input: AiInsightInput): string {
  const { name, score, scoreCategories, nextUnlock, changePercent24h } = input;
  const sentences: string[] = [];

  // 1. Overall assessment, banded by total score.
  if (score >= 80) {
    sentences.push(`${name} shows a standout overall profile, scoring ${score}/100 across our seven research pillars.`);
  } else if (score >= 65) {
    sentences.push(`${name} presents a solid overall profile at ${score}/100, with clear strengths outweighing its weak spots.`);
  } else if (score >= 50) {
    sentences.push(`${name} scores a mixed ${score}/100 — worth watching, but the profile carries real trade-offs.`);
  } else {
    sentences.push(`${name} scores ${score}/100, placing it in the higher-risk tier of tracked projects.`);
  }

  // 2. Strongest vs. weakest pillar (sub-components only).
  const subs = scoreCategories.filter((c) => c.key !== "overall");
  if (subs.length >= 2) {
    const sorted = [...subs].sort((a, b) => b.score - a.score);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.score - worst.score >= 15) {
      sentences.push(`Its strongest pillar is ${best.label} (${best.score}), while ${worst.label} (${worst.score}) is the main drag on the total.`);
    } else {
      sentences.push(`Component scores are unusually balanced — ${best.label} (${best.score}) leads, but no single pillar dominates the profile.`);
    }
  }

  // 3. Upcoming unlock, weighted by supply impact.
  if (nextUnlock.percentOfSupply !== null && nextUnlock.dateLabel !== "—") {
    if (nextUnlock.percentOfSupply >= 2) {
      sentences.push(`Caution: a significant unlock of ${nextUnlock.percentOfSupply}% of supply lands on ${nextUnlock.dateLabel} — historically a source of sell pressure.`);
    } else if (nextUnlock.percentOfSupply >= 0.5) {
      sentences.push(`A moderate unlock (${nextUnlock.percentOfSupply}% of supply) is scheduled for ${nextUnlock.dateLabel}.`);
    } else {
      sentences.push(`The next unlock on ${nextUnlock.dateLabel} is minor (${nextUnlock.percentOfSupply}% of supply) and unlikely to move the market.`);
    }
  }

  // 4. Short-term momentum, only when notable.
  if (changePercent24h !== null) {
    if (changePercent24h >= 5) {
      sentences.push(`Momentum is currently with the bulls: price is up ${changePercent24h.toFixed(1)}% in the last 24 hours.`);
    } else if (changePercent24h <= -5) {
      sentences.push(`Note the near-term weakness — price is down ${Math.abs(changePercent24h).toFixed(1)}% over the last 24 hours.`);
    }
  }

  return sentences.join(" ");
}

interface AiInsightCardProps {
  input: AiInsightInput | null;
  isLoading?: boolean;
}

export function AiInsightCard({ input, isLoading }: AiInsightCardProps) {
  return (
    <Card className={cn(radius.xl, "bg-surface-elevated p-4")}>
      <div className="mb-2 flex items-center gap-1.5 text-accent">
        <Sparkles size={14} />
        <span className="text-[13px] font-medium leading-[18px] tracking-[0.1px]">AI Insight</span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton variant="line" className="w-full" />
          <Skeleton variant="line" className="w-full" />
          <Skeleton variant="line" className="w-2/3" />
        </div>
      ) : input ? (
        <p className="text-[15px] font-normal leading-[22px] text-foreground">{generateProjectInsight(input)}</p>
      ) : null}
    </Card>
  );
}
