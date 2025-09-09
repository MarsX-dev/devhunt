import { usermavenClient, UsermavenClient } from '@usermaven/sdk-js';

let usermaven: UsermavenClient | null = null;
if (process.env.USER_MAVEN_KEY) {
  usermaven = usermavenClient({
    key: process.env.USER_MAVEN_KEY as string,
    tracking_host: 'https://events.usermaven.com',
  });
}

export default usermaven;
