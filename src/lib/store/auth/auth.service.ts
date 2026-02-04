import { supabaseBrowser } from '@/lib/supabase/browser';

export const authService = {
  async getSession() {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signInWithPassword(email: string, password: string) {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async signUp(email: string, password: string, lastName: string, firstName: string) {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { last_name: lastName, first_name: firstName } },
    });
    if (error) throw error;
    return data;
  },
};
