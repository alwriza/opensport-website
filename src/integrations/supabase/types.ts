export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          name: string | null
          role: string | null
          age: number | null
          position: string | null
          club: string | null
          height: number | null
          weight: number | null
          created_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          name?: string | null
          role?: string | null
          age?: number | null
          position?: string | null
          club?: string | null
          height?: number | null
          weight?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          name?: string | null
          role?: string | null
          age?: number | null
          position?: string | null
          club?: string | null
          height?: number | null
          weight?: number | null
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          storage_path: string
          filename: string
          duration: number | null
          file_size_mb: number | null
          status: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storage_path: string
          filename: string
          duration?: number | null
          file_size_mb?: number | null
          status?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          storage_path?: string
          filename?: string
          duration?: number | null
          file_size_mb?: number | null
          status?: string | null
          uploaded_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          user_id: string
          video_id: string
          stability: number
          power: number
          technique: number
          balance: number
          overall: number
          feedback: string
          tags: Json | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          stability: number
          power: number
          technique: number
          balance: number
          overall: number
          feedback: string
          tags?: Json | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          stability?: number
          power?: number
          technique?: number
          balance?: number
          overall?: number
          feedback?: string
          tags?: Json | null
          processing_time_ms?: number | null
          created_at?: string
        }
      }
    }
  }
}
