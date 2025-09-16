// Generated Supabase TypeScript Types
// Based on the schema defined in CLAUDE.md

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          native_language: string
          target_languages: string[]
          proficiency_levels: Json
          age: number
          gender: string | null
          country: string
          timezone: string
          subscription_tier: string
          translation_quota_used: number
          quota_reset_date: string
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          native_language: string
          target_languages: string[]
          proficiency_levels?: Json
          age: number
          gender?: string | null
          country: string
          timezone: string
          subscription_tier?: string
          translation_quota_used?: number
          quota_reset_date?: string
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          native_language?: string
          target_languages?: string[]
          proficiency_levels?: Json
          age?: number
          gender?: string | null
          country?: string
          timezone?: string
          subscription_tier?: string
          translation_quota_used?: number
          quota_reset_date?: string
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          started_at: string
          ended_at: string | null
          duration: number | null
          user1_rating: number | null
          user2_rating: number | null
          connection_quality: Json | null
          session_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          started_at?: string
          ended_at?: string | null
          duration?: number | null
          user1_rating?: number | null
          user2_rating?: number | null
          connection_quality?: Json | null
          session_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          started_at?: string
          ended_at?: string | null
          duration?: number | null
          user1_rating?: number | null
          user2_rating?: number | null
          connection_quality?: Json | null
          session_status?: string
          created_at?: string
        }
      }
      vocabulary: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          original_text: string
          translated_text: string
          source_lang: string
          target_lang: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          original_text: string
          translated_text: string
          source_lang: string
          target_lang: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          original_text?: string
          translated_text?: string
          source_lang?: string
          target_lang?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          session_id: string | null
          reason: string
          description: string | null
          status: string
          reviewed_at: string | null
          reviewed_by: string | null
          action_taken: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          session_id?: string | null
          reason: string
          description?: string | null
          status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          action_taken?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          session_id?: string | null
          reason?: string
          description?: string | null
          status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          action_taken?: string | null
          created_at?: string
        }
      }
      matching_queue: {
        Row: {
          id: string
          user_id: string
          native_language: string
          target_language: string
          preferred_age_min: number | null
          preferred_age_max: number | null
          preferred_gender: string | null
          queue_position: number | null
          entered_at: string
          last_ping: string
        }
        Insert: {
          id?: string
          user_id: string
          native_language: string
          target_language: string
          preferred_age_min?: number | null
          preferred_age_max?: number | null
          preferred_gender?: string | null
          queue_position?: number | null
          entered_at?: string
          last_ping?: string
        }
        Update: {
          id?: string
          user_id?: string
          native_language?: string
          target_language?: string
          preferred_age_min?: number | null
          preferred_age_max?: number | null
          preferred_gender?: string | null
          queue_position?: number | null
          entered_at?: string
          last_ping?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}