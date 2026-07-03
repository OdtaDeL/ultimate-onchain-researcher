// Hand-authored to match supabase/migrations/001_initial_schema.sql and
// 002_future_integrations.sql. Treat this file as a snapshot — once the
// project is linked, regenerate the authoritative version with:
//   supabase gen types typescript --linked > types/database.types.ts
//
// `Relationships: []` on every table/view is required by @supabase/
// supabase-js's GenericTable/GenericView constraint (it expects FK
// metadata there) — left empty since this wasn't generated from a live
// linked project. Functionally inert for plain CRUD usage; only affects
// type inference for embedded-resource (`select("*, other_table(*)")`)
// queries, which this codebase doesn't use yet.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          slug: string;
          name: string;
          ticker: string | null;
          category: string | null;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          twitter: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          ticker?: string | null;
          category?: string | null;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          twitter?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      project_metrics: {
        Row: {
          id: string;
          project_id: string;
          market_cap: number | null;
          fdv: number | null;
          price: number | null;
          volume_24h: number | null;
          tvl: number | null;
          revenue_30d: number | null;
          fees_30d: number | null;
          market_cap_rank: number | null;
          circulating_supply: number | null;
          total_supply: number | null;
          max_supply: number | null;
          price_change_24h: number | null;
          price_change_7d: number | null;
          price_change_30d: number | null;
          ath: number | null;
          atl: number | null;
          tvl_change_1d: number | null;
          tvl_change_7d: number | null;
          revenue_24h: number | null;
          fees_24h: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          market_cap?: number | null;
          fdv?: number | null;
          price?: number | null;
          volume_24h?: number | null;
          tvl?: number | null;
          revenue_30d?: number | null;
          fees_30d?: number | null;
          market_cap_rank?: number | null;
          circulating_supply?: number | null;
          total_supply?: number | null;
          max_supply?: number | null;
          price_change_24h?: number | null;
          price_change_7d?: number | null;
          price_change_30d?: number | null;
          ath?: number | null;
          atl?: number | null;
          tvl_change_1d?: number | null;
          tvl_change_7d?: number | null;
          revenue_24h?: number | null;
          fees_24h?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_metrics"]["Insert"]>;
        Relationships: [];
      };
      funds: {
        Row: {
          id: string;
          slug: string;
          name: string;
          logo_url: string | null;
          website: string | null;
          twitter: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          logo_url?: string | null;
          website?: string | null;
          twitter?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["funds"]["Insert"]>;
        Relationships: [];
      };
      funding_rounds: {
        Row: {
          id: string;
          project_id: string;
          round_type: string | null;
          amount_raised: number | null;
          announced_date: string | null;
          fdv: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          round_type?: string | null;
          amount_raised?: number | null;
          announced_date?: string | null;
          fdv?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["funding_rounds"]["Insert"]>;
        Relationships: [];
      };
      funding_investors: {
        Row: {
          id: string;
          funding_round_id: string;
          fund_id: string;
        };
        Insert: {
          id?: string;
          funding_round_id: string;
          fund_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["funding_investors"]["Insert"]>;
        Relationships: [];
      };
      project_scores: {
        Row: {
          id: string;
          project_id: string;
          funding_score: number | null;
          investor_score: number | null;
          tvl_score: number | null;
          market_score: number | null;
          revenue_score: number | null;
          unlock_score: number | null;
          momentum_score: number | null;
          total_score: number | null;
          score_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          funding_score?: number | null;
          investor_score?: number | null;
          tvl_score?: number | null;
          market_score?: number | null;
          revenue_score?: number | null;
          unlock_score?: number | null;
          momentum_score?: number | null;
          total_score?: number | null;
          score_date: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_scores"]["Insert"]>;
        Relationships: [];
      };
      weekly_rankings: {
        Row: {
          id: string;
          project_id: string;
          rank: number;
          total_score: number | null;
          week_start: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          rank: number;
          total_score?: number | null;
          week_start: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_rankings"]["Insert"]>;
        Relationships: [];
      };
      monthly_rankings: {
        Row: {
          id: string;
          project_id: string;
          rank: number;
          total_score: number | null;
          month_start: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          rank: number;
          total_score?: number | null;
          month_start: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_rankings"]["Insert"]>;
        Relationships: [];
      };
      data_sources: {
        Row: { id: string; slug: string; name: string };
        Insert: { id?: string; slug: string; name: string };
        Update: Partial<Database["public"]["Tables"]["data_sources"]["Insert"]>;
        Relationships: [];
      };
      project_external_ids: {
        Row: {
          id: string;
          project_id: string;
          data_source_id: string;
          external_id: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          data_source_id: string;
          external_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_external_ids"]["Insert"]>;
        Relationships: [];
      };
      social_metrics: {
        Row: {
          id: string;
          project_id: string;
          mindshare_score: number | null;
          smart_followers: number | null;
          sentiment_score: number | null;
          captured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          mindshare_score?: number | null;
          smart_followers?: number | null;
          sentiment_score?: number | null;
          captured_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["social_metrics"]["Insert"]>;
        Relationships: [];
      };
      token_unlock_events: {
        Row: {
          id: string;
          project_id: string;
          unlock_date: string;
          unlock_type: string | null;
          amount_tokens: number | null;
          amount_usd: number | null;
          percent_of_supply: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          unlock_date: string;
          unlock_type?: string | null;
          amount_tokens?: number | null;
          amount_usd?: number | null;
          percent_of_supply?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["token_unlock_events"]["Insert"]>;
        Relationships: [];
      };
      smart_money_wallets: {
        Row: {
          id: string;
          address: string;
          chain: string;
          label: string | null;
          entity_type: string | null;
          data_source_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          chain?: string;
          label?: string | null;
          entity_type?: string | null;
          data_source_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["smart_money_wallets"]["Insert"]>;
        Relationships: [];
      };
      smart_money_flows: {
        Row: {
          id: string;
          wallet_id: string;
          project_id: string;
          direction: "in" | "out";
          amount_usd: number | null;
          flow_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          project_id: string;
          direction: "in" | "out";
          amount_usd?: number | null;
          flow_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["smart_money_flows"]["Insert"]>;
        Relationships: [];
      };
      sync_runs: {
        Row: {
          id: string;
          provider: string;
          job_name: string;
          status: "succeeded" | "failed";
          started_at: string;
          completed_at: string;
          duration_ms: number;
          pages_processed: number | null;
          items_processed: number | null;
          items_inserted: number | null;
          items_updated: number | null;
          items_skipped: number | null;
          failed_pages: number[];
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          job_name: string;
          status: "succeeded" | "failed";
          started_at: string;
          completed_at: string;
          duration_ms: number;
          pages_processed?: number | null;
          items_processed?: number | null;
          items_inserted?: number | null;
          items_updated?: number | null;
          items_skipped?: number | null;
          failed_pages?: number[];
          last_error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sync_runs"]["Insert"]>;
        Relationships: [];
      };
      project_aliases: {
        Row: {
          id: string;
          project_id: string;
          provider: string;
          provider_identifier: string | null;
          provider_slug: string | null;
          provider_symbol: string | null;
          provider_name: string | null;
          contract_address: string | null;
          confidence: number;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          provider: string;
          provider_identifier?: string | null;
          provider_slug?: string | null;
          provider_symbol?: string | null;
          provider_name?: string | null;
          contract_address?: string | null;
          confidence: number;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_aliases"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      fund_leaderboard: {
        Row: {
          fund_id: string;
          name: string;
          logo_url: string | null;
          total_investments: number;
          total_projects: number;
          total_amount_raised: number;
          last_investment_date: string | null;
        };
        Relationships: [];
      };
      weekly_rankings_mv: {
        Row: {
          project_id: string;
          week_start: string;
          total_score: number | null;
          rank: number;
        };
        Relationships: [];
      };
      monthly_rankings_mv: {
        Row: {
          project_id: string;
          month_start: string;
          total_score: number | null;
          rank: number;
        };
        Relationships: [];
      };
      top_funds: {
        Row: {
          fund_id: string;
          name: string;
          logo_url: string | null;
          portfolio_project_count: number;
          avg_investor_score: number | null;
          rank: number;
        };
        Relationships: [];
      };
      top_projects: {
        Row: {
          project_id: string;
          slug: string;
          name: string;
          total_score: number | null;
          funding_score: number | null;
          investor_score: number | null;
          market_score: number | null;
          tvl_score: number | null;
          revenue_score: number | null;
          unlock_score: number | null;
          momentum_score: number | null;
          score_date: string;
          rank: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      refresh_materialized_view: {
        Args: { view_name: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
