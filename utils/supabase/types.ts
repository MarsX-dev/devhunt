export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      comment: {
        Row: {
          content: string;
          created_at: string | null;
          deleted: boolean;
          id: number;
          parent_id: number | null;
          product_id: number;
          user_id: string;
          votes_count: number;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          deleted?: boolean;
          id?: number;
          parent_id?: number | null;
          product_id: number;
          user_id: string;
          votes_count?: number;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          deleted?: boolean;
          id?: number;
          parent_id?: number | null;
          product_id?: number;
          user_id?: string;
          votes_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'comment_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comment';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comment_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comment_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comment_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'comment_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comment_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'comment_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'comment_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'comment_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      comment_vote: {
        Row: {
          comment_id: number;
          created_at: string | null;
          user_id: string;
        };
        Insert: {
          comment_id: number;
          created_at?: string | null;
          user_id: string;
        };
        Update: {
          comment_id?: number;
          created_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comment_vote_comment_id_fkey';
            columns: ['comment_id'];
            isOneToOne: false;
            referencedRelation: 'comment';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comment_vote_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: {
          created_at: string | null;
          id: number;
          name: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_categories_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'product_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_category_product: {
        Row: {
          category_id: number;
          created_at: string;
          product_id: number;
        };
        Insert: {
          category_id: number;
          created_at?: string;
          product_id: number;
        };
        Update: {
          category_id?: number;
          created_at?: string;
          product_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'product_category_product_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'product_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_category_product_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_category_product_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_category_product_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'product_category_product_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_category_product_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_category_product_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_category_product_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
        ];
      };
      product_pricing_types: {
        Row: {
          created_at: string | null;
          id: number;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_votes: {
        Row: {
          created_at: string | null;
          product_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          product_id?: number;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          product_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'product_votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_votes_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          asset_urls: string[] | null;
          comments_count: number;
          created_at: string;
          deleted: boolean;
          deleted_at: string | null;
          demo_url: string | null;
          demo_video_url: string | null;
          description: string | null;
          github_url: string | null;
          id: number;
          is_draft: boolean;
          launch_date: string;
          launch_description: string | null;
          launch_end: string | null;
          launch_start: string | null;
          logo_url: string;
          name: string;
          owner_id: string | null;
          pricing_type: number;
          slogan: string | null;
          slug: string;
          updated_at: string;
          views_count: number;
          votes_count: number;
          week: number | null;
        };
        Insert: {
          asset_urls?: string[] | null;
          comments_count: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          demo_url?: string | null;
          demo_video_url?: string | null;
          description?: string | null;
          github_url?: string | null;
          id?: number;
          is_draft: boolean;
          launch_date: string;
          launch_description?: string | null;
          launch_end?: string | null;
          launch_start?: string | null;
          logo_url: string;
          name: string;
          owner_id?: string | null;
          pricing_type: number;
          slogan?: string | null;
          slug: string;
          updated_at?: string;
          views_count?: number;
          votes_count?: number;
          week?: number | null;
        };
        Update: {
          asset_urls?: string[] | null;
          comments_count?: number;
          created_at?: string;
          deleted?: boolean;
          deleted_at?: string | null;
          demo_url?: string | null;
          demo_video_url?: string | null;
          description?: string | null;
          github_url?: string | null;
          id?: number;
          is_draft?: boolean;
          launch_date?: string;
          launch_description?: string | null;
          launch_end?: string | null;
          launch_start?: string | null;
          logo_url?: string;
          name?: string;
          owner_id?: string | null;
          pricing_type?: number;
          slogan?: string | null;
          slug?: string;
          updated_at?: string;
          views_count?: number;
          votes_count?: number;
          week?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_pricing_type_fkey';
            columns: ['pricing_type'];
            isOneToOne: false;
            referencedRelation: 'product_pricing_types';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          about: string | null;
          avatar_url: string | null;
          full_name: string | null;
          headline: string | null;
          id: string;
          twitter: string | null;
          updated_at: string | null;
          username: string | null;
          website_url: string | null;
          social_url: string | null;
        };
        Insert: {
          about?: string | null;
          avatar_url?: string | null;
          full_name?: string | null;
          headline?: string | null;
          id: string;
          twitter?: string | null;
          updated_at?: string | null;
          username?: string | null;
          website_url?: string | null;
          social_url: string | null;
        };
        Update: {
          about?: string | null;
          avatar_url?: string | null;
          full_name?: string | null;
          headline?: string | null;
          id?: string;
          twitter?: string | null;
          updated_at?: string | null;
          username?: string | null;
          website_url?: string | null;
          social_url: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      product_awards: {
        Row: {
          award_type: string | null;
          launch_date: string | null;
          month: number | null;
          product_id: number | null;
          rank: number | null;
          week: number | null;
          year: number | null;
        };
        Relationships: [];
      };
      product_ranks: {
        Row: {
          award_type: string | null;
          launch_date: string | null;
          month: number | null;
          product_id: number | null;
          rank: number | null;
          week: number | null;
          year: number | null;
        };
        Relationships: [];
      };
      product_votes_view: {
        Row: {
          demo_url: string | null;
          id: number | null;
          logo_url: string | null;
          name: string | null;
          pricing_type: number | null;
          slogan: string | null;
          slug: string | null;
          user_id: string | null;
          votes_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_pricing_type_fkey';
            columns: ['pricing_type'];
            isOneToOne: false;
            referencedRelation: 'product_pricing_types';
            referencedColumns: ['id'];
          },
        ];
      };
      weekly_rank: {
        Row: {
          end: string | null;
          name: string | null;
          productid: number | null;
          rank: number | null;
          slug: string | null;
          start: string | null;
          vote_count: number | null;
          week: number | null;
          year: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['productid'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['productid'];
            isOneToOne: true;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['productid'];
            isOneToOne: true;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['productid'];
            isOneToOne: true;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['productid'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['productid'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['productid'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
        ];
      };
      weekly_winners: {
        Row: {
          id: number | null;
          product_data: Json | null;
          total_upvotes: number | null;
          week: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
        ];
      };
      winner_of_the_day: {
        Row: {
          day: string | null;
          description: string | null;
          launch_date: string | null;
          launch_description: string | null;
          launch_end: string | null;
          launch_start: string | null;
          launch_votes_count: number | null;
          logo_url: string | null;
          name: string | null;
          product_categories: string[] | null;
          product_id: number | null;
          product_pricing: string | null;
          rank: number | null;
          slogan: string | null;
          slug: string | null;
          votes_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
        ];
      };
      winner_of_the_month: {
        Row: {
          description: string | null;
          end: string | null;
          launch_date: string | null;
          launch_description: string | null;
          launch_end: string | null;
          launch_start: string | null;
          launch_votes_count: number | null;
          logo_url: string | null;
          month: number | null;
          name: string | null;
          product_categories: string[] | null;
          product_id: number | null;
          product_pricing: string | null;
          rank: number | null;
          slogan: string | null;
          slug: string | null;
          start: string | null;
          votes_count: number | null;
          year: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
        ];
      };
      winner_of_the_week: {
        Row: {
          description: string | null;
          end: string | null;
          launch_date: string | null;
          launch_description: string | null;
          launch_end: string | null;
          launch_start: string | null;
          launch_votes_count: number | null;
          logo_url: string | null;
          name: string | null;
          product_categories: string[] | null;
          product_id: number | null;
          product_pricing: string | null;
          rank: number | null;
          slogan: string | null;
          slug: string | null;
          start: string | null;
          votes_count: number | null;
          week: number | null;
          year: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'product_votes_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'weekly_rank';
            referencedColumns: ['productid'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'weekly_winners';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_day';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_month';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'winner_of_the_week';
            referencedColumns: ['product_id'];
          },
        ];
      };
    };
    Functions: {
      get_next_launch_days: {
        Args: {
          _launch_date: string;
          _limit: number;
        };
        Returns: {
          launch_date: string;
          products: Json;
        }[];
      };
      get_next_launch_weeks: {
        Args: {
          _year: number;
          _start_day: number;
          _launch_week: number;
          _limit: number;
        };
        Returns: {
          week: number;
          start_date: string;
          end_date: string;
          products: Json;
        }[];
      };
      get_prev_launch_days: {
        Args: {
          _launch_date: string;
          _limit: number;
        };
        Returns: {
          launch_date: string;
          products: Json;
        }[];
      };
      get_prev_launch_weeks: {
        Args: {
          _year: number;
          _start_day: number;
          _launch_week: number;
          _limit: number;
        };
        Returns: {
          week: number;
          start_date: string;
          end_date: string;
          products: Json;
        }[];
      };
      get_products_count_by_date: {
        Args: {
          _start_date: string;
          _end_date: string;
        };
        Returns: {
          date: string;
          product_count: number;
        }[];
      };
      get_products_count_by_week:
        | {
            Args: {
              start_week: number;
              end_week: number;
            };
            Returns: {
              week_number: number;
              product_count: number;
            }[];
          }
        | {
            Args: {
              start_week: number;
              end_week: number;
              year_in: number;
              start_day: number;
            };
            Returns: {
              week_number: number;
              start_date: string;
              end_date: string;
              product_count: number;
            }[];
          }
        | {
            Args: {
              start_week: string;
              end_week: string;
            };
            Returns: {
              week_start: string;
              week_end: string;
              product_count: number;
            }[];
          };
      get_similar_products: {
        Args: {
          _product_id: number;
        };
        Returns: {
          asset_urls: string[] | null;
          comments_count: number;
          created_at: string;
          deleted: boolean;
          deleted_at: string | null;
          demo_url: string | null;
          demo_video_url: string | null;
          description: string | null;
          github_url: string | null;
          id: number;
          is_draft: boolean;
          launch_date: string;
          launch_description: string | null;
          launch_end: string | null;
          launch_start: string | null;
          logo_url: string;
          name: string;
          owner_id: string | null;
          pricing_type: number;
          slogan: string | null;
          slug: string;
          updated_at: string;
          views_count: number;
          votes_count: number;
          week: number | null;
        }[];
      };
      get_user_emails_by_ids: {
        Args: {
          user_ids: string[];
        };
        Returns: {
          id: string;
          email: string;
        }[];
      };
      get_week_number: {
        Args: {
          date_in: string;
          start_day: number;
        };
        Returns: number;
      };
      get_weeks: {
        Args: {
          year_in: number;
          start_day: number;
        };
        Returns: {
          week_number: number;
          start_date: string;
          end_date: string;
        }[];
      };
      toggleCommentVote: {
        Args: {
          _comment_id: number;
          _user_id: string;
        };
        Returns: boolean;
      };
      toggleProductVote: {
        Args: {
          _product_id: number;
          _user_id: string;
        };
        Returns: number;
      };
      updateViews: {
        Args: {
          _product_id: number;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends keyof (Database['public']['Tables'] & Database['public']['Views']) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] & Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] & Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] & Database['public']['Views'])
  ? (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never;

export type Comment = Database['public']['Tables']['comment']['Row'];
export type InsertComment = Database['public']['Tables']['comment']['Insert'];
export type UpdateComment = Database['public']['Tables']['comment']['Update'];

export type CommentVote = Database['public']['Tables']['comment_vote']['Row'];
export type InsertCommentVote = Database['public']['Tables']['comment_vote']['Insert'];
export type UpdateCommentVote = Database['public']['Tables']['comment_vote']['Update'];

export type ProductCategory = Database['public']['Tables']['product_categories']['Row'];
export type InsertProductCategory = Database['public']['Tables']['product_categories']['Insert'];
export type UpdateProductCategory = Database['public']['Tables']['product_categories']['Update'];

export type ProductCategoryProduct = Database['public']['Tables']['product_category_product']['Row'];
export type InsertProductCategoryProduct = Database['public']['Tables']['product_category_product']['Insert'];
export type UpdateProductCategoryProduct = Database['public']['Tables']['product_category_product']['Update'];

export type ProductPricingType = Database['public']['Tables']['product_pricing_types']['Row'];
export type InsertProductPricingType = Database['public']['Tables']['product_pricing_types']['Insert'];
export type UpdateProductPricingType = Database['public']['Tables']['product_pricing_types']['Update'];

export type ProductVote = Database['public']['Tables']['product_votes']['Row'];
export type InsertProductVote = Database['public']['Tables']['product_votes']['Insert'];
export type UpdateProductVote = Database['public']['Tables']['product_votes']['Update'];

export type Product = Database['public']['Tables']['products']['Row'];
export type InsertProduct = Database['public']['Tables']['products']['Insert'];
export type UpdateProduct = Database['public']['Tables']['products']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];
