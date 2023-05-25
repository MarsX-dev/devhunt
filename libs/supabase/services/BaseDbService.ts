import { type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/libs/supabase/server'
import { type Database } from '../types'

export default abstract class BaseDbService {
  get supabase (): SupabaseClient<Database> {
    return createServerClient()
  }
}
