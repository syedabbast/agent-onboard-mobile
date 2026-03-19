import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  'https://whljbpqyxeiohosozlkc.supabase.co';
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  'sb_publishable_2U69LR8EXUPKHM2VDElD1Q_WAqH6q2Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function getMyAgent() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: userError || new Error('Not authenticated') };
    }
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getMyAgents() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: userError || new Error('Not authenticated') };
    }
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getAgentByToken(token) {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function logAudit({
  connectionId,
  agentId,
  action,
  details = null,
}) {
  try {
    const { data, error } = await supabase.from('audit_log').insert({
      connection_id: connectionId,
      agent_id: agentId,
      action,
      details,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
