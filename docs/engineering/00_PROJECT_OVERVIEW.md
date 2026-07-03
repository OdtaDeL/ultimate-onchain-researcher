# 00 — Project Overview

## Purpose

Ultimate Onchain Researcher is a Telegram Mini App (Next.js) that helps crypto investors discover, evaluate, and track onchain projects and venture funds. The core value proposition is a scoring engine that aggregates funding data, market metrics, TVL, token unlock schedules, and investor reputation into a single comparable score (0–100) with a letter grade.

## Platform Context

- **Delivery**: Telegram Mini App (WebView inside Telegram). No desktop layout. No traditional browser tab.
- **Framework**: Next.js 15.2.9 (App Router), React 19, TypeScript strict mode
- **Hosting**: Vercel (configured in vercel.json)
- **Backend**: Supabase (PostgreSQL + PostgREST + RLS)
- **Package name**: `smart-money-discovery-platform`

## Feature Set

| Feature | Status | Notes |
|---|---|---|
| Home / Trending feed | Implemented | Rankings from materialized views |
| Search | Implemented | Supabase text search |
| Markets tab | Implemented | Sorted list of projects/funds |
| Project Detail | Implemented | Score, funding, unlock, metrics |
| Fund Detail | Implemented | Portfolio, investments, insights |
| Watchlist (store) | Implemented | Zustand + localStorage persistence |
| Watchlist (page) | **Broken** | Always shows empty; never reads store |
| Favorites | Implemented (store-only) | No dedicated page |
| Scoring Engine | Implemented | 7-component pure TypeScript engine |
| Score ingestion CLI | Implemented | `sync:scores` script |
| Data ingestion CLI | Partial | ChainBroker + DefiLlama pipelines |

## Architecture in One Paragraph

Data flows from three external providers (ChainBroker for funding, CoinGecko for market, DefiLlama for TVL) through ingestion CLI scripts into Supabase tables. The scoring engine reads those tables, computes component scores, and writes results back. Materialized views pre-aggregate rankings. The Next.js app fetches data through Next.js API route handlers that call the Dashboard Query Layer (read-only DTO assemblers). React Query caches responses in the browser; Zustand manages local state (watchlist, favorites, search recents, UI state).

## Repository Structure

```
src/
  app/             Next.js App Router pages + API routes
    (tabs)/        Tab pages: home, markets, search, watchlist
    project/[slug] Project detail
    fund/[slug]    Fund detail
    api/           REST API handlers
  components/      React components (layout, ui, shared, features)
  lib/             Client-side utilities
    api/           React Query hooks + data sources + formatters
    format.ts      Number/date formatters
    theme/         Color + typography tokens
  store/           Zustand stores
  scoring/         Scoring engine (pure TypeScript)
  providers/       External API clients (ChainBroker, CoinGecko, DefiLlama)
  dashboard/       Read-only DTO assemblers (server-side)
  ingestion/       Data ingestion scripts
  types/           database.types.ts (Supabase-generated)
docs/
  ui/              UX specs (HOME_SCREEN_SPEC, NAVIGATION_SPEC, etc.)
  engineering/     This knowledge base
```
