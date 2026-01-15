export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          slug: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          custom_domain: string | null
          default_language: string | null
          timezone: string | null
          tier_id: string | null
          subscription_status: string | null
          subscription_start_date: string | null
          subscription_end_date: string | null
          data_residency: string | null
          saudization_enabled: boolean | null
          saudization_target_percentage: number | null
          emiratization_enabled: boolean | null
          emiratization_target_percentage: number | null
          max_jobs: number | null
          max_candidates: number | null
          max_users: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          name_ar?: string | null
          slug: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          custom_domain?: string | null
          default_language?: string | null
          timezone?: string | null
          tier_id?: string | null
          subscription_status?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          data_residency?: string | null
          saudization_enabled?: boolean | null
          saudization_target_percentage?: number | null
          emiratization_enabled?: boolean | null
          emiratization_target_percentage?: number | null
          max_jobs?: number | null
          max_candidates?: number | null
          max_users?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          name_ar?: string | null
          slug?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          custom_domain?: string | null
          default_language?: string | null
          timezone?: string | null
          tier_id?: string | null
          subscription_status?: string | null
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          data_residency?: string | null
          saudization_enabled?: boolean | null
          saudization_target_percentage?: number | null
          emiratization_enabled?: boolean | null
          emiratization_target_percentage?: number | null
          max_jobs?: number | null
          max_candidates?: number | null
          max_users?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          org_id: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          department: string | null
          language_preference: string | null
          timezone: string | null
          avatar_url: string | null
          is_active: boolean | null
          last_login_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          org_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          department?: string | null
          language_preference?: string | null
          timezone?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          department?: string | null
          language_preference?: string | null
          timezone?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      subscription_tiers: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          description: string | null
          description_ar: string | null
          price_monthly: number
          price_yearly: number | null
          currency: string | null
          max_jobs: number
          max_candidates: number
          max_users: number
          max_storage_gb: number
          features: Json | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          name_ar?: string | null
          description?: string | null
          description_ar?: string | null
          price_monthly: number
          price_yearly?: number | null
          currency?: string | null
          max_jobs: number
          max_candidates: number
          max_users: number
          max_storage_gb: number
          features?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          name_ar?: string | null
          description?: string | null
          description_ar?: string | null
          price_monthly?: number
          price_yearly?: number | null
          currency?: string | null
          max_jobs?: number
          max_candidates?: number
          max_users?: number
          max_storage_gb?: number
          features?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "org_admin"
        | "hr_manager"
        | "recruiter"
        | "hiring_manager"
        | "interviewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
