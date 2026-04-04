export type ShortStatus =
  | "draft"
  | "queued"
  | "voice_rendering"
  | "avatar_generating"
  | "compositing"
  | "done"
  | "error";

export interface Database {
  public: {
    Tables: {
      creators: {
        Row: {
          id: string;
          name: string;
          show_name: string | null;
          elevenlabs_voice_id: string | null;
          heygen_avatar_id: string | null;
          system_prompt: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          show_name?: string | null;
          elevenlabs_voice_id?: string | null;
          heygen_avatar_id?: string | null;
          system_prompt?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          show_name?: string | null;
          elevenlabs_voice_id?: string | null;
          heygen_avatar_id?: string | null;
          system_prompt?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      episodes: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          podcast_name: string | null;
          published_at: string | null;
          transcript_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          podcast_name?: string | null;
          published_at?: string | null;
          transcript_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          podcast_name?: string | null;
          published_at?: string | null;
          transcript_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "episodes_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      shorts: {
        Row: {
          id: string;
          episode_id: string | null;
          creator_id: string;
          script_text: string | null;
          status: ShortStatus;
          post_type: string | null;
          post_title: string | null;
          post_bullets: string | null;
          elevenlabs_audio_url: string | null;
          heygen_video_id: string | null;
          heygen_video_url: string | null;
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id?: string | null;
          creator_id: string;
          script_text?: string | null;
          status?: ShortStatus;
          post_type?: string | null;
          post_title?: string | null;
          post_bullets?: string | null;
          elevenlabs_audio_url?: string | null;
          heygen_video_id?: string | null;
          heygen_video_url?: string | null;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          episode_id?: string | null;
          creator_id?: string;
          script_text?: string | null;
          status?: ShortStatus;
          post_type?: string | null;
          post_title?: string | null;
          post_bullets?: string | null;
          elevenlabs_audio_url?: string | null;
          heygen_video_id?: string | null;
          heygen_video_url?: string | null;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shorts_episode_id_fkey";
            columns: ["episode_id"];
            isOneToOne: false;
            referencedRelation: "episodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shorts_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
        ];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          pillar_ids: string[];
          xp_value: number;
          leverage_score: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          pillar_ids?: string[];
          xp_value?: number;
          leverage_score?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          pillar_ids?: string[];
          xp_value?: number;
          leverage_score?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          completed_on: string;
          xp_earned: number;
          bonus_xp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          completed_on?: string;
          xp_earned?: number;
          bonus_xp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          user_id?: string;
          completed_on?: string;
          xp_earned?: number;
          bonus_xp?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey";
            columns: ["habit_id"];
            isOneToOne: false;
            referencedRelation: "habits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_scores: {
        Row: {
          id: string;
          user_id: string;
          score_date: string;
          total_xp: number;
          habits_done: number;
          habits_total: number;
          streak_day: number;
          pillar_xp: Record<string, number>;
        };
        Insert: {
          id?: string;
          user_id: string;
          score_date?: string;
          total_xp?: number;
          habits_done?: number;
          habits_total?: number;
          streak_day?: number;
          pillar_xp?: Record<string, number>;
        };
        Update: {
          id?: string;
          user_id?: string;
          score_date?: string;
          total_xp?: number;
          habits_done?: number;
          habits_total?: number;
          streak_day?: number;
          pillar_xp?: Record<string, number>;
        };
        Relationships: [
          {
            foreignKeyName: "daily_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      streak_records: {
        Row: {
          id: string;
          user_id: string;
          streak_start: string;
          streak_end: string | null;
          streak_length: number;
          is_active: boolean;
          is_personal_best: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          streak_start: string;
          streak_end?: string | null;
          streak_length?: number;
          is_active?: boolean;
          is_personal_best?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          streak_start?: string;
          streak_end?: string | null;
          streak_length?: number;
          is_active?: boolean;
          is_personal_best?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "streak_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      short_status: ShortStatus;
    };
  };
}
