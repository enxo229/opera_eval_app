export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DynamicTestType =
  | 'A4_CASE'
  | 'B1_CASE'
  | 'B1_TICKET'
  | 'IA_CHAT'
  | 'TERMINAL_A1'
  | 'TERMINAL_A3'
  | 'TERMINAL_A4'
  | 'QUESTIONS_A1'
  | 'QUESTIONS_A2'
  | 'QUESTIONS_A3'
  | 'QUESTIONS_A4'
  | 'QUESTIONS_B1'
  | 'PROMPT_IA2'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'evaluator' | 'candidate'
          education_level: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'evaluator' | 'candidate'
          education_level?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'evaluator' | 'candidate'
          education_level?: string | null
          created_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          candidate_id: string
          evaluator_id: string
          status: string
          score_a: number | null
          score_b: number | null
          score_c: number | null
          score_ia: number | null
          final_score: number | null
          classification: string | null
          ai_insights: Json | null
        }
        Insert: {
          id?: string
          candidate_id: string
          evaluator_id: string
          status?: string
          score_a?: number | null
          score_b?: number | null
          score_c?: number | null
          score_ia?: number | null
          final_score?: number | null
          classification?: string | null
          ai_insights?: Json | null
        }
        Update: {
          id?: string
          candidate_id?: string
          evaluator_id?: string
          status?: string
          score_a?: number | null
          score_b?: number | null
          score_c?: number | null
          score_ia?: number | null
          final_score?: number | null
          classification?: string | null
          ai_insights?: Json | null
        }
      }
      dimension_scores: {
        Row: {
          id: string
          evaluation_id: string
          dimension: 'A' | 'B' | 'C' | 'IA' | null
          category: string
          raw_score: number
          comments: string | null
        }
        Insert: {
          id?: string
          evaluation_id: string
          dimension?: 'A' | 'B' | 'C' | 'IA' | null
          category: string
          raw_score: number
          comments?: string | null
        }
        Update: {
          id?: string
          evaluation_id?: string
          dimension?: 'A' | 'B' | 'C' | 'IA' | null
          category?: string
          raw_score?: number
          comments?: string | null
        }
      }
      dynamic_tests: {
        Row: {
          id: string
          evaluation_id: string
          test_type: DynamicTestType | null
          subcategory: string | null
          prompt_context: string | null
          ai_generated_content: string | null
          candidate_response: string | null
          ai_score: number | null
          ai_justification: string | null
        }
        Insert: {
          id?: string
          evaluation_id: string
          test_type: DynamicTestType
          subcategory?: string | null
          prompt_context?: string | null
          ai_generated_content?: string | null
          candidate_response?: string | null
          ai_score?: number | null
          ai_justification?: string | null
        }
        Update: {
          id?: string
          evaluation_id?: string
          test_type?: DynamicTestType
          subcategory?: string | null
          prompt_context?: string | null
          ai_generated_content?: string | null
          candidate_response?: string | null
          ai_score?: number | null
          ai_justification?: string | null
        }
      }
    }
  }
}
