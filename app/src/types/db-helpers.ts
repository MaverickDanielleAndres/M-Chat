import type { Database } from './supabase';

/** Convenience aliases for the most common row types. */
export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type AttachmentRow = Database['public']['Tables']['attachments']['Row'];
export type AttachmentInsert = Database['public']['Tables']['attachments']['Insert'];

export type ProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type SettingsRow = Database['public']['Tables']['app_settings']['Row'];
export type SettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
export type SettingsUpdate = Database['public']['Tables']['app_settings']['Update'];

export type WalletRow = Database['public']['Tables']['credit_wallets']['Row'];

export type SubscriptionPlanRow = Database['public']['Tables']['subscription_plans']['Row'];
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

export type TagRow = Database['public']['Tables']['tags']['Row'];
export type FolderRow = Database['public']['Tables']['folders']['Row'];