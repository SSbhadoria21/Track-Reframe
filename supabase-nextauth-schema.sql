-- SQL Schema for NextAuth Supabase Adapter
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text,
  username text UNIQUE,
  display_name text,
  role text,
  coins integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  "userId" uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId"),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId")
    REFERENCES public.users (id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  "sessionToken" text NOT NULL,
  "userId" uuid NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken"),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId")
    REFERENCES public.users (id) ON DELETE CASCADE
);

-- Verification Tokens table
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);

-- Note: If you already have a 'users' table, you may need to merge the columns
-- instead of creating it. Ensure uuid_generate_v4() is available.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
