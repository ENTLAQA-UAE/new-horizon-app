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
      departments: {
        Row: {
          id: string
          org_id: string
          name: string
          name_ar: string | null
          description: string | null
          parent_id: string | null
          head_user_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          name_ar?: string | null
          description?: string | null
          parent_id?: string | null
          head_user_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          name_ar?: string | null
          description?: string | null
          parent_id?: string | null
          head_user_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_locations: {
        Row: {
          id: string
          org_id: string
          name: string
          name_ar: string | null
          city: string | null
          country: string
          country_code: string | null
          is_remote: boolean | null
          address: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          name_ar?: string | null
          city?: string | null
          country: string
          country_code?: string | null
          is_remote?: boolean | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          name_ar?: string | null
          city?: string | null
          country?: string
          country_code?: string | null
          is_remote?: boolean | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          id: string
          org_id: string
          name: string
          name_ar: string | null
          description: string | null
          color: string | null
          sort_order: number
          is_default: boolean | null
          auto_reject_after_days: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          name_ar?: string | null
          description?: string | null
          color?: string | null
          sort_order: number
          is_default?: boolean | null
          auto_reject_after_days?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          name_ar?: string | null
          description?: string | null
          color?: string | null
          sort_order?: number
          is_default?: boolean | null
          auto_reject_after_days?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          org_id: string
          department_id: string | null
          location_id: string | null
          title: string
          title_ar: string | null
          slug: string
          description: string | null
          description_ar: string | null
          requirements: string | null
          requirements_ar: string | null
          responsibilities: string | null
          responsibilities_ar: string | null
          benefits: string | null
          benefits_ar: string | null
          job_type: Database["public"]["Enums"]["job_type"]
          experience_level: Database["public"]["Enums"]["experience_level"]
          status: Database["public"]["Enums"]["job_status"]
          is_remote: boolean | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          show_salary: boolean | null
          education_requirement: string | null
          years_experience_min: number | null
          years_experience_max: number | null
          skills: Json | null
          languages: Json | null
          published_at: string | null
          closing_date: string | null
          positions_count: number | null
          is_featured: boolean | null
          allow_internal_applications: boolean | null
          require_cover_letter: boolean | null
          custom_questions: Json | null
          views_count: number | null
          applications_count: number | null
          created_by: string | null
          hiring_manager_id: string | null
          nationality_preference: Json | null
          saudization_applicable: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          department_id?: string | null
          location_id?: string | null
          title: string
          title_ar?: string | null
          slug: string
          description?: string | null
          description_ar?: string | null
          requirements?: string | null
          requirements_ar?: string | null
          responsibilities?: string | null
          responsibilities_ar?: string | null
          benefits?: string | null
          benefits_ar?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          experience_level?: Database["public"]["Enums"]["experience_level"]
          status?: Database["public"]["Enums"]["job_status"]
          is_remote?: boolean | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          show_salary?: boolean | null
          education_requirement?: string | null
          years_experience_min?: number | null
          years_experience_max?: number | null
          skills?: Json | null
          languages?: Json | null
          published_at?: string | null
          closing_date?: string | null
          positions_count?: number | null
          is_featured?: boolean | null
          allow_internal_applications?: boolean | null
          require_cover_letter?: boolean | null
          custom_questions?: Json | null
          views_count?: number | null
          applications_count?: number | null
          created_by?: string | null
          hiring_manager_id?: string | null
          nationality_preference?: Json | null
          saudization_applicable?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          department_id?: string | null
          location_id?: string | null
          title?: string
          title_ar?: string | null
          slug?: string
          description?: string | null
          description_ar?: string | null
          requirements?: string | null
          requirements_ar?: string | null
          responsibilities?: string | null
          responsibilities_ar?: string | null
          benefits?: string | null
          benefits_ar?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          experience_level?: Database["public"]["Enums"]["experience_level"]
          status?: Database["public"]["Enums"]["job_status"]
          is_remote?: boolean | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          show_salary?: boolean | null
          education_requirement?: string | null
          years_experience_min?: number | null
          years_experience_max?: number | null
          skills?: Json | null
          languages?: Json | null
          published_at?: string | null
          closing_date?: string | null
          positions_count?: number | null
          is_featured?: boolean | null
          allow_internal_applications?: boolean | null
          require_cover_letter?: boolean | null
          custom_questions?: Json | null
          views_count?: number | null
          applications_count?: number | null
          created_by?: string | null
          hiring_manager_id?: string | null
          nationality_preference?: Json | null
          saudization_applicable?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          id: string
          org_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          phone_secondary: string | null
          headline: string | null
          summary: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          nationality: string | null
          current_company: string | null
          current_title: string | null
          years_of_experience: number | null
          expected_salary: number | null
          salary_currency: string | null
          notice_period_days: number | null
          skills: Json | null
          languages: Json | null
          education: Json | null
          experience: Json | null
          certifications: Json | null
          resume_url: string | null
          resume_parsed_data: Json | null
          linkedin_url: string | null
          portfolio_url: string | null
          source: Database["public"]["Enums"]["candidate_source"] | null
          source_details: string | null
          referred_by: string | null
          tags: Json | null
          ai_overall_score: number | null
          ai_score_breakdown: Json | null
          ai_parsed_at: string | null
          is_blacklisted: boolean | null
          blacklist_reason: string | null
          consent_given: boolean | null
          consent_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          phone_secondary?: string | null
          headline?: string | null
          summary?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          nationality?: string | null
          current_company?: string | null
          current_title?: string | null
          years_of_experience?: number | null
          expected_salary?: number | null
          salary_currency?: string | null
          notice_period_days?: number | null
          skills?: Json | null
          languages?: Json | null
          education?: Json | null
          experience?: Json | null
          certifications?: Json | null
          resume_url?: string | null
          resume_parsed_data?: Json | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          source?: Database["public"]["Enums"]["candidate_source"] | null
          source_details?: string | null
          referred_by?: string | null
          tags?: Json | null
          ai_overall_score?: number | null
          ai_score_breakdown?: Json | null
          ai_parsed_at?: string | null
          is_blacklisted?: boolean | null
          blacklist_reason?: string | null
          consent_given?: boolean | null
          consent_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          phone_secondary?: string | null
          headline?: string | null
          summary?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          nationality?: string | null
          current_company?: string | null
          current_title?: string | null
          years_of_experience?: number | null
          expected_salary?: number | null
          salary_currency?: string | null
          notice_period_days?: number | null
          skills?: Json | null
          languages?: Json | null
          education?: Json | null
          experience?: Json | null
          certifications?: Json | null
          resume_url?: string | null
          resume_parsed_data?: Json | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          source?: Database["public"]["Enums"]["candidate_source"] | null
          source_details?: string | null
          referred_by?: string | null
          tags?: Json | null
          ai_overall_score?: number | null
          ai_score_breakdown?: Json | null
          ai_parsed_at?: string | null
          is_blacklisted?: boolean | null
          blacklist_reason?: string | null
          consent_given?: boolean | null
          consent_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          org_id: string
          job_id: string
          candidate_id: string
          status: Database["public"]["Enums"]["application_status"]
          stage_id: string | null
          cover_letter: string | null
          custom_answers: Json | null
          ai_match_score: number | null
          ai_score_details: Json | null
          manual_score: number | null
          scored_by: string | null
          source: Database["public"]["Enums"]["candidate_source"] | null
          source_details: string | null
          applied_at: string | null
          last_activity_at: string | null
          moved_to_stage_at: string | null
          rejection_reason: string | null
          rejection_template_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          hired_at: string | null
          hire_salary: number | null
          start_date: string | null
          assigned_to: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          job_id: string
          candidate_id: string
          status?: Database["public"]["Enums"]["application_status"]
          stage_id?: string | null
          cover_letter?: string | null
          custom_answers?: Json | null
          ai_match_score?: number | null
          ai_score_details?: Json | null
          manual_score?: number | null
          scored_by?: string | null
          source?: Database["public"]["Enums"]["candidate_source"] | null
          source_details?: string | null
          applied_at?: string | null
          last_activity_at?: string | null
          moved_to_stage_at?: string | null
          rejection_reason?: string | null
          rejection_template_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          hired_at?: string | null
          hire_salary?: number | null
          start_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          job_id?: string
          candidate_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          stage_id?: string | null
          cover_letter?: string | null
          custom_answers?: Json | null
          ai_match_score?: number | null
          ai_score_details?: Json | null
          manual_score?: number | null
          scored_by?: string | null
          source?: Database["public"]["Enums"]["candidate_source"] | null
          source_details?: string | null
          applied_at?: string | null
          last_activity_at?: string | null
          moved_to_stage_at?: string | null
          rejection_reason?: string | null
          rejection_template_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          hired_at?: string | null
          hire_salary?: number | null
          start_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          id: string
          org_id: string
          application_id: string
          title: string
          interview_type: string
          scheduled_at: string
          duration_minutes: number
          timezone: string | null
          location: string | null
          meeting_link: string | null
          meeting_password: string | null
          interviewer_ids: Json | null
          organizer_id: string | null
          status: string | null
          candidate_confirmed: boolean | null
          candidate_confirmed_at: string | null
          overall_rating: number | null
          feedback: Json | null
          recommendation: string | null
          internal_notes: string | null
          candidate_notes: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          application_id: string
          title: string
          interview_type?: string
          scheduled_at: string
          duration_minutes?: number
          timezone?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_password?: string | null
          interviewer_ids?: Json | null
          organizer_id?: string | null
          status?: string | null
          candidate_confirmed?: boolean | null
          candidate_confirmed_at?: string | null
          overall_rating?: number | null
          feedback?: Json | null
          recommendation?: string | null
          internal_notes?: string | null
          candidate_notes?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          application_id?: string
          title?: string
          interview_type?: string
          scheduled_at?: string
          duration_minutes?: number
          timezone?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_password?: string | null
          interviewer_ids?: Json | null
          organizer_id?: string | null
          status?: string | null
          candidate_confirmed?: boolean | null
          candidate_confirmed_at?: string | null
          overall_rating?: number | null
          feedback?: Json | null
          recommendation?: string | null
          internal_notes?: string | null
          candidate_notes?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          org_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          org_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          category: string | null
          is_public: boolean | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          category?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          category?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          org_id: string | null
          name: string
          slug: string
          subject: string
          subject_ar: string | null
          body_html: string
          body_html_ar: string | null
          body_text: string | null
          body_text_ar: string | null
          variables: Json | null
          category: string | null
          is_system: boolean | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id?: string | null
          name: string
          slug: string
          subject: string
          subject_ar?: string | null
          body_html: string
          body_html_ar?: string | null
          body_text?: string | null
          body_text_ar?: string | null
          variables?: Json | null
          category?: string | null
          is_system?: boolean | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          name?: string
          slug?: string
          subject?: string
          subject_ar?: string | null
          body_html?: string
          body_html_ar?: string | null
          body_text?: string | null
          body_text_ar?: string | null
          variables?: Json | null
          category?: string | null
          is_system?: boolean | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_analytics_snapshots: {
        Row: {
          id: string
          snapshot_date: string
          total_organizations: number | null
          active_organizations: number | null
          trial_organizations: number | null
          total_users: number | null
          total_jobs: number | null
          total_candidates: number | null
          total_applications: number | null
          mrr: number | null
          arr: number | null
          new_organizations: number | null
          churned_organizations: number | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          snapshot_date: string
          total_organizations?: number | null
          active_organizations?: number | null
          trial_organizations?: number | null
          total_users?: number | null
          total_jobs?: number | null
          total_candidates?: number | null
          total_applications?: number | null
          mrr?: number | null
          arr?: number | null
          new_organizations?: number | null
          churned_organizations?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          snapshot_date?: string
          total_organizations?: number | null
          active_organizations?: number | null
          trial_organizations?: number | null
          total_users?: number | null
          total_jobs?: number | null
          total_candidates?: number | null
          total_applications?: number | null
          mrr?: number | null
          arr?: number | null
          new_organizations?: number | null
          churned_organizations?: number | null
          metadata?: Json | null
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
      job_status:
        | "draft"
        | "open"
        | "paused"
        | "closed"
        | "filled"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "temporary"
        | "internship"
        | "freelance"
      experience_level:
        | "entry"
        | "junior"
        | "mid"
        | "senior"
        | "lead"
        | "executive"
      application_status:
        | "new"
        | "screening"
        | "interview"
        | "assessment"
        | "offer"
        | "hired"
        | "rejected"
        | "withdrawn"
      candidate_source:
        | "career_page"
        | "linkedin"
        | "indeed"
        | "referral"
        | "agency"
        | "direct"
        | "other"
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
