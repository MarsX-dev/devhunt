export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      product_categories: {
        Row: {
          created_at: string | null
          id: number
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string | null
          updated_at?: string | null
        }
      }
      product_category_product: {
        Row: {
          category_id: number
          created_at: string | null
          product_id: number
        }
        Insert: {
          category_id?: number
          created_at?: string | null
          product_id: number
        }
        Update: {
          category_id?: number
          created_at?: string | null
          product_id?: number
        }
      }
      product_pricing_types: {
        Row: {
          created_at: string | null
          id: number
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          title?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          asset_urls: string[] | null
          comments_count: number
          created_at: string
          demo_url: string | null
          description: string | null
          github_url: string | null
          id: number
          is_draft: boolean
          launch_date: string
          logo_url: string
          name: string
          owner_id: string
          pricing_type: number
          slogan: string | null
          slug: string
          updated_at: string
          votes_counter: number
        }
        Insert: {
          asset_urls?: string[] | null
          comments_count: number
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: number
          is_draft: boolean
          launch_date: string
          logo_url: string
          name: string
          owner_id: string
          pricing_type: number
          slogan?: string | null
          slug: string
          updated_at?: string
          votes_counter: number
        }
        Update: {
          asset_urls?: string[] | null
          comments_count?: number
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: number
          is_draft?: boolean
          launch_date?: string
          logo_url?: string
          name?: string
          owner_id?: string
          pricing_type?: number
          slogan?: string | null
          slug?: string
          updated_at?: string
          votes_counter?: number
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
