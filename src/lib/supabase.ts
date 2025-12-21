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
  meso: number
  week: number
  day: string
  done: Record<string, boolean>
  weights: Record<string, number>
  done_warmup: Record<string, boolean>
  done_cool: Record<string, boolean>
  nutrition_done: Record<string, boolean>
  created_at?: string
  updated_at?: string
}

export interface BodyMeasurement {
  id?: string
  user_id?: string
  mesocycle: number
  measurement_type: 'start' | 'end'
  arms: number
  chest: number
  shoulders: number
  traps: number
  weight: number
  date: string
  created_at?: string
  updated_at?: string
}

// Database operations
export class DatabaseService {
  private static userId = 'anonymous'

  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  }

  // Save completed session
  static async saveSession(sessionData: Omit<CompletedSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('completed_sessions')
      .insert({
        user_id: this.userId,
        ...sessionData
      })
      .select()
      .single()

    if (error) throw error
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
    try {
      // First, try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .select()
        .single()

      // If update succeeded, return the data
      if (updateData && !updateError) {
        return updateData;
      }

      // If no row exists (PGRST116 error), insert new record
      if (updateError && updateError.code === 'PGRST116') {
        const { data: insertData, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: this.userId,
            ...preferences
          })
          .select()
          .single()

        if (insertError) {
          throw insertError;
        }

        return insertData;
      }

      // If there was a different error, throw it
      if (updateError) {
        throw updateError;
      }

      return updateData;
    } catch (error) {
      console.error('Database save operation failed:', error);
      throw error;
    }
  }

  // Get user preferences
  static async getPreferences(): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found, return default
          return {
            meso: 1,
            week: 1,
            day: "push",
            done: {},
            weights: {},
            done_warmup: {},
            done_cool: {},
            nutrition_done: {}
          };
        }
        console.error('Database load operation failed:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Database load operation failed:', error);
      throw error;
    }
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

  // Save body measurements
  static async saveMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: this.userId,
        ...measurement
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get measurements for a specific mesocycle
  static async getMeasurementsForMesocycle(mesocycle: number): Promise<BodyMeasurement[]> {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', this.userId)
      .eq('mesocycle', mesocycle)
      .order('measurement_type', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get all measurements
  static async getAllMeasurements(): Promise<BodyMeasurement[]> {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', this.userId)
      .order('mesocycle', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Update a measurement
  static async updateMeasurement(id: string, measurement: Partial<BodyMeasurement>) {
    const { data, error } = await supabase
      .from('body_measurements')
      .update({
        ...measurement,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}