import { type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/libs/supabase/server'
import { type Database } from '../types'
import { createBrowserClient } from '@/libs/supabase/browser'

export default abstract class BaseDbService {
  constructor (private readonly _isServer: boolean) {}

  get supabase (): SupabaseClient<Database> {
    if (this._isServer) {
      return createServerClient()
    }

    return createBrowserClient()
  }
}
