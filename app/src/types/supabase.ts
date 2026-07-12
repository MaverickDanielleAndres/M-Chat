export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: string;
          subscription_tier: string;
          subscription_status: string | null;
          prompt_count: number;
          daily_prompt_count: number;
          daily_prompt_reset: string | null;
          storage_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          subscription_tier?: string;
          subscription_status?: string | null;
          prompt_count?: number;
          daily_prompt_count?: number;
          daily_prompt_reset?: string | null;
          storage_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          subscription_tier?: string;
          subscription_status?: string | null;
          prompt_count?: number;
          daily_prompt_count?: number;
          daily_prompt_reset?: string | null;
          storage_used?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          pinned: boolean;
          folder_id: string | null;
          model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title?: string;
          pinned?: boolean;
          folder_id?: string | null;
          model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          pinned?: boolean;
          folder_id?: string | null;
          model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          chat_id: string;
          role: string;
          content: string;
          status: string;
          liked: boolean | null;
          attachments: Json | null;
          tokens_used: number | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role?: string;
          content?: string;
          status?: string;
          liked?: boolean | null;
          attachments?: Json | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: string;
          content?: string;
          status?: string;
          liked?: boolean | null;
          attachments?: Json | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          created_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          features: Json | null;
          max_prompts_daily: number;
          max_storage_mb: number;
          max_file_size_mb: number;
          includes_image_gen: boolean;
          includes_voice: boolean;
          includes_api: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          features?: Json | null;
          max_prompts_daily?: number;
          max_storage_mb?: number;
          max_file_size_mb?: number;
          includes_image_gen?: boolean;
          includes_voice?: boolean;
          includes_api?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          features?: Json | null;
          max_prompts_daily?: number;
          max_storage_mb?: number;
          max_file_size_mb?: number;
          includes_image_gen?: boolean;
          includes_voice?: boolean;
          includes_api?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          billing_interval: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: string;
          billing_interval?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: string;
          billing_interval?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          chat_id: string | null;
          message_id: string | null;
          model: string;
          tokens_input: number;
          tokens_output: number;
          latency_ms: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          chat_id?: string | null;
          message_id?: string | null;
          model?: string;
          tokens_input?: number;
          tokens_output?: number;
          latency_ms?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          chat_id?: string | null;
          message_id?: string | null;
          model?: string;
          tokens_input?: number;
          tokens_output?: number;
          latency_ms?: number;
          created_at?: string;
        };
      };
      feature_flags: {
        Row: {
          id: string;
          key: string;
          enabled: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          enabled?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          enabled?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
