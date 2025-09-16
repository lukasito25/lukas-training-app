import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key length:', supabaseAnonKey?.length)
console.log('Supabase Key preview:', supabaseAnonKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Validate key format (JWT should have 3 parts separated by dots)
if (supabaseAnonKey.split('.').length !== 3) {
  throw new Error('Invalid Supabase API key format')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface CompletedSession {
  id?: string
  user_id?: string
  session_date?: string
  session_time?: string
  week: number
  phase: string
  day_name: string
  exercises: any[]
  nutrition: any[]
  exercises_completed: number
  total_exercises: number
  nutrition_completed: number
  total_nutrition: number
  created_at?: string
  updated_at?: string
}

export interface UserPreferences {
  id?: string
  user_id?: string
  current_week: number
  completed_exercises: Record<string, boolean>
  exercise_weights: Record<string, number>
  nutrition_goals: Record<string, boolean>
  created_at?: string
  updated_at?: string
}

// Database operations
export class DatabaseService {
  private static userId = 'anonymous'

  // Save completed session
  static async saveSession(sessionData: Omit<CompletedSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    console.log('Attempting to save session:', { user_id: this.userId, ...sessionData });

    const { data, error } = await supabase
      .from('completed_sessions')
      .insert({
        user_id: this.userId,
        ...sessionData
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase save error:', error);
      throw error;
    }

    console.log('Session saved successfully:', data);
    return data
  }

  // Get all completed sessions
  static async getSessions(): Promise<CompletedSession[]> {
    const { data, error } = await supabase
      .from('completed_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Save user preferences (current state)
  static async savePreferences(preferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    console.log('DatabaseService.savePreferences() called with:', { user_id: this.userId, ...preferences });

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: this.userId,
        ...preferences
      })
      .select()
      .single()

    console.log('savePreferences result:', { data, error });

    if (error) {
      console.error('savePreferences error:', error);
      throw error;
    }

    console.log('savePreferences successfully saved:', data);
    return data
  }

  // Get user preferences
  static async getPreferences(): Promise<UserPreferences | null> {
    console.log('DatabaseService.getPreferences() called for user:', this.userId);

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', this.userId)
      .single()

    console.log('getPreferences result:', { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return default
        console.log('No preferences found, returning default values');
        return {
          current_week: 1,
          completed_exercises: {},
          exercise_weights: {},
          nutrition_goals: {}
        }
      }
      console.error('getPreferences error:', error);
      throw error
    }

    console.log('getPreferences returning data:', data);
    return data
  }

  // Delete a session
  static async deleteSession(sessionId: string) {
    const { error } = await supabase
      .from('completed_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', this.userId)

    if (error) throw error
  }
}