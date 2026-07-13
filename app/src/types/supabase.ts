// Auto-generated style TypeScript types for the M-Chat normalized schema.
// Keep in sync with supabase/migrations/20260714000000_initial_normalized_schema.sql.
//
// `Insert`/`Update` are typed as `Record<string, any>` for compatibility with
// @supabase/supabase-js v2 generic constraints. Strict typing lives in
// src/types/db-helpers.ts for app-side use.

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = 'guest' | 'user' | 'pro' | 'premium' | 'admin' | 'developer';
export type SubscriptionTierDb = 'free' | 'registered' | 'pro' | 'premium';
export type SubscriptionStatusDb = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
export type BillingIntervalDb = 'monthly' | 'yearly';
export type MessageRoleDb = 'user' | 'assistant' | 'system' | 'tool';
export type MessageStatusDb = 'sending' | 'streaming' | 'complete' | 'error' | 'cancelled';
export type AttachmentKindDb = 'image' | 'video' | 'audio' | 'document' | 'code' | 'other';
export type CreditTxnType = 'grant' | 'purchase' | 'spend' | 'refund' | 'adjust' | 'reset' | 'bonus' | 'expiry';
export type ThemeModeDb = 'light' | 'dark' | 'system';
export type FontSizePrefDb = 'small' | 'medium' | 'large' | 'xl';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: UserRole;
          subscription_tier: SubscriptionTierDb;
          subscription_status: SubscriptionStatusDb | null;
          onboarding_completed: boolean;
          last_seen_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      folders: {
        Row: { id: string; user_id: string; name: string; color: string | null; icon: string | null; position: number; created_at: string; updated_at: string };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string | null;
          folder_id: string | null;
          title: string;
          system_prompt: string | null;
          model: string;
          temperature: number;
          pinned: boolean;
          archived: boolean;
          is_shared: boolean;
          share_slug: string | null;
          message_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
          last_active_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          parent_id: string | null;
          role: MessageRoleDb;
          content: string;
          status: MessageStatusDb;
          liked: boolean | null;
          disliked: boolean;
          tokens_input: number;
          tokens_output: number;
          latency_ms: number;
          model: string | null;
          finish_reason: string | null;
          metadata: Json;
          edited: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      attachments: {
        Row: {
          id: string;
          message_id: string;
          user_id: string | null;
          kind: AttachmentKindDb;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          public_url: string | null;
          thumbnail_url: string | null;
          width: number | null;
          height: number | null;
          duration_ms: number | null;
          extracted_text: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      credit_wallets: {
        Row: {
          user_id: string;
          balance: number;
          lifetime_granted: number;
          lifetime_spent: number;
          daily_quota: number;
          daily_used: number;
          daily_reset_at: string;
          last_grant_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: CreditTxnType;
          description: string | null;
          reference_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      subscription_plans: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          tagline: string | null;
          price_monthly: number;
          price_yearly: number;
          currency: string;
          features: Json;
          max_prompts_daily: number;
          max_storage_mb: number;
          max_file_size_mb: number;
          max_conversations: number;
          monthly_credits: number;
          includes_image_gen: boolean;
          includes_voice: boolean;
          includes_api: boolean;
          includes_web_search: boolean;
          includes_custom_gpts: boolean;
          priority_level: number;
          highlight: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: SubscriptionStatusDb;
          billing_interval: BillingIntervalDb;
          current_period_start: string;
          current_period_end: string;
          trial_ends_at: string | null;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          payment_provider: string | null;
          external_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      app_settings: {
        Row: {
          user_id: string;
          theme: ThemeModeDb;
          accent_color: string;
          font_size: FontSizePrefDb;
          font_family: string;
          density: string;
          language: string;
          animations_enabled: boolean;
          sound_enabled: boolean;
          enter_to_send: boolean;
          stream_responses: boolean;
          show_token_counts: boolean;
          developer_mode: boolean;
          default_model: string;
          custom_instructions: string | null;
          shortcuts: Json;
          privacy: Json;
          notifications: Json;
          updated_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          conversation_id: string | null;
          message_id: string | null;
          model: string;
          feature: string;
          tokens_input: number;
          tokens_output: number;
          credits_used: number;
          latency_ms: number;
          success: boolean;
          error_code: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      feature_flags: {
        Row: { key: string; enabled: boolean; description: string | null; metadata: Json; created_at: string; updated_at: string };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      tags: {
        Row: { id: string; user_id: string; name: string; color: string; created_at: string };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      conversation_tags: {
        Row: { conversation_id: string; tag_id: string };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          payload: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      spend_credits: { Args: { p_user_id: string; p_amount: number; p_description?: string | null; p_reference_id?: string | null; p_metadata?: Json }; Returns: number };
      grant_credits: { Args: { p_user_id: string; p_amount: number; p_type?: CreditTxnType; p_description?: string | null; p_reference_id?: string | null; p_metadata?: Json }; Returns: number };
      touch_conversation: { Args: { p_conversation_id: string }; Returns: void };
      check_user_can_prompt: {
        Args: { p_user_id: string };
        Returns: { can_send: boolean; reason: string; tier: string; daily_used: number; daily_quota: number; balance: number }[];
      };
      record_prompt_usage: {
        Args: { p_user_id: string; p_amount?: number; p_metadata?: Json };
        Returns: { new_daily_used: number; new_balance: number }[];
      };
    };
    Enums: {
      user_role: UserRole;
      subscription_tier: SubscriptionTierDb;
      subscription_status: SubscriptionStatusDb;
      billing_interval: BillingIntervalDb;
      message_role: MessageRoleDb;
      message_status: MessageStatusDb;
      attachment_kind: AttachmentKindDb;
      credit_txn_type: CreditTxnType;
      theme_mode: ThemeModeDb;
      font_size_pref: FontSizePrefDb;
    };
    CompositeTypes: Record<string, never>;
  };
}