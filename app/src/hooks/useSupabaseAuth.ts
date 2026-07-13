import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { fetchProfile } from '@/lib/conversations';
import type { UserProfile } from '@/types';
import type { ProfileRow } from '@/types/db-helpers';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: string;
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    role: 'guest',
  });

  const refreshProfile = useCallback(async (userId: string) => {
    try {
      const profile = (await fetchProfile(userId)) as ProfileRow | null;
      if (!profile) {
        return {
          id: userId,
          display_name: 'User',
          avatar_url: null,
          role: 'user',
          subscription_tier: 'free',
          subscription_status: null,
          prompt_count: 0,
          daily_prompt_count: 0,
          daily_prompt_reset: null,
          storage_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as UserProfile;
      }
      return profile as unknown as UserProfile;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (!mounted) return;
      if (session?.user) {
        refreshProfile(session.user.id).then((profile) => {
          if (!mounted) return;
          setState({
            user: session.user,
            session,
            profile,
            isLoading: false,
            isAuthenticated: true,
            role: profile?.role ?? 'user',
          });
        });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (!mounted) return;
        if (session?.user) {
          const profile = await refreshProfile(session.user.id);
          setState({
            user: session.user,
            session,
            profile,
            isLoading: false,
            isAuthenticated: true,
            role: profile?.role ?? 'user',
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            role: 'guest',
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      return supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split('@')[0] },
          emailRedirectTo: `${window.location.origin}/#/chat`,
        },
      });
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/chat`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/#/chat` },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      role: 'guest',
    });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return supabase.auth.updateUser({ password: newPassword });
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<ProfileRow>) => {
      if (!state.user) return { error: new Error('Not authenticated') };
      const payload = { ...updates, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('user_profiles')
        .update(payload as any)
        .eq('id', state.user.id)
        .select()
        .single();
      if (!error && data) {
        setState((s) => ({ ...s, profile: data as unknown as UserProfile }));
      }
      return { data, error };
    },
    [state.user]
  );

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    supabase,
  };
}