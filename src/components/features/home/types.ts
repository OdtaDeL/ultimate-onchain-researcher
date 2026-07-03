// Prop-level types shared across Home feature components. Feature
// components do not import backend DTOs directly — the hook/source layer
// (src/lib/api/sources/home.ts) maps DTOs into these display-shaped prop
// types, keeping the component layer free of data-fetching concerns.
import type { ScoreGrade } from "@/lib/theme";

export type { ScoreGrade };

export type FundingQuality = "strong" | "moderate" | "weak";

export type RiskLevel = "low" | "moderate" | "high";

export interface MarketAsset {
  symbol: string;
  logoUrl?: string | null;
  price: number;
  changePercent24h: number;
}
