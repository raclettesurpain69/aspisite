/**
 * Types du schema Supabase (schema `public`), tenus a jour manuellement en
 * miroir des migrations dans supabase/migrations/.
 *
 * Generation normale : `npm run supabase:types` (necessite Supabase local
 * demarre, donc Docker). Ce fichier a ete ecrit a la main a partir du
 * schema valide via psql (voir supabase/migrations/), car Docker n'etait
 * pas disponible au moment de l'ecriture ; a regenerer via la commande
 * ci-dessus des que possible pour retrouver la source de verite normale.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CallStatus = "ringing" | "in_progress" | "completed" | "failed";
export type CallUrgency = "low" | "normal" | "high" | "critical";
export type NotificationChannel = "email" | "sms" | "whatsapp";
export type NotificationStatus = "pending" | "sent" | "failed";
export type LogLevel = "debug" | "info" | "warn" | "error";
export type UserRole = "owner" | "admin" | "member";
export type SubscriptionPlanCode = "trial" | "starter" | "pro" | "business";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type Database = {
  public: {
    Tables: {
      subscription_plans: {
        Row: {
          code: SubscriptionPlanCode;
          name: string;
          price_cents: number;
          max_calls_per_month: number;
          max_call_duration_seconds: number;
          max_users: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          code: SubscriptionPlanCode;
          name: string;
          price_cents?: number;
          max_calls_per_month: number;
          max_call_duration_seconds: number;
          max_users: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Insert"]>;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          logo_url: string | null;
          business_type: string | null;
          address: string | null;
          city: string | null;
          timezone: string;
          business_hours: Json;
          plan_code: SubscriptionPlanCode;
          subscription_status: SubscriptionStatus;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          logo_url?: string | null;
          business_type?: string | null;
          address?: string | null;
          city?: string | null;
          timezone?: string;
          business_hours?: Json;
          plan_code?: SubscriptionPlanCode;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      company_phone_numbers: {
        Row: {
          id: string;
          company_id: string;
          phone_number: string;
          twilio_sid: string | null;
          label: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          phone_number: string;
          twilio_sid?: string | null;
          label?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["company_phone_numbers"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          company_id: string | null;
          email: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id?: string | null;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          first_name: string | null;
          last_name: string | null;
          phone_number: string;
          address: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          first_name?: string | null;
          last_name?: string | null;
          phone_number: string;
          address?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      calls: {
        Row: {
          id: string;
          company_id: string;
          customer_id: string | null;
          twilio_call_sid: string | null;
          from_number: string;
          to_number: string;
          status: CallStatus;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          reason: string | null;
          problem_description: string | null;
          urgency: CallUrgency;
          availability: string | null;
          additional_info: string | null;
          extra_fields: Json;
          recommended_action: string | null;
          summary_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          customer_id?: string | null;
          twilio_call_sid?: string | null;
          from_number: string;
          to_number: string;
          status?: CallStatus;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          reason?: string | null;
          problem_description?: string | null;
          urgency?: CallUrgency;
          availability?: string | null;
          additional_info?: string | null;
          extra_fields?: Json;
          recommended_action?: string | null;
          summary_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["calls"]["Insert"]>;
        Relationships: [];
      };
      call_recordings: {
        Row: {
          id: string;
          call_id: string;
          storage_bucket: string;
          storage_path: string;
          mime_type: string;
          duration_seconds: number | null;
          twilio_recording_sid: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          storage_bucket?: string;
          storage_path: string;
          mime_type?: string;
          duration_seconds?: number | null;
          twilio_recording_sid?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["call_recordings"]["Insert"]>;
        Relationships: [];
      };
      call_transcriptions: {
        Row: {
          id: string;
          call_id: string;
          full_text: string;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          full_text: string;
          language?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["call_transcriptions"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          company_id: string;
          call_id: string | null;
          channel: NotificationChannel;
          recipient: string;
          status: NotificationStatus;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          call_id?: string | null;
          channel: NotificationChannel;
          recipient: string;
          status?: NotificationStatus;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      settings: {
        Row: {
          company_id: string;
          greeting_message: string;
          custom_questions: Json;
          notification_channels: NotificationChannel[];
          updated_at: string;
        };
        Insert: {
          company_id: string;
          greeting_message?: string;
          custom_questions?: Json;
          notification_channels?: NotificationChannel[];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: [];
      };
      call_logs: {
        Row: {
          id: string;
          company_id: string | null;
          call_id: string | null;
          level: LogLevel;
          event_type: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          call_id?: string | null;
          level?: LogLevel;
          event_type: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["call_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      company_plan_limits: {
        Row: {
          company_id: string | null;
          plan_code: SubscriptionPlanCode | null;
          subscription_status: SubscriptionStatus | null;
          max_calls_per_month: number | null;
          max_call_duration_seconds: number | null;
          max_users: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_my_company_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      company_user_count: {
        Args: { p_company_id: string };
        Returns: number;
      };
      get_company_usage: {
        Args: { p_company_id: string };
        Returns: { calls_this_period: number; total_duration_seconds: number }[];
      };
    };
    Enums: {
      call_status: CallStatus;
      call_urgency: CallUrgency;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
      log_level: LogLevel;
    };
  };
};
