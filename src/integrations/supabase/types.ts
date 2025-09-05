export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_feedback: {
        Row: {
          admin_id: string
          created_at: string
          description: string
          feedback_type: string
          id: string
          page_name: string
          priority: string
          screenshot_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description: string
          feedback_type?: string
          id?: string
          page_name: string
          priority?: string
          screenshot_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string
          feedback_type?: string
          id?: string
          page_name?: string
          priority?: string
          screenshot_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_times: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string
          end_time: string
          id: string
          is_recurring: boolean | null
          reason: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id: string
          end_time: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_reservations: {
        Row: {
          appointment_date: string
          client_id: string
          combo_id: string
          created_at: string
          created_by_admin: string | null
          customer_email: string | null
          customer_name: string | null
          end_time: string
          final_price_cents: number
          id: string
          is_guest_booking: boolean
          notes: string | null
          original_price_cents: number
          primary_employee_id: string
          savings_cents: number
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          client_id: string
          combo_id: string
          created_at?: string
          created_by_admin?: string | null
          customer_email?: string | null
          customer_name?: string | null
          end_time: string
          final_price_cents: number
          id?: string
          is_guest_booking?: boolean
          notes?: string | null
          original_price_cents: number
          primary_employee_id: string
          savings_cents?: number
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          client_id?: string
          combo_id?: string
          created_at?: string
          created_by_admin?: string | null
          customer_email?: string | null
          customer_name?: string | null
          end_time?: string
          final_price_cents?: number
          id?: string
          is_guest_booking?: boolean
          notes?: string | null
          original_price_cents?: number
          primary_employee_id?: string
          savings_cents?: number
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_reservations_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_reservations_primary_employee_id_fkey"
            columns: ["primary_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_service_assignments: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          assigned_employee_id: string | null
          combo_reservation_id: string
          created_at: string
          estimated_duration: number
          estimated_start_time: string | null
          id: string
          notes: string | null
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assigned_employee_id?: string | null
          combo_reservation_id: string
          created_at?: string
          estimated_duration: number
          estimated_start_time?: string | null
          id?: string
          notes?: string | null
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          assigned_employee_id?: string | null
          combo_reservation_id?: string
          created_at?: string
          estimated_duration?: number
          estimated_start_time?: string | null
          id?: string
          notes?: string | null
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_service_assignments_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_service_assignments_combo_reservation_id_fkey"
            columns: ["combo_reservation_id"]
            isOneToOne: false
            referencedRelation: "combo_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_service_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_services: {
        Row: {
          combo_id: string
          created_at: string
          id: string
          quantity: number
          service_id: string
        }
        Insert: {
          combo_id: string
          created_at?: string
          id?: string
          quantity?: number
          service_id: string
        }
        Update: {
          combo_id?: string
          created_at?: string
          id?: string
          quantity?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_services_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      combos: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          original_price_cents: number
          primary_employee_id: string | null
          start_date: string
          total_price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          original_price_cents: number
          primary_employee_id?: string | null
          start_date: string
          total_price_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          original_price_cents?: number
          primary_employee_id?: string | null
          start_date?: string
          total_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "combos_primary_employee_id_fkey"
            columns: ["primary_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      costs: {
        Row: {
          amount_cents: number
          cost_category: Database["public"]["Enums"]["cost_category"]
          cost_category_id: string
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at: string
          created_by: string
          date_incurred: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          next_due_date: string | null
          recurring_frequency: number | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          cost_category: Database["public"]["Enums"]["cost_category"]
          cost_category_id: string
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          created_by: string
          date_incurred: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          next_due_date?: string | null
          recurring_frequency?: number | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          cost_category?: Database["public"]["Enums"]["cost_category"]
          cost_category_id?: string
          cost_type?: Database["public"]["Enums"]["cost_type"]
          created_at?: string
          created_by?: string
          date_incurred?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          next_due_date?: string | null
          recurring_frequency?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "costs_cost_category_id_fkey"
            columns: ["cost_category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_loyalty_progress: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          qr_code_token: string
          total_visits: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          qr_code_token?: string
          total_visits?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          qr_code_token?: string
          total_visits?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_progress_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          discount_code: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_date: string
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          service_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          discount_code?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          service_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          discount_code?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          service_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_discounts_service_id"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_services: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_services_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invited_users: {
        Row: {
          account_status: string
          claimed_at: string | null
          claimed_by: string | null
          email: string
          expires_at: string | null
          full_name: string
          id: string
          invite_token: string | null
          invited_at: string
          invited_by: string | null
          is_guest_user: boolean | null
          last_booking_date: string | null
          notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          account_status?: string
          claimed_at?: string | null
          claimed_by?: string | null
          email: string
          expires_at?: string | null
          full_name: string
          id?: string
          invite_token?: string | null
          invited_at?: string
          invited_by?: string | null
          is_guest_user?: boolean | null
          last_booking_date?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          account_status?: string
          claimed_at?: string | null
          claimed_by?: string | null
          email?: string
          expires_at?: string | null
          full_name?: string
          id?: string
          invite_token?: string | null
          invited_at?: string
          invited_by?: string | null
          is_guest_user?: boolean | null
          last_booking_date?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      loyalty_program_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          program_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          program_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          program_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_program_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_reward_redemptions: {
        Row: {
          customer_id: string
          id: string
          notes: string | null
          redeemed_at: string
          redeemed_by_admin_id: string
          reward_tier_id: string
          visits_used: number
        }
        Insert: {
          customer_id: string
          id?: string
          notes?: string | null
          redeemed_at?: string
          redeemed_by_admin_id: string
          reward_tier_id: string
          visits_used: number
        }
        Update: {
          customer_id?: string
          id?: string
          notes?: string | null
          redeemed_at?: string
          redeemed_by_admin_id?: string
          reward_tier_id?: string
          visits_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_reward_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_reward_redemptions_redeemed_by_admin_id_fkey"
            columns: ["redeemed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_reward_redemptions_reward_tier_id_fkey"
            columns: ["reward_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_reward_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_reward_tiers: {
        Row: {
          created_at: string
          discount_percentage: number | null
          display_order: number | null
          id: string
          is_active: boolean
          is_free_service: boolean | null
          reward_description: string | null
          reward_title: string
          updated_at: string
          visits_required: number
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_free_service?: boolean | null
          reward_description?: string | null
          reward_title: string
          updated_at?: string
          visits_required: number
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_free_service?: boolean | null
          reward_description?: string | null
          reward_title?: string
          updated_at?: string
          visits_required?: number
        }
        Relationships: []
      }
      loyalty_visits: {
        Row: {
          added_by_admin_id: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          visit_date: string
        }
        Insert: {
          added_by_admin_id: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          visit_date?: string
        }
        Update: {
          added_by_admin_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_visits_added_by_admin_id_fkey"
            columns: ["added_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          image_url: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          image_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          image_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          appointment_date: string
          client_id: string
          created_at: string | null
          created_by_admin: string | null
          customer_email: string | null
          customer_name: string | null
          employee_id: string | null
          end_time: string
          final_price_cents: number | null
          id: string
          is_guest_booking: boolean | null
          notes: string | null
          registration_token: string | null
          service_id: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          client_id: string
          created_at?: string | null
          created_by_admin?: string | null
          customer_email?: string | null
          customer_name?: string | null
          employee_id?: string | null
          end_time: string
          final_price_cents?: number | null
          id?: string
          is_guest_booking?: boolean | null
          notes?: string | null
          registration_token?: string | null
          service_id: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          client_id?: string
          created_at?: string | null
          created_by_admin?: string | null
          customer_email?: string | null
          customer_name?: string | null
          employee_id?: string | null
          end_time?: string
          final_price_cents?: number | null
          id?: string
          is_guest_booking?: boolean | null
          notes?: string | null
          registration_token?: string | null
          service_id?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_created_by_admin_fkey"
            columns: ["created_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_cents: number
          updated_at: string | null
          variable_price: boolean
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_cents: number
          updated_at?: string | null
          variable_price?: boolean
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_cents?: number
          updated_at?: string | null
          variable_price?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          business_address: string | null
          business_email: string | null
          business_hours: Json | null
          business_name: string | null
          business_phone: string | null
          google_maps_link: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          landing_background_url: string | null
          logo_url: string | null
          pwa_icon_url: string | null
          testimonials: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          google_maps_link?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          landing_background_url?: string | null
          logo_url?: string | null
          pwa_icon_url?: string | null
          testimonials?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          google_maps_link?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          landing_background_url?: string | null
          logo_url?: string | null
          pwa_icon_url?: string | null
          testimonials?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      time_logs: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          total_hours: number | null
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          total_hours?: number | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_reservations_view: {
        Row: {
          appointment_date: string | null
          booking_type: string | null
          category_name: string | null
          client_full_name: string | null
          client_id: string | null
          combo_id: string | null
          combo_name: string | null
          created_at: string | null
          created_by_admin: string | null
          customer_email: string | null
          customer_name: string | null
          employee_full_name: string | null
          employee_id: string | null
          end_time: string | null
          final_price_cents: number | null
          id: string | null
          is_guest_booking: boolean | null
          notes: string | null
          service_duration: number | null
          service_name: string | null
          service_price_cents: number | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      employee_calendar_view: {
        Row: {
          appointment_date: string | null
          booking_type: string | null
          client_id: string | null
          client_name: string | null
          combo_id: string | null
          combo_name: string | null
          duration_minutes: number | null
          employee_id: string | null
          employee_name: string | null
          end_time: string | null
          id: string | null
          iscombo: boolean | null
          notes: string | null
          service_name: string | null
          start_time: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_guest_reservation_access: {
        Args: { reservation_id: string; token: string }
        Returns: boolean
      }
      generate_loyalty_qr_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_registration_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      cost_category:
        | "inventory"
        | "utilities"
        | "rent"
        | "supplies"
        | "equipment"
        | "marketing"
        | "maintenance"
        | "other"
      cost_type: "fixed" | "variable" | "recurring" | "one_time"
      discount_type: "percentage" | "flat"
      user_role: "client" | "employee" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cost_category: [
        "inventory",
        "utilities",
        "rent",
        "supplies",
        "equipment",
        "marketing",
        "maintenance",
        "other",
      ],
      cost_type: ["fixed", "variable", "recurring", "one_time"],
      discount_type: ["percentage", "flat"],
      user_role: ["client", "employee", "admin"],
    },
  },
} as const
