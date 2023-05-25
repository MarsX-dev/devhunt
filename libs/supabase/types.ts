export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      comment: {
        Row: {
          content: string
          created_at: string | null
          deleted: boolean
          id: number
          parent_id: number | null
          product_id: number
          user_id: string
          votes_count: number
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted?: boolean
          id?: number
          parent_id?: number | null
          product_id: number
          user_id: string
          votes_count?: number
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted?: boolean
          id?: number
          parent_id?: number | null
          product_id?: number
          user_id?: string
          votes_count?: number
        }
      }
      comment_vote: {
        Row: {
          comment_id: number
          created_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: number
          created_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: number
          created_at?: string | null
          user_id?: string
        }
      }
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
      upvoteComment: {
        Args: {
          _comment_id: number
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Comment = Database['public']['Tables']['comment']['Row']
export type InsertComment = Database['public']['Tables']['comment']['Insert']
export type UpdateComment = Database['public']['Tables']['comment']['Update']

export type CommentVote = Database['public']['Tables']['comment_vote']['Row']
export type InsertCommentVote = Database['public']['Tables']['comment_vote']['Insert']
export type UpdateCommentVote = Database['public']['Tables']['comment_vote']['Update']

export type ProductCategories = Database['public']['Tables']['product_categories']['Row']
export type InsertProductCategories = Database['public']['Tables']['product_categories']['Insert']
export type UpdateProductCategories = Database['public']['Tables']['product_categories']['Update']

export type ProductCategoryProduct = Database['public']['Tables']['product_category_product']['Row']
export type InsertProductCategoryProduct = Database['public']['Tables']['product_category_product']['Insert']
export type UpdateProductCategoryProduct = Database['public']['Tables']['product_category_product']['Update']

export type ProductPricingTypes = Database['public']['Tables']['product_pricing_types']['Row']
export type InsertProductPricingTypes = Database['public']['Tables']['product_pricing_types']['Insert']
export type UpdateProductPricingTypes = Database['public']['Tables']['product_pricing_types']['Update']

export type Products = Database['public']['Tables']['products']['Row']
export type InsertProducts = Database['public']['Tables']['products']['Insert']
export type UpdateProducts = Database['public']['Tables']['products']['Update']
