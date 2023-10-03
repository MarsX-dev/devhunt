# DevHunt

Open-source and collaborative launching platform for dev tools, built by developers. Join us at [DevHunt.org](https://devhunt.org) to showcase your innovations and empower developer tools across the web!

## Quick Start

Create a `.env.local` file at the root of your project and populate it with the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tusrbkspwpvucxzqhrgo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c3Jia3Nwd3B2dWN4enFocmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTYyNzI2OTUsImV4cCI6MjAxMTg0ODY5NX0.-HdjMYlbwVMggJiQ4cFxpr-AmNH1ueXBEgqxMPDlSJY
```

Install packages

```bash
npm install
# or
yarn install
# or
pnpm install
```

Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. **Done!**


## Getting Started

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Restore Supabase Dump

1. Create a [Supabase Project](https://supabase.com/dashboard/projects) and make sure to save the database password. 
2. Then navigate to `Project Settings` -> `Database Settings` -> `Connection Info`
3. Copy the `Host` value, which should look like `db.<ReferenceID>.supabase.co`

To restore the dump, execute the following command:

```bash
psql -h db.<ReferenceID>.supabase.co -U postgres -d postgres < /supabase/dump.sql
```

You will be prompted to enter the database password. This can be found in `Project Settings` -> `Database Settings` -> `Database Password`. Alternatively, use the password you saved during project creation.

### Set Up `.env.local` Configuration

Create a `.env.local` file at the root of your project and populate it with the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=<Your_Project_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Your_Anonymous_Key>
SUPABASE_SERVICE_ROLE_KEY=<Your_Service_Role_Key>
```

You can find the key values here:
1. `<Your_Project_URL>` -  Navigate to `Project Settings` -> `API` -> `Project URL` and copy the `URL`
2. `<Your_Anonymous_Key>` - Go to `Project Settings` -> `API` -> `Project API keys` and find the `anon` `public` key.
3. `<Your_Service_Role_Key>` - Under `Project Settings` -> `API` -> `Project API keys` locate the `service_role` `secret` key.

### Set Up Social Login (OAuth)

To enable social login features, follow the guides below for each platform:
- **GitHub login**: Simply configure your Supabase settings. For detailed instructions, refer to the Supabase [GitHub OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-github) - you need only to configure Supabase
- **Google login**: Follow the steps outlined in the Supabase [Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- **More Providers**: For a complete list of all available social login methods, consult the [Supabase Social Login](https://supabase.com/docs/guides/auth/social-login) documentation

These guides will walk you through the necessary configurations for enabling OAuth-based social logins.

### Launch the app

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Contributing

Are you interested in contributing to DEVHUNT, please read our [contributing guide](https://github.com/Dev-Ahmadubah/devhunt/blob/main/CONTRIBUTING.md) to learn about our development process before submitting a pull request.

## Forking and Cloning

You are free to fork and clone it as long as you clearly reffer to the original project. 
If it's a github, then refer to https://github.com/MarsX-dev/devhunt 
If it's a website, then refer to devhunt.org with a prominent logo and a link.
