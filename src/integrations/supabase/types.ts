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
      ai_recommendations: {
        Row: {
          created_at: string
          description: string
          id: string
          player_id: string
          priority: string
          recommendation_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          player_id: string
          priority: string
          recommendation_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          player_id?: string
          priority?: string
          recommendation_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_results: {
        Row: {
          control_score: number | null
          created_at: string
          exercise_id: string
          feedback: Json | null
          id: string
          overall_score: number | null
          speed_score: number | null
          technique_score: number | null
        }
        Insert: {
          control_score?: number | null
          created_at?: string
          exercise_id: string
          feedback?: Json | null
          id?: string
          overall_score?: number | null
          speed_score?: number | null
          technique_score?: number | null
        }
        Update: {
          control_score?: number | null
          created_at?: string
          exercise_id?: string
          feedback?: Json | null
          id?: string
          overall_score?: number | null
          speed_score?: number | null
          technique_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_results_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "training_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      player_analysis: {
        Row: {
          created_at: string
          defending_score: number | null
          dribbling_score: number | null
          id: string
          overall_score: number | null
          passing_score: number | null
          physicality_score: number | null
          player_id: string
          shooting_score: number | null
          speed_score: number | null
          training_tips: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          defending_score?: number | null
          dribbling_score?: number | null
          id?: string
          overall_score?: number | null
          passing_score?: number | null
          physicality_score?: number | null
          player_id: string
          shooting_score?: number | null
          speed_score?: number | null
          training_tips?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          defending_score?: number | null
          dribbling_score?: number | null
          id?: string
          overall_score?: number | null
          passing_score?: number | null
          physicality_score?: number | null
          player_id?: string
          shooting_score?: number | null
          speed_score?: number | null
          training_tips?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_analysis_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      player_registrations: {
        Row: {
          academy: string
          created_at: string
          date_of_birth: string
          email: string
          full_name: string
          height: number
          id: string
          nationality: string
          position: string
          updated_at: string
          video_url: string | null
          weight: number
        }
        Insert: {
          academy: string
          created_at?: string
          date_of_birth: string
          email: string
          full_name: string
          height: number
          id?: string
          nationality: string
          position: string
          updated_at?: string
          video_url?: string | null
          weight: number
        }
        Update: {
          academy?: string
          created_at?: string
          date_of_birth?: string
          email?: string
          full_name?: string
          height?: number
          id?: string
          nationality?: string
          position?: string
          updated_at?: string
          video_url?: string | null
          weight?: number
        }
        Relationships: []
      }
      training_exercises: {
        Row: {
          created_at: string
          difficulty: string
          exercise_type: string
          id: string
          player_id: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          difficulty: string
          exercise_type: string
          id?: string
          player_id: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string
          exercise_type?: string
          id?: string
          player_id?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_exercises_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          areas_for_improvement: Json | null
          average_score: number | null
          created_at: string
          exercises_completed: number | null
          id: string
          player_id: string
          progress_summary: string | null
          strengths: Json | null
          week_end: string
          week_start: string
        }
        Insert: {
          areas_for_improvement?: Json | null
          average_score?: number | null
          created_at?: string
          exercises_completed?: number | null
          id?: string
          player_id: string
          progress_summary?: string | null
          strengths?: Json | null
          week_end: string
          week_start: string
        }
        Update: {
          areas_for_improvement?: Json | null
          average_score?: number | null
          created_at?: string
          exercises_completed?: number | null
          id?: string
          player_id?: string
          progress_summary?: string | null
          strengths?: Json | null
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_registrations"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
