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
          episode_id: string;
          creator_id: string;
          script_text: string | null;
          status: ShortStatus;
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
          episode_id: string;
          creator_id: string;
          script_text?: string | null;
          status?: ShortStatus;
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
          episode_id?: string;
          creator_id?: string;
          script_text?: string | null;
          status?: ShortStatus;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      short_status: ShortStatus;
    };
  };
}
