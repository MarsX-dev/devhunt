import moment from 'moment';
import { supabase } from './supabaseClient';

export function commentLogsService() {
  return {
    insertCommentLogs: async function ({ comments_number, emails_sent }: { comments_number: number; emails_sent: number }) {
      const { error, data } = await supabase
        .from('cron_comment_logs')
        .insert({
          comments_number,
          emails_sent,
        })
        .single();
      if (error) throw error;
      return data;
    },
    getTodayLog: async function () {
      const todayDate = moment().add(-1, 'day').toDate();
      const { error, data } = await supabase.from('cron_comment_logs').select('*').gte('created_at', todayDate.toISOString());

      if (error) throw error;
      return data;
    },
  };
}

export async function upvoteLogsService() {
  return {
    insertUpvoteLogs: async function ({ upvotes_number, emails_sent }: { upvotes_number: number; emails_sent: number }) {
      const { error, data } = await supabase
        .from('cron_upvote_logs')
        .insert({
          upvotes_number,
          emails_sent,
        })
        .single();
      if (error) throw error;
      return data;
    },
    getTodayLog: async function () {
      const todayDate = moment().add(-1, 'day').toDate();
      const { error, data } = await supabase.from('cron_upvote_logs').select('*').gte('created_at', todayDate.toISOString());

      if (error) throw error;
      return data;
    },
  };
}
