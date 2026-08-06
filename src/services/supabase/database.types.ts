// Schema snapshot for phase 4. Regenerate with `npm run supabase:types`
// whenever a migration changes after the local database is running.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      titles: {
        Row: {
          age_rating: string | null;
          backdrop_path: string | null;
          country_codes: string[];
          created_at: string;
          created_by: string | null;
          end_date: string | null;
          id: string;
          metadata_source: string;
          original_language: string | null;
          original_title: string | null;
          poster_path: string | null;
          publication_status: Database['public']['Enums']['publication_status'];
          published_at: string | null;
          release_date: string | null;
          runtime_minutes: number | null;
          search_document: unknown;
          short_synopsis: string | null;
          slug: string;
          status: Database['public']['Enums']['content_status'];
          synopsis: string;
          title: string;
          tmdb_id: number | null;
          trailer_url: string | null;
          type: Database['public']['Enums']['content_type'];
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['titles']['Row']> & {
          slug: string;
          title: string;
          type: Database['public']['Enums']['content_type'];
        };
        Update: Partial<Database['public']['Tables']['titles']['Insert']>;
        Relationships: [];
      };
      genres: {
        Row: { created_at: string; id: string; name: string; slug: string };
        Insert: { created_at?: string; id?: string; name: string; slug: string };
        Update: Partial<Database['public']['Tables']['genres']['Insert']>;
        Relationships: [];
      };
      title_genres: {
        Row: { genre_id: string; title_id: string };
        Insert: { genre_id: string; title_id: string };
        Update: never;
        Relationships: [];
      };
      seasons: {
        Row: {
          air_date: string | null;
          created_at: string;
          id: string;
          name: string;
          poster_path: string | null;
          publication_status: Database['public']['Enums']['publication_status'];
          season_number: number;
          synopsis: string | null;
          tmdb_id: number | null;
          title_id: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['seasons']['Row']> & {
          name: string;
          season_number: number;
          title_id: string;
        };
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>;
        Relationships: [];
      };
      episodes: {
        Row: {
          air_date: string | null;
          created_at: string;
          episode_number: number;
          id: string;
          intro_end: number | null;
          intro_start: number | null;
          outro_start: number | null;
          publication_status: Database['public']['Enums']['publication_status'];
          recap_end: number | null;
          recap_start: number | null;
          runtime_seconds: number | null;
          season_id: string;
          synopsis: string | null;
          thumbnail_path: string | null;
          title: string;
          tmdb_id: number | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['episodes']['Row']> & {
          episode_number: number;
          season_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['episodes']['Insert']>;
        Relationships: [];
      };
      video_assets: {
        Row: {
          id: string;
          title_id: string | null;
          episode_id: string | null;
          provider: string;
          provider_asset_id: string;
          audio_language: string;
          version_label: string | null;
          duration_seconds: number | null;
          status: Database['public']['Enums']['video_asset_status'];
          requires_entitlement: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['video_assets']['Row']> & {
          provider: string;
          provider_asset_id: string;
          audio_language: string;
        };
        Update: Partial<Database['public']['Tables']['video_assets']['Insert']>;
        Relationships: [];
      };
      watch_progress: {
        Row: {
          id: string;
          user_id: string;
          title_id: string;
          episode_id: string | null;
          position_seconds: number;
          duration_seconds: number | null;
          completed: boolean;
          completed_at: string | null;
          last_watched_at: string;
          hidden_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['watch_progress']['Row']> & {
          title_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['watch_progress']['Insert']>;
        Relationships: [];
      };
      user_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          kind: Database['public']['Enums']['user_list_kind'];
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_lists']['Row']> & {
          name: string;
          slug: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_lists']['Insert']>;
        Relationships: [];
      };
      ratings: {
        Row: {
          user_id: string;
          title_id: string;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ratings']['Row']> & {
          user_id: string;
          title_id: string;
          score: number;
        };
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
        Relationships: [];
      };
      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          first_seen_at: string;
          last_seen_at: string;
          visit_count: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['daily_activity']['Row']> & {
          user_id: string;
          activity_date: string;
        };
        Update: Partial<Database['public']['Tables']['daily_activity']['Insert']>;
        Relationships: [];
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['streaks']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['streaks']['Insert']>;
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          threshold_days: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['achievements']['Row']> & {
          slug: string;
          name: string;
          description: string;
          icon: string;
          threshold_days: number;
        };
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
        Relationships: [];
      };
      profile_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          source_activity_date: string;
        };
        Insert: Partial<Database['public']['Tables']['profile_achievements']['Row']> & {
          user_id: string;
          achievement_id: string;
          source_activity_date: string;
        };
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'new_episode';
          title_id: string | null;
          episode_id: string | null;
          payload: Record<string, unknown>;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & {
          user_id: string;
          type: 'new_episode';
        };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      notification_email_queue: {
        Row: {
          id: string;
          notification_id: string;
          user_id: string;
          status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
          scheduled_for: string;
          attempt_count: number;
          last_error: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['notification_email_queue']['Row']> & {
          notification_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['notification_email_queue']['Row']>;
        Relationships: [];
      };
      user_list_items: {
        Row: {
          list_id: string;
          title_id: string;
          note: string | null;
          sort_order: number;
          added_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_list_items']['Row']> & {
          list_id: string;
          title_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_list_items']['Insert']>;
        Relationships: [];
      };
      collections: {
        Row: {
          cover_path: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_featured: boolean;
          name: string;
          publication_status: Database['public']['Enums']['publication_status'];
          slug: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['collections']['Row']> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database['public']['Tables']['collections']['Insert']>;
        Relationships: [];
      };
      collection_items: {
        Row: { collection_id: string; sort_order: number; title_id: string };
        Insert: { collection_id: string; sort_order?: number; title_id: string };
        Update: { sort_order?: number };
        Relationships: [];
      };
      people: {
        Row: {
          biography: string | null;
          created_at: string;
          id: string;
          name: string;
          photo_path: string | null;
          slug: string;
          tmdb_id: number | null;
        };
        Insert: Partial<Database['public']['Tables']['people']['Row']> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database['public']['Tables']['people']['Insert']>;
        Relationships: [];
      };
      title_credits: {
        Row: {
          character_name: string | null;
          department: string;
          id: string;
          person_id: string;
          role: string;
          sort_order: number;
          title_id: string;
        };
        Insert: Partial<Database['public']['Tables']['title_credits']['Row']> & {
          department: string;
          person_id: string;
          role: string;
          title_id: string;
        };
        Update: Partial<Database['public']['Tables']['title_credits']['Insert']>;
        Relationships: [];
      };
      studios: {
        Row: { created_at: string; id: string; name: string; slug: string };
        Insert: { created_at?: string; id?: string; name: string; slug: string };
        Update: Partial<Database['public']['Tables']['studios']['Insert']>;
        Relationships: [];
      };
      title_studios: {
        Row: { studio_id: string; title_id: string };
        Insert: { studio_id: string; title_id: string };
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          accent_color: string;
          avatar_path: string | null;
          banner_path: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          featured_badge_id: string | null;
          id: string;
          is_public: boolean;
          locale: string;
          onboarding_completed_at: string | null;
          favorite_genre_slugs: string[];
          timezone: string;
          updated_at: string;
          username: string;
        };
        Insert: {
          accent_color?: string;
          avatar_path?: string | null;
          banner_path?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          featured_badge_id?: string | null;
          id: string;
          is_public?: boolean;
          locale?: string;
          onboarding_completed_at?: string | null;
          favorite_genre_slugs?: string[];
          timezone?: string;
          updated_at?: string;
          username: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      profile_preferences: {
        Row: {
          analytics_enabled: boolean;
          autoplay_next: boolean;
          autoplay_previews: boolean;
          created_at: string;
          data_saver: boolean;
          density: Database['public']['Enums']['interface_density'];
          email_digest_frequency: 'instant' | 'daily' | 'weekly';
          email_new_episodes: boolean;
          fallback_audio_language: string | null;
          history_visibility: Database['public']['Enums']['profile_visibility'];
          lists_visibility: Database['public']['Enums']['profile_visibility'];
          preferred_audio_language: string | null;
          preferred_subtitle_language: string | null;
          profile_id: string;
          profile_visibility: Database['public']['Enums']['profile_visibility'];
          reduced_motion: boolean;
          skip_intro: boolean;
          stats_visibility: Database['public']['Enums']['profile_visibility'];
          subtitles_enabled: boolean;
          theme: Database['public']['Enums']['theme_preference'];
          ui_language: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profile_preferences']['Row']> & {
          profile_id: string;
        };
        Update: Partial<Database['public']['Tables']['profile_preferences']['Row']>;
        Relationships: [];
      };
      user_roles: {
        Row: { created_at: string; role: Database['public']['Enums']['app_role']; user_id: string };
        Insert: {
          created_at?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      has_role: {
        Args: { requested_role: Database['public']['Enums']['app_role'] };
        Returns: boolean;
      };
      search_catalog: {
        Args: {
          requested_type?: Database['public']['Enums']['content_type'] | null;
          result_limit?: number;
          result_offset?: number;
          search_query: string;
        };
        Returns: Database['public']['Tables']['titles']['Row'][];
      };
      record_watch_progress: {
        Args: {
          p_title_id: string;
          p_episode_id: string | null;
          p_position_seconds: number;
          p_duration_seconds: number | null;
          p_client_session_id: string;
          p_watched_delta_seconds?: number;
          p_completed?: boolean;
          p_final?: boolean;
        };
        Returns: Array<{
          progress_id: string;
          position_seconds: number;
          completed: boolean;
        }>;
      };
      set_manual_watch_status: {
        Args: {
          p_title_id: string;
          p_scope: 'title' | 'season' | 'episode';
          p_scope_id?: string | null;
          p_watched?: boolean;
        };
        Returns: undefined;
      };
      ensure_system_user_lists: {
        Args: Record<never, never>;
        Returns: undefined;
      };
      update_profile_privacy: {
        Args: {
          p_profile_visibility: Database['public']['Enums']['profile_visibility'];
          p_stats_visibility: Database['public']['Enums']['profile_visibility'];
          p_history_visibility: Database['public']['Enums']['profile_visibility'];
          p_lists_visibility: Database['public']['Enums']['profile_visibility'];
        };
        Returns: undefined;
      };
      can_view_profile_stats: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      register_daily_activity: {
        Args: Record<never, never>;
        Returns: Array<{
          activity_date: string;
          next_reset_at: string;
          current_streak: number;
          longest_streak: number;
          new_achievement_slugs: string[];
        }>;
      };
      get_profile_stats: {
        Args: { p_user_id?: string | null };
        Returns: Array<{
          user_id: string;
          total_watch_seconds: number;
          watched_titles: number;
          completed_movies: number;
          completed_series_episodes: number;
          completed_anime_episodes: number;
          ratings_count: number;
          active_days: number;
          current_streak: number;
          longest_streak: number;
          achievements_unlocked: number;
        }>;
      };
      set_featured_achievement: {
        Args: { p_achievement_id?: string | null };
        Returns: undefined;
      };
      get_profile_section_visibility: {
        Args: { p_user_id: string };
        Returns: Array<{
          profile_is_public: boolean;
          stats_is_public: boolean;
          history_is_public: boolean;
          lists_is_public: boolean;
        }>;
      };
      can_view_profile_history: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      can_view_profile_lists: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      get_personalized_recommendations: {
        Args: { result_limit?: number };
        Returns: Array<{
          title_id: string;
          recommendation_score: number;
          recommendation_reason: string;
        }>;
      };
      update_email_notification_preferences: {
        Args: {
          p_email_new_episodes: boolean;
          p_email_digest_frequency: string;
        };
        Returns: undefined;
      };
      update_analytics_consent: {
        Args: { p_enabled: boolean };
        Returns: undefined;
      };
      record_app_event: {
        Args: { p_event_name: string; p_path: string; p_properties?: Json };
        Returns: boolean;
      };
      get_app_health: {
        Args: Record<never, never>;
        Returns: Json;
      };
    };
    Enums: {
      app_role: 'user' | 'moderator' | 'editor' | 'admin';
      content_status: 'announced' | 'ongoing' | 'completed' | 'cancelled';
      content_type: 'movie' | 'series' | 'anime';
      interface_density: 'comfortable' | 'compact';
      profile_visibility: 'private' | 'public';
      publication_status: 'draft' | 'scheduled' | 'published' | 'archived';
      theme_preference: 'system' | 'dark' | 'light';
      video_asset_status: 'processing' | 'ready' | 'failed' | 'archived';
      user_list_kind: 'custom' | 'watchlist' | 'favorites';
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfilePreferences = Database['public']['Tables']['profile_preferences']['Row'];
