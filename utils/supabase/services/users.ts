import type { Profile } from '@/utils/supabase/types';


import BaseDbService from './BaseDbService';

interface ProfileWithEmail extends Partial<Profile> {
  email: string;
}

interface UserWithEmail {
  email: string;
  id: string
}

export default class UsersService extends BaseDbService {
  async getUserWithEmails(userIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(userIds));
    const { data, error } = await this.supabase.rpc('get_user_emails_by_ids', { user_ids: uniqueIds });

    if (error) {
      throw new Error('Error during fetching user emails from SupaBase');
    }

    return new Map(
      data.map(obj => {
        return [obj.id, obj.email];
      }),
    );
  }

  async fullFillWithUserEmails(profiles: Partial<Profile>[]): Promise<ProfileWithEmail[]> {
    const uniqueIds = Array.from(new Set(profiles.map((p) => p.id))) as string[];
    const { data, error } = await this.supabase.rpc('get_user_emails_by_ids', { user_ids: uniqueIds });

    if (error) {
      throw new Error('Error during fetching user emails from SupaBase');
    }

    const usersMap = new Map(
      data.map(obj => {
        return [obj.id, obj.email];
      }),
    );

    return profiles.map((p) => ({
      ...p,
      email: usersMap.get(p.id) ?? ''
    })) as ProfileWithEmail[];
  }
}
