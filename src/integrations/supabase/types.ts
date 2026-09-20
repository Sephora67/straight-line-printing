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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artwork_services: {
        Row: {
          description: string | null
          id: string
          is_active: boolean
          is_required: boolean
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      artworks: {
        Row: {
          created_at: string
          dpi: number | null
          file_size: number | null
          has_transparency: boolean | null
          height_px: number | null
          id: string
          mime_type: string | null
          original_filename: string
          preview_path: string | null
          status: string
          storage_path: string
          user_id: string | null
          warnings: Json
          width_px: number | null
        }
        Insert: {
          created_at?: string
          dpi?: number | null
          file_size?: number | null
          has_transparency?: boolean | null
          height_px?: number | null
          id?: string
          mime_type?: string | null
          original_filename: string
          preview_path?: string | null
          status?: string
          storage_path: string
          user_id?: string | null
          warnings?: Json
          width_px?: number | null
        }
        Update: {
          created_at?: string
          dpi?: number | null
          file_size?: number | null
          has_transparency?: boolean | null
          height_px?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string
          preview_path?: string | null
          status?: string
          storage_path?: string
          user_id?: string | null
          warnings?: Json
          width_px?: number | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          after_value: Json | null
          before_value: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      calibrations: {
        Row: {
          confirmed: boolean
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          physical_height_in: number | null
          physical_width_in: number | null
          pixels_per_inch: number | null
          product_id: string
          reference_label: string | null
          reference_type: Database["public"]["Enums"]["calibration_reference_type"]
          reference_x_pct: number
          reference_y_pct: number
          updated_at: string
          version: number
          view: Database["public"]["Enums"]["garment_view"]
        }
        Insert: {
          confirmed?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          physical_height_in?: number | null
          physical_width_in?: number | null
          pixels_per_inch?: number | null
          product_id: string
          reference_label?: string | null
          reference_type: Database["public"]["Enums"]["calibration_reference_type"]
          reference_x_pct: number
          reference_y_pct: number
          updated_at?: string
          version?: number
          view: Database["public"]["Enums"]["garment_view"]
        }
        Update: {
          confirmed?: boolean
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          physical_height_in?: number | null
          physical_width_in?: number | null
          pixels_per_inch?: number | null
          product_id?: string
          reference_label?: string | null
          reference_type?: Database["public"]["Enums"]["calibration_reference_type"]
          reference_x_pct?: number
          reference_y_pct?: number
          updated_at?: string
          version?: number
          view?: Database["public"]["Enums"]["garment_view"]
        }
        Relationships: [
          {
            foreignKeyName: "calibrations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          config_snapshot: Json
          created_at: string
          decoration_method_id: string | null
          design_id: string | null
          id: string
          line_total: number
          price_breakdown: Json
          product_id: string | null
          quantity: number
          quantity_matrix: Json
          unit_price: number
        }
        Insert: {
          cart_id: string
          config_snapshot?: Json
          created_at?: string
          decoration_method_id?: string | null
          design_id?: string | null
          id?: string
          line_total?: number
          price_breakdown?: Json
          product_id?: string | null
          quantity?: number
          quantity_matrix?: Json
          unit_price?: number
        }
        Update: {
          cart_id?: string
          config_snapshot?: Json
          created_at?: string
          decoration_method_id?: string | null
          design_id?: string | null
          id?: string
          line_total?: number
          price_breakdown?: Json
          product_id?: string | null
          quantity?: number
          quantity_matrix?: Json
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_token: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_token?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      decoration_methods: {
        Row: {
          code: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      design_placements: {
        Row: {
          artwork_id: string | null
          created_at: string
          design_id: string
          height_pct: number
          horizontal_offset_in: number | null
          id: string
          offset_from_reference_in: number | null
          physical_height_in: number | null
          physical_width_in: number | null
          placement_id: string | null
          print_area_id: string | null
          rotation: number
          view: Database["public"]["Enums"]["garment_view"]
          width_pct: number
          x_pct: number
          y_pct: number
        }
        Insert: {
          artwork_id?: string | null
          created_at?: string
          design_id: string
          height_pct?: number
          horizontal_offset_in?: number | null
          id?: string
          offset_from_reference_in?: number | null
          physical_height_in?: number | null
          physical_width_in?: number | null
          placement_id?: string | null
          print_area_id?: string | null
          rotation?: number
          view: Database["public"]["Enums"]["garment_view"]
          width_pct?: number
          x_pct?: number
          y_pct?: number
        }
        Update: {
          artwork_id?: string | null
          created_at?: string
          design_id?: string
          height_pct?: number
          horizontal_offset_in?: number | null
          id?: string
          offset_from_reference_in?: number | null
          physical_height_in?: number | null
          physical_width_in?: number | null
          placement_id?: string | null
          print_area_id?: string | null
          rotation?: number
          view?: Database["public"]["Enums"]["garment_view"]
          width_pct?: number
          x_pct?: number
          y_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_placements_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_placements_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_placements_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_placements_print_area_id_fkey"
            columns: ["print_area_id"]
            isOneToOne: false
            referencedRelation: "print_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      design_versions: {
        Row: {
          created_at: string
          created_by: string | null
          design_id: string
          id: string
          mockups: Json
          snapshot: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          design_id: string
          id?: string
          mockups?: Json
          snapshot?: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          design_id?: string
          id?: string
          mockups?: Json
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_versions_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
        ]
      }
      designs: {
        Row: {
          color_id: string | null
          config_snapshot: Json
          created_at: string
          decoration_method_id: string | null
          id: string
          is_saved: boolean
          name: string | null
          product_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color_id?: string | null
          config_snapshot?: Json
          created_at?: string
          decoration_method_id?: string | null
          id?: string
          is_saved?: boolean
          name?: string | null
          product_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color_id?: string | null
          config_snapshot?: Json
          created_at?: string
          decoration_method_id?: string | null
          id?: string
          is_saved?: boolean
          name?: string | null
          product_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designs_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_invitations_accepted_user_id_fkey"
            columns: ["accepted_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gang_sheet_sizes: {
        Row: {
          height_in: number
          id: string
          is_active: boolean
          margin_in: number
          name: string
          price: number
          spacing_in: number
          width_in: number
        }
        Insert: {
          height_in: number
          id?: string
          is_active?: boolean
          margin_in?: number
          name: string
          price?: number
          spacing_in?: number
          width_in: number
        }
        Update: {
          height_in?: number
          id?: string
          is_active?: boolean
          margin_in?: number
          name?: string
          price?: number
          spacing_in?: number
          width_in?: number
        }
        Relationships: []
      }
      garment_assets: {
        Row: {
          color_check_notes: string | null
          color_check_status: string
          color_id: string
          created_at: string
          dominant_hex: string | null
          id: string
          image_height: number | null
          image_width: number | null
          product_id: string
          storage_path: string
          updated_at: string
          view: Database["public"]["Enums"]["garment_view"]
        }
        Insert: {
          color_check_notes?: string | null
          color_check_status?: string
          color_id: string
          created_at?: string
          dominant_hex?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          product_id: string
          storage_path: string
          updated_at?: string
          view: Database["public"]["Enums"]["garment_view"]
        }
        Update: {
          color_check_notes?: string | null
          color_check_status?: string
          color_id?: string
          created_at?: string
          dominant_hex?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          product_id?: string
          storage_path?: string
          updated_at?: string
          view?: Database["public"]["Enums"]["garment_view"]
        }
        Relationships: [
          {
            foreignKeyName: "garment_assets_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garment_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          admin_email: string | null
          contact_enabled: boolean
          id: string
          internal_notifications_enabled: boolean
          order_confirmation_enabled: boolean
          order_status_enabled: boolean
          production_status_enabled: boolean
          quote_enabled: boolean
          reply_to_email: string | null
          sender_name: string
          shipping_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_email?: string | null
          contact_enabled?: boolean
          id?: string
          internal_notifications_enabled?: boolean
          order_confirmation_enabled?: boolean
          order_status_enabled?: boolean
          production_status_enabled?: boolean
          quote_enabled?: boolean
          reply_to_email?: string | null
          sender_name?: string
          shipping_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_email?: string | null
          contact_enabled?: boolean
          id?: string
          internal_notifications_enabled?: boolean
          order_confirmation_enabled?: boolean
          order_status_enabled?: boolean
          production_status_enabled?: boolean
          quote_enabled?: boolean
          reply_to_email?: string | null
          sender_name?: string
          shipping_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          audience: string
          available_variables: string[]
          body: string
          category: string
          code: string
          default_body: string
          default_subject: string
          default_title: string
          id: string
          is_active: boolean
          name: string
          subject: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience?: string
          available_variables?: string[]
          body: string
          category?: string
          code: string
          default_body?: string
          default_subject?: string
          default_title?: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: string
          available_variables?: string[]
          body?: string
          category?: string
          code?: string
          default_body?: string
          default_subject?: string
          default_title?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          decoration_method_id: string | null
          description: string | null
          design_id: string | null
          frozen_config: Json
          id: string
          line_total: number
          order_id: string
          price_breakdown: Json
          product_id: string | null
          quantity: number
          quantity_matrix: Json
          unit_price: number
        }
        Insert: {
          created_at?: string
          decoration_method_id?: string | null
          description?: string | null
          design_id?: string | null
          frozen_config?: Json
          id?: string
          line_total?: number
          order_id: string
          price_breakdown?: Json
          product_id?: string | null
          quantity?: number
          quantity_matrix?: Json
          unit_price?: number
        }
        Update: {
          created_at?: string
          decoration_method_id?: string | null
          description?: string | null
          design_id?: string | null
          frozen_config?: Json
          id?: string
          line_total?: number
          order_id?: string
          price_breakdown?: Json
          product_id?: string | null
          quantity?: number
          quantity_matrix?: Json
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_to: string | null
          billing_address: Json
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          discount: number
          due_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_reference: string | null
          payment_status: string
          priority: string
          production_approved_at: string | null
          production_approved_by: string | null
          production_decision: string
          quote_id: string | null
          request_type: string
          shipment_status: string | null
          shipping: number
          shipping_address: Json
          shipping_method_id: string | null
          staff_notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          billing_address?: Json
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_reference?: string | null
          payment_status?: string
          priority?: string
          production_approved_at?: string | null
          production_approved_by?: string | null
          production_decision?: string
          quote_id?: string | null
          request_type?: string
          shipment_status?: string | null
          shipping?: number
          shipping_address?: Json
          shipping_method_id?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          billing_address?: Json
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_reference?: string | null
          payment_status?: string
          priority?: string
          production_approved_at?: string | null
          production_approved_by?: string | null
          production_decision?: string
          quote_id?: string | null
          request_type?: string
          shipment_status?: string | null
          shipping?: number
          shipping_address?: Json
          shipping_method_id?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_production_approved_by_fkey"
            columns: ["production_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          area: string
          code: string
          description: string
          id: string
          name: string
        }
        Insert: {
          area: string
          code: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          area?: string
          code?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      placements: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          view: Database["public"]["Enums"]["garment_view"] | null
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          view?: Database["public"]["Enums"]["garment_view"] | null
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          view?: Database["public"]["Enums"]["garment_view"] | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          config: Json
          created_at: string
          decoration_method_id: string | null
          id: string
          is_active: boolean
          name: string
          product_id: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          decoration_method_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_id?: string | null
          scope?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          decoration_method_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          id: string
          max_quantity: number | null
          min_quantity: number
          per_1000_stitches_price: number
          per_color_price: number
          per_location_price: number
          pricing_rule_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          id?: string
          max_quantity?: number | null
          min_quantity: number
          per_1000_stitches_price?: number
          per_color_price?: number
          per_location_price?: number
          pricing_rule_id: string
          sort_order?: number
          unit_price?: number
        }
        Update: {
          id?: string
          max_quantity?: number | null
          min_quantity?: number
          per_1000_stitches_price?: number
          per_color_price?: number
          per_location_price?: number
          pricing_rule_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_pricing_rule_id_fkey"
            columns: ["pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "pricing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      print_area_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          print_area_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          print_area_id: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          print_area_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "print_area_revisions_print_area_id_fkey"
            columns: ["print_area_id"]
            isOneToOne: false
            referencedRelation: "print_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      print_areas: {
        Row: {
          created_at: string
          height_pct: number
          id: string
          is_active: boolean
          name: string
          physical_height_in: number | null
          physical_width_in: number | null
          product_id: string
          updated_at: string
          version: number
          view: Database["public"]["Enums"]["garment_view"]
          width_pct: number
          x_pct: number
          y_pct: number
        }
        Insert: {
          created_at?: string
          height_pct: number
          id?: string
          is_active?: boolean
          name?: string
          physical_height_in?: number | null
          physical_width_in?: number | null
          product_id: string
          updated_at?: string
          version?: number
          view: Database["public"]["Enums"]["garment_view"]
          width_pct: number
          x_pct: number
          y_pct: number
        }
        Update: {
          created_at?: string
          height_pct?: number
          id?: string
          is_active?: boolean
          name?: string
          physical_height_in?: number | null
          physical_width_in?: number | null
          product_id?: string
          updated_at?: string
          version?: number
          view?: Database["public"]["Enums"]["garment_view"]
          width_pct?: number
          x_pct?: number
          y_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "print_areas_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_colors: {
        Row: {
          created_at: string
          hex: string | null
          id: string
          is_active: boolean
          name: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          hex?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          hex?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_decoration_methods: {
        Row: {
          decoration_method_id: string
          id: string
          is_enabled: boolean
          product_id: string
        }
        Insert: {
          decoration_method_id: string
          id?: string
          is_enabled?: boolean
          product_id: string
        }
        Update: {
          decoration_method_id?: string
          id?: string
          is_enabled?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_decoration_methods_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_decoration_methods_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_placements: {
        Row: {
          decoration_method_id: string | null
          id: string
          is_enabled: boolean
          placement_id: string
          print_area_id: string | null
          product_id: string
        }
        Insert: {
          decoration_method_id?: string | null
          id?: string
          is_enabled?: boolean
          placement_id: string
          print_area_id?: string | null
          product_id: string
        }
        Update: {
          decoration_method_id?: string | null
          id?: string
          is_enabled?: boolean
          placement_id?: string
          print_area_id?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_placements_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_placements_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_placements_print_area_id_fkey"
            columns: ["print_area_id"]
            isOneToOne: false
            referencedRelation: "print_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_placements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          id: string
          is_active: boolean
          label: string
          price_adjustment: number
          product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          label: string
          price_adjustment?: number
          product_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          label?: string
          price_adjustment?: number
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_id: string
          created_at: string
          id: string
          is_active: boolean
          low_stock_threshold: number
          price: number | null
          product_id: string
          quantity_available: number
          quantity_reserved: number
          quantity_sold: number
          size_id: string
          sku: string | null
          supplier_sku: string | null
          updated_at: string
          wholesale_cost: number | null
        }
        Insert: {
          color_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          price?: number | null
          product_id: string
          quantity_available?: number
          quantity_reserved?: number
          quantity_sold?: number
          size_id: string
          sku?: string | null
          supplier_sku?: string | null
          updated_at?: string
          wholesale_cost?: number | null
        }
        Update: {
          color_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          price?: number | null
          product_id?: string
          quantity_available?: number
          quantity_reserved?: number
          quantity_sold?: number
          size_id?: string
          sku?: string | null
          supplier_sku?: string | null
          updated_at?: string
          wholesale_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      production_files: {
        Row: {
          created_at: string
          created_by: string | null
          external_url: string | null
          id: string
          is_approved: boolean
          kind: string
          label: string | null
          metadata: Json
          production_job_id: string
          storage_path: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          is_approved?: boolean
          kind: string
          label?: string | null
          metadata?: Json
          production_job_id: string
          storage_path?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          is_approved?: boolean
          kind?: string
          label?: string | null
          metadata?: Json
          production_job_id?: string
          storage_path?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_files_production_job_id_fkey"
            columns: ["production_job_id"]
            isOneToOne: false
            referencedRelation: "production_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      production_jobs: {
        Row: {
          approved_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          decoration_method_id: string | null
          design_version_id: string | null
          due_date: string | null
          id: string
          is_production_ready: boolean
          job_number: string
          locked_at: string | null
          notes: string | null
          order_id: string
          order_item_id: string | null
          priority: string
          production_data: Json
          proof_id: string | null
          readiness: Json
          snapshot: Json
          source_key: string
          source_proof_id: string | null
          source_type: string
          source_version: number
          stage: Database["public"]["Enums"]["production_stage"]
          started_at: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          decoration_method_id?: string | null
          design_version_id?: string | null
          due_date?: string | null
          id?: string
          is_production_ready?: boolean
          job_number: string
          locked_at?: string | null
          notes?: string | null
          order_id: string
          order_item_id?: string | null
          priority?: string
          production_data?: Json
          proof_id?: string | null
          readiness?: Json
          snapshot?: Json
          source_key: string
          source_proof_id?: string | null
          source_type?: string
          source_version?: number
          stage?: Database["public"]["Enums"]["production_stage"]
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          decoration_method_id?: string | null
          design_version_id?: string | null
          due_date?: string | null
          id?: string
          is_production_ready?: boolean
          job_number?: string
          locked_at?: string | null
          notes?: string | null
          order_id?: string
          order_item_id?: string | null
          priority?: string
          production_data?: Json
          proof_id?: string | null
          readiness?: Json
          snapshot?: Json
          source_key?: string
          source_proof_id?: string | null
          source_type?: string
          source_version?: number
          stage?: Database["public"]["Enums"]["production_stage"]
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_jobs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_design_version_id_fkey"
            columns: ["design_version_id"]
            isOneToOne: false
            referencedRelation: "design_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_source_proof_id_fkey"
            columns: ["source_proof_id"]
            isOneToOne: false
            referencedRelation: "proofs"
            referencedColumns: ["id"]
          },
        ]
      }
      production_overrides: {
        Row: {
          calculated_value: string | null
          created_at: string
          created_by: string | null
          field_key: string
          id: string
          override_value: string
          production_job_id: string
          reason: string | null
        }
        Insert: {
          calculated_value?: string | null
          created_at?: string
          created_by?: string | null
          field_key: string
          id?: string
          override_value: string
          production_job_id: string
          reason?: string | null
        }
        Update: {
          calculated_value?: string | null
          created_at?: string
          created_by?: string | null
          field_key?: string
          id?: string
          override_value?: string
          production_job_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_overrides_production_job_id_fkey"
            columns: ["production_job_id"]
            isOneToOne: false
            referencedRelation: "production_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand: string | null
          bulk_enabled: boolean
          category_id: string | null
          config_version: number
          created_at: string
          description: string | null
          fabric: string | null
          fit: string | null
          garment_type: string | null
          gender: string | null
          id: string
          manufacturer: string | null
          name: string
          pod_enabled: boolean
          sku: string | null
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["product_status"]
          supplier_id: string | null
          supplier_sku: string | null
          updated_at: string
          weight: string | null
          wholesale_cost: number | null
        }
        Insert: {
          base_price?: number
          brand?: string | null
          bulk_enabled?: boolean
          category_id?: string | null
          config_version?: number
          created_at?: string
          description?: string | null
          fabric?: string | null
          fit?: string | null
          garment_type?: string | null
          gender?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          pod_enabled?: boolean
          sku?: string | null
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id?: string | null
          supplier_sku?: string | null
          updated_at?: string
          weight?: string | null
          wholesale_cost?: number | null
        }
        Update: {
          base_price?: number
          brand?: string | null
          bulk_enabled?: boolean
          category_id?: string | null
          config_version?: number
          created_at?: string
          description?: string | null
          fabric?: string | null
          fit?: string | null
          garment_type?: string | null
          gender?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          pod_enabled?: boolean
          sku?: string | null
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id?: string | null
          supplier_sku?: string | null
          updated_at?: string
          weight?: string | null
          wholesale_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          employee_status: string
          full_name: string | null
          id: string
          last_login_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          employee_status?: string
          full_name?: string | null
          id: string
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          employee_status?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proofs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          customer_note: string | null
          frozen_config: Json
          id: string
          order_id: string | null
          order_item_id: string | null
          proof_image_path: string | null
          quote_id: string | null
          staff_note: string | null
          status: Database["public"]["Enums"]["proof_status"]
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_note?: string | null
          frozen_config?: Json
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          proof_image_path?: string | null
          quote_id?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_note?: string | null
          frozen_config?: Json
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          proof_image_path?: string | null
          quote_id?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_records: {
        Row: {
          checked_by: string | null
          color_check: string | null
          created_at: string
          defects: string | null
          id: string
          notes: string | null
          photo_paths: string[]
          placement_check: string | null
          print_quality: string | null
          production_job_id: string
          quantity_checked: number | null
          reprint_required: boolean
          result: Database["public"]["Enums"]["qc_result"]
          size_count: Json
        }
        Insert: {
          checked_by?: string | null
          color_check?: string | null
          created_at?: string
          defects?: string | null
          id?: string
          notes?: string | null
          photo_paths?: string[]
          placement_check?: string | null
          print_quality?: string | null
          production_job_id: string
          quantity_checked?: number | null
          reprint_required?: boolean
          result: Database["public"]["Enums"]["qc_result"]
          size_count?: Json
        }
        Update: {
          checked_by?: string | null
          color_check?: string | null
          created_at?: string
          defects?: string | null
          id?: string
          notes?: string | null
          photo_paths?: string[]
          placement_check?: string | null
          print_quality?: string | null
          production_job_id?: string
          quantity_checked?: number | null
          reprint_required?: boolean
          result?: Database["public"]["Enums"]["qc_result"]
          size_count?: Json
        }
        Relationships: [
          {
            foreignKeyName: "qc_records_production_job_id_fkey"
            columns: ["production_job_id"]
            isOneToOne: false
            referencedRelation: "production_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_customer_visible: boolean
          message: string | null
          metadata: Json
          quote_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_customer_visible?: boolean
          message?: string | null
          metadata?: Json
          quote_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_customer_visible?: boolean
          message?: string | null
          metadata?: Json
          quote_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          config_snapshot: Json
          created_at: string
          decoration_method_id: string | null
          description: string | null
          design_id: string | null
          id: string
          line_total: number
          price_breakdown: Json
          product_id: string | null
          quantity: number
          quantity_matrix: Json
          quote_id: string
          unit_price: number
        }
        Insert: {
          config_snapshot?: Json
          created_at?: string
          decoration_method_id?: string | null
          description?: string | null
          design_id?: string | null
          id?: string
          line_total?: number
          price_breakdown?: Json
          product_id?: string | null
          quantity?: number
          quantity_matrix?: Json
          quote_id: string
          unit_price?: number
        }
        Update: {
          config_snapshot?: Json
          created_at?: string
          decoration_method_id?: string | null
          description?: string | null
          design_id?: string | null
          id?: string
          line_total?: number
          price_breakdown?: Json
          product_id?: string | null
          quantity?: number
          quantity_matrix?: Json
          quote_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          artwork_fee: number
          assigned_to: string | null
          company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deadline: string | null
          decoration_method_id: string | null
          discount: number
          due_date: string | null
          expires_at: string | null
          id: string
          notes: string | null
          priority: string
          quote_number: string
          request_type: string
          rush_fee: number
          shipping: number
          shipping_destination: string | null
          staff_notes: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          artwork_fee?: number
          assigned_to?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deadline?: string | null
          decoration_method_id?: string | null
          discount?: number
          due_date?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          quote_number: string
          request_type?: string
          rush_fee?: number
          shipping?: number
          shipping_destination?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          artwork_fee?: number
          assigned_to?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deadline?: string | null
          decoration_method_id?: string | null
          discount?: number
          due_date?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          quote_number?: string
          request_type?: string
          rush_fee?: number
          shipping?: number
          shipping_destination?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_decoration_method_id_fkey"
            columns: ["decoration_method_id"]
            isOneToOne: false
            referencedRelation: "decoration_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      request_messages: {
        Row: {
          attachments: Json
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          order_id: string | null
          production_job_id: string | null
          quote_id: string | null
        }
        Insert: {
          attachments?: Json
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          order_id?: string | null
          production_job_id?: string | null
          quote_id?: string | null
        }
        Update: {
          attachments?: Json
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          order_id?: string | null
          production_job_id?: string | null
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_production_job_id_fkey"
            columns: ["production_job_id"]
            isOneToOne: false
            referencedRelation: "production_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          base_rate: number
          code: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          per_unit_rate: number
          regions: string[]
        }
        Insert: {
          base_rate?: number
          code: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          per_unit_rate?: number
          regions?: string[]
        }
        Update: {
          base_rate?: number
          code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          per_unit_rate?: number
          regions?: string[]
        }
        Relationships: []
      }
      site_copy: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          page_slug: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          page_slug?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          page_slug?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      site_page_routes: {
        Row: {
          current_path: string
          is_published: boolean
          original_path: string
          updated_at: string
        }
        Insert: {
          current_path: string
          is_published?: boolean
          original_path: string
          updated_at?: string
        }
        Update: {
          current_path?: string
          is_published?: boolean
          original_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          created_at: string
          id: string
          is_protected: boolean
          is_published: boolean
          meta_description: string
          meta_title: string
          nav_label: string
          nav_order: number
          original_path: string
          page_kind: string
          path: string
          show_in_nav: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_protected?: boolean
          is_published?: boolean
          meta_description?: string
          meta_title: string
          nav_label: string
          nav_order?: number
          original_path: string
          page_kind?: string
          path: string
          show_in_nav?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_protected?: boolean
          is_published?: boolean
          meta_description?: string
          meta_title?: string
          nav_label?: string
          nav_order?: number
          original_path?: string
          page_kind?: string
          path?: string
          show_in_nav?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          page_slug: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_slug: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_slug?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_theme: {
        Row: {
          colors: Json
          font_body: string
          font_display: string
          id: string
          logo_text: string | null
          radius: string
          updated_at: string
        }
        Insert: {
          colors?: Json
          font_body?: string
          font_display?: string
          id?: string
          logo_text?: string | null
          radius?: string
          updated_at?: string
        }
        Update: {
          colors?: Json
          font_body?: string
          font_display?: string
          id?: string
          logo_text?: string | null
          radius?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          lead_time_days: number | null
          name: string
          notes: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          name: string
          notes?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          compound: boolean
          country: string
          id: string
          is_active: boolean
          name: string
          rate: number
          region: string | null
        }
        Insert: {
          compound?: boolean
          country: string
          id?: string
          is_active?: boolean
          name: string
          rate: number
          region?: string | null
        }
        Update: {
          compound?: boolean
          country?: string
          id?: string
          is_active?: boolean
          name?: string
          rate?: number
          region?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          granted: boolean
          permission_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          granted?: boolean
          permission_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          granted?: boolean
          permission_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_owner_for_user: { Args: { _user_id: string }; Returns: boolean }
      create_site_page: {
        Args: { _meta_description?: string; _path: string; _title: string }
        Returns: {
          created_at: string
          id: string
          is_protected: boolean
          is_published: boolean
          meta_description: string
          meta_title: string
          nav_label: string
          nav_order: number
          original_path: string
          page_kind: string
          path: string
          show_in_nav: boolean
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "site_pages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_permissions: { Args: never; Returns: string[] }
      current_user_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      delete_site_page: { Args: { _page_id: string }; Returns: undefined }
      rename_site_page: {
        Args: {
          _meta_description: string
          _meta_title: string
          _nav_label: string
          _page_id: string
          _path: string
          _title: string
        }
        Returns: {
          created_at: string
          id: string
          is_protected: boolean
          is_published: boolean
          meta_description: string
          meta_title: string
          nav_label: string
          nav_order: number
          original_path: string
          page_kind: string
          path: string
          show_in_nav: boolean
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "site_pages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "administrator"
        | "production"
        | "sales"
        | "designer"
        | "manager"
        | "customer_service"
      calibration_reference_type:
        | "collar"
        | "neckline"
        | "sleeve_top"
        | "sleeve_seam"
        | "cuff"
        | "custom"
      garment_view: "front" | "back" | "left_sleeve" | "right_sleeve"
      order_status:
        | "pending"
        | "paid"
        | "in_production"
        | "ready"
        | "shipped"
        | "completed"
        | "cancelled"
        | "refunded"
      product_status: "draft" | "published" | "archived"
      production_stage:
        | "new"
        | "artwork_review"
        | "awaiting_proof"
        | "proof_approved"
        | "pre_production"
        | "in_production"
        | "quality_control"
        | "ready"
        | "shipped"
        | "completed"
      proof_status: "draft" | "sent" | "approved" | "revision_requested"
      qc_result: "pass" | "fail"
      quote_status:
        | "new"
        | "reviewing"
        | "waiting_customer"
        | "artwork_required"
        | "pricing"
        | "quote_sent"
        | "customer_reviewing"
        | "approved"
        | "declined"
        | "expired"
        | "converted"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "owner",
        "administrator",
        "production",
        "sales",
        "designer",
        "manager",
        "customer_service",
      ],
      calibration_reference_type: [
        "collar",
        "neckline",
        "sleeve_top",
        "sleeve_seam",
        "cuff",
        "custom",
      ],
      garment_view: ["front", "back", "left_sleeve", "right_sleeve"],
      order_status: [
        "pending",
        "paid",
        "in_production",
        "ready",
        "shipped",
        "completed",
        "cancelled",
        "refunded",
      ],
      product_status: ["draft", "published", "archived"],
      production_stage: [
        "new",
        "artwork_review",
        "awaiting_proof",
        "proof_approved",
        "pre_production",
        "in_production",
        "quality_control",
        "ready",
        "shipped",
        "completed",
      ],
      proof_status: ["draft", "sent", "approved", "revision_requested"],
      qc_result: ["pass", "fail"],
      quote_status: [
        "new",
        "reviewing",
        "waiting_customer",
        "artwork_required",
        "pricing",
        "quote_sent",
        "customer_reviewing",
        "approved",
        "declined",
        "expired",
        "converted",
        "cancelled",
      ],
    },
  },
} as const
