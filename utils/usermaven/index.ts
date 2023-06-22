import { usermavenClient, UsermavenClient } from '@usermaven/sdk-js';

export const usermaven: UsermavenClient = usermavenClient({
  key: process.env.USER_MAVEN_KEY as string,
  tracking_host: 'https://events.usermaven.com',
});
