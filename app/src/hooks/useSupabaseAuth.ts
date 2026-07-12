import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';

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
    user: null, session: null, profile: null,
    isLoading: true, isAuthenticated: false, role: 'guest',
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles').select('*').eq('id', userId).single();

      if (error || !data) {
        const profileData = {
          id: userId, display_name: 'User', role: 'user',
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data: inserted, error: insertErr } = await supabase
          .from('user_profiles').upsert(profileData as any).select().single();
        if (insertErr) return null;
        return inserted as unknown as UserProfile;
      }
      return data as unknown as UserProfile;
    } catch { return null; }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          if (!mounted) return;
          setState({ user: session.user, session, profile,
            isLoading: false, isAuthenticated: true, role: profile?.role || 'user' });
        });
      } else { setState((s) => ({ ...s, isLoading: false })); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: session.user, session, profile,
            isLoading: false, isAuthenticated: true, role: profile?.role || 'user' });
        } else {
          setState({ user: null, session: null, profile: null,
            isLoading: false, isAuthenticated: false, role: 'guest' });
        }
      }
    );
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    return supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    });
  }, []);

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
    setState({ user: null, session: null, profile: null,
      isLoading: false, isAuthenticated: false, role: 'guest' });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return supabase.auth.updateUser({ password: newPassword });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return { error: new Error('Not authenticated') };
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('user_profiles').update(payload as any).eq('id', state.user.id).select().single();
    if (!error && data) setState((s) => ({ ...s, profile: data as unknown as UserProfile }));
    return { data, error };
  }, [state.user]);

  return {
    ...state,
    signUp, signIn, signInWithGoogle, signInWithMagicLink,
    signOut, resetPassword, updatePassword, updateProfile, supabase,
  };
}
