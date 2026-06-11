import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient(accessToken?: string) {
  const options = accessToken ? {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  } : undefined;

  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options
    )
  }

  if (!client || accessToken) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options
    )
  }
  return client;
}
