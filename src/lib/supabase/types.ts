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
          synthesia_avatar_id: string | null;
          system_prompt: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          show_name?: string | null;
          elevenlabs_voice_id?: string | null;
          synthesia_avatar_id?: string | null;
          system_prompt?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          show_name?: string | null;
          elevenlabs_voice_id?: string | null;
          synthesia_avatar_id?: string | null;
          system_prompt?: string;
          created_at?: string;
        };
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
      };
      shorts: {
        Row: {
          id: string;
          episode_id: string;
          creator_id: string;
          script_text: string | null;
          status: ShortStatus;
          elevenlabs_audio_url: string | null;
          synthesia_video_url: string | null;
          heygen_video_id: string | null;
          heygen_video_url: string | null;
          final_mp4_url: string | null;
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
          synthesia_video_url?: string | null;
          heygen_video_id?: string | null;
          heygen_video_url?: string | null;
          final_mp4_url?: string | null;
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
          synthesia_video_url?: string | null;
          heygen_video_id?: string | null;
          heygen_video_url?: string | null;
          final_mp4_url?: string | null;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      short_status: ShortStatus;
    };
  };
}
