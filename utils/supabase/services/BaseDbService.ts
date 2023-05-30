import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '../types'

export default abstract class BaseDbService {
  constructor (public supabase: SupabaseClient<Database>) {}
}
