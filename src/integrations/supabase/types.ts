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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blood_requests: {
        Row: {
          allow_compatible_groups: boolean | null
          blood_group: Database["public"]["Enums"]["blood_group_type"]
          city: string
          compatible_requested_at: string | null
          created_at: string | null
          district: string
          hospital_name: string
          id: string
          illness_condition: string
          max_acceptors: number | null
          mobile_number: string
          patient_name: string
          requester_id: string
          state: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string | null
          urgency_level: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          allow_compatible_groups?: boolean | null
          blood_group: Database["public"]["Enums"]["blood_group_type"]
          city: string
          compatible_requested_at?: string | null
          created_at?: string | null
          district: string
          hospital_name: string
          id?: string
          illness_condition: string
          max_acceptors?: number | null
          mobile_number: string
          patient_name: string
          requester_id: string
          state: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          allow_compatible_groups?: boolean | null
          blood_group?: Database["public"]["Enums"]["blood_group_type"]
          city?: string
          compatible_requested_at?: string | null
          created_at?: string | null
          district?: string
          hospital_name?: string
          id?: string
          illness_condition?: string
          max_acceptors?: number | null
          mobile_number?: string
          patient_name?: string
          requester_id?: string
          state?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          urgency_level?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "blood_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_taken: boolean | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          request_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_taken?: boolean | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          request_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_taken?: boolean | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          request_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          blood_group: Database["public"]["Enums"]["blood_group_type"]
          city: string
          created_at: string | null
          district: string
          email: string
          id: string
          is_available: boolean | null
          last_donation_date: string | null
          name: string
          phone: string
          state: string
          updated_at: string | null
          willing_to_donate: boolean | null
        }
        Insert: {
          blood_group: Database["public"]["Enums"]["blood_group_type"]
          city: string
          created_at?: string | null
          district: string
          email: string
          id: string
          is_available?: boolean | null
          last_donation_date?: string | null
          name: string
          phone: string
          state: string
          updated_at?: string | null
          willing_to_donate?: boolean | null
        }
        Update: {
          blood_group?: Database["public"]["Enums"]["blood_group_type"]
          city?: string
          created_at?: string | null
          district?: string
          email?: string
          id?: string
          is_available?: boolean | null
          last_donation_date?: string | null
          name?: string
          phone?: string
          state?: string
          updated_at?: string | null
          willing_to_donate?: boolean | null
        }
        Relationships: []
      }
      request_acceptances: {
        Row: {
          accepted_at: string | null
          donor_id: string
          id: string
          request_id: string
          status: Database["public"]["Enums"]["acceptance_status"]
        }
        Insert: {
          accepted_at?: string | null
          donor_id: string
          id?: string
          request_id: string
          status?: Database["public"]["Enums"]["acceptance_status"]
        }
        Update: {
          accepted_at?: string | null
          donor_id?: string
          id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["acceptance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_acceptances_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_acceptances_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_compatible_blood_groups: {
        Args: {
          requested_group: Database["public"]["Enums"]["blood_group_type"]
        }
        Returns: Database["public"]["Enums"]["blood_group_type"][]
      }
      is_donor_eligible: {
        Args: { donor_profile: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: boolean
      }
    }
    Enums: {
      acceptance_status: "accepted" | "contacted" | "completed" | "cancelled"
      blood_group_type: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      notification_type:
        | "request_created"
        | "request_accepted"
        | "donor_accepted"
      request_status: "open" | "accepted" | "fulfilled" | "cancelled"
      urgency_level: "high" | "medium" | "low"
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
      acceptance_status: ["accepted", "contacted", "completed", "cancelled"],
      blood_group_type: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      notification_type: [
        "request_created",
        "request_accepted",
        "donor_accepted",
      ],
      request_status: ["open", "accepted", "fulfilled", "cancelled"],
      urgency_level: ["high", "medium", "low"],
    },
  },
} as const
