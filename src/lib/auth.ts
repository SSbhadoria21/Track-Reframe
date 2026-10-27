import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase Admin configuration:", {
      hasUrl: Boolean(url),
      hasKey: Boolean(key),
    });
    throw new Error("Supabase Admin configuration is incomplete.");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing Supabase Anon configuration:", {
      hasUrl: Boolean(url),
      hasKey: Boolean(key),
    });
    throw new Error("Supabase Client configuration is incomplete.");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const email = credentials.email.trim().toLowerCase();
        const supabase = getSupabaseAuthClient();

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: credentials.password,
        });

        if (error || !data.user) {
          throw new Error(error?.message || "Invalid email or password.");
        }

        // Attempt to fetch profile details from public.users
        let profile = null;
        try {
          const supabaseAdmin = getSupabaseAdmin();
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id, username, display_name, role, avatar_url")
            .ilike("email", email)
            .maybeSingle();
          profile = dbUser;
        } catch (profileErr: any) {
          console.warn("Could not query user profile during authorize:", profileErr?.message || profileErr);
        }

        return {
          id: profile?.id || data.user.id,
          email: data.user.email,
          name: profile?.display_name || data.user.user_metadata?.display_name || data.user.email,
          image: profile?.avatar_url || data.user.user_metadata?.avatar_url,
          username: profile?.username || data.user.user_metadata?.username,
          role: profile?.role || data.user.user_metadata?.role || "creator",
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.error("Sign in failed: No email provided by provider.");
        return false;
      }

      const normalizedEmail = user.email.trim().toLowerCase();

      try {
        const supabaseAdmin = getSupabaseAdmin();

        const { data: existingUser, error: fetchError } = await supabaseAdmin
          .from("users")
          .select("id")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (fetchError) {
          console.error("DATABASE ERROR (Check User):", fetchError.message || fetchError);
        }

        if (!existingUser) {
          console.log("Creating new user profile for:", normalizedEmail);

          // Generate a base username from email (before @, sanitized)
          const baseUsername = normalizedEmail
            .split("@")[0]
            .replace(/[^a-zA-Z0-9_]/g, "")
            .slice(0, 15);

          // Check for username collisions
          const { data: usernameExists } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("username", baseUsername)
            .maybeSingle();

          const finalUsername = usernameExists
            ? `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`
            : (baseUsername || `user_${Math.random().toString(36).slice(2, 8)}`);

          const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id || "");
          const newUserId = isUserUuid ? user.id : uuidv4();

          const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
              id: newUserId,
              email: normalizedEmail,
              username: (user as any).username || finalUsername,
              display_name: user.name || finalUsername,
              avatar_url: user.image,
              roles: (user as any).role ? [(user as any).role.toLowerCase()] : ["creator"],
              role: (user as any).role ? (user as any).role.toLowerCase() : "creator",
              onboarding_complete: false,
              coins: 0,
            });

          if (insertError) {
            console.error("DATABASE ERROR (Create User):", insertError.message || insertError);
            // If duplicate email race occurred, re-verify existence before rejecting
            const { data: retryUser } = await supabaseAdmin
              .from("users")
              .select("id")
              .ilike("email", normalizedEmail)
              .maybeSingle();

            if (!retryUser) {
              return false;
            }
          } else {
            console.log("New user created successfully:", (user as any).username || finalUsername);
          }
        }

        return true;
      } catch (error: any) {
        console.error("CRITICAL AUTH ERROR in signIn callback:", error?.message || error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).supabaseAccessToken = token.supabaseAccessToken;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      const email = (user?.email || token?.email)?.trim()?.toLowerCase();

      try {
        const supabaseAdmin = getSupabaseAdmin();
        if (email) {
          const { data: profile } = await supabaseAdmin
            .from("users")
            .select("id, role, username")
            .ilike("email", email)
            .maybeSingle();

          if (profile) {
            token.sub = profile.id;
            token.role = profile.role || (user as any)?.role || "creator";
            token.username = profile.username || (user as any)?.username;
          } else if (user) {
            token.sub = user.id;
            token.role = (user as any)?.role || "creator";
            token.username = (user as any)?.username;
          }
        }
      } catch (err: any) {
        console.warn("JWT profile fetch error:", err?.message || err);
      }

      // Mint a custom Supabase JWT to securely pass to the client
      if (process.env.SUPABASE_JWT_SECRET && token.sub) {
        try {
          token.supabaseAccessToken = jwt.sign(
            {
              aud: "authenticated",
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
              sub: token.sub,
              email: token.email,
              role: "authenticated",
            },
            process.env.SUPABASE_JWT_SECRET
          );
        } catch (jwtErr: any) {
          console.warn("JWT sign error:", jwtErr?.message || jwtErr);
        }
      }

      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};
