/*
 * Repository-owned Supabase contract types for migration
 * 202608220002_canonical_opportunity_schema.sql.
 *
 * Refresh this file from the owner-approved project after the migration is
 * applied. It is intentionally checked in so local typechecking does not
 * require access to a live Supabase project.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      sources: Table<{
        id: string; name: string; kind: string; base_url: string; trust_tier: string; priority: number;
        organizer_id: string | null; enabled: boolean; shadow_only: boolean; polling_interval_seconds: number;
        robots_reviewed: boolean; terms_reviewed: boolean; request_budget_bytes: number; response_budget_bytes: number;
        daily_cost_units: number; cursor: string | null; etag: string | null; last_modified: string | null;
        last_success_at: string | null; next_run_at: string | null; consecutive_failures: number; circuit_state: string;
        created_at: string; updated_at: string;
      }>;
      organizers: Table<{
        id: string; canonical_name: string; status: string; verified_domains: Json; platform_accounts: Json;
        evidence: Json; reviewer_id: string | null; impersonation_risk: string; created_at: string; updated_at: string;
      }>;
      opportunities: Table<{
        id: string; type: string; slug: string; title: string; organizer_id: string | null; lifecycle_state: string;
        publication_state: string; summary: string | null; description: string | null; announcement_at: string | null;
        registration_open_at: string | null; deadline_at: string | null; start_at: string | null; end_at: string | null;
        source_timezone: string | null; location: string | null; is_remote: boolean | null; prize_or_funding: Json;
        eligibility: string | null; application_url: string | null; first_detected_at: string; announced_at: string | null;
        last_verified_at: string | null; last_changed_at: string | null; version: number; confidence: Json; risk: Json;
        created_at: string; updated_at: string; archived_at: string | null;
      }>;
      source_observations: Table<{
        id: string; source_id: string; source_item_id: string; canonical_source_url: string; observed_at: string;
        fetched_at: string; content_hash: string; http_metadata: Json; raw_snapshot_reference: string | null;
        normalized_payload: Json; parser_version: string; processing_status: string; error_category: string | null;
        created_at: string;
      }>;
      opportunity_versions: Table<{
        opportunity_id: string; version: number; snapshot: Json; changed_at: string; changed_by: string | null;
      }>;
      field_evidence: Table<{
        id: string; opportunity_id: string; opportunity_version: number; field_path: string; observation_id: string;
        source_url: string; captured_text_span: string | null; structured_path: string | null; observed_value: Json;
        extraction_method: string; confidence: number | null; conflict_state: string; created_at: string;
      }>;
      review_cases: Table<{
        id: string; opportunity_id: string | null; triggering_observation_id: string | null; reason_codes: string[];
        priority: number; risk: Json; assigned_reviewer_id: string | null; status: string; due_at: string | null;
        proposed_changes: Json; decision: string | null; rationale: string | null; decided_at: string | null;
        created_at: string; updated_at: string;
      }>;
      jobs: Table<{
        id: string; job_type: string; source_id: string | null; schedule_key: string | null; idempotency_key: string;
        status: string; attempt_count: number; lease_owner: string | null; lease_expires_at: string | null;
        next_attempt_at: string | null; last_error_category: string | null; cost_units: number; dead_letter_reason: string | null;
        created_at: string; updated_at: string;
      }>;
      job_attempts: Table<{
        id: string; job_id: string; attempt_number: number; status: string; worker_id: string | null; started_at: string;
        finished_at: string | null; error_category: string | null; error_message: string | null; latency_ms: number | null;
      }>;
      subscriptions: Table<{
        id: string; user_id: string; channel: string; verified_destination: string | null; opportunity_types: string[];
        topics: string[]; geography: string[]; remote_preference: string; normal_alerts: boolean; provisional_alerts: boolean;
        cadence: string; quiet_hours: Json; verified_at: string | null; created_at: string; updated_at: string;
      }>;
      notification_deliveries: Table<{
        id: string; user_id: string; channel: string; opportunity_id: string; opportunity_version: number; reason: string;
        status: string; provider_message_id: string | null; idempotency_key: string; sent_at: string | null;
        last_error_category: string | null; created_at: string;
      }>;
      opportunity_saves: Table<{ user_id: string; opportunity_id: string; created_at: string }>;
      opportunity_follows: Table<{ user_id: string; opportunity_id: string; created_at: string }>;
      audit_entries: Table<{
        id: string; actor_id: string | null; actor_role: string; action: string; entity_type: string; entity_id: string | null;
        before_state: Json | null; after_state: Json | null; reason: string | null; created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type OpportunityRow = Database['public']['Tables']['opportunities']['Row'];
export type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert'];
export type SaveRow = Database['public']['Tables']['opportunity_saves']['Row'];
export type FollowRow = Database['public']['Tables']['opportunity_follows']['Row'];
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
