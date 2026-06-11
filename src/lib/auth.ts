import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          throw new Error(error?.message || "Invalid email or password.");
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.display_name || data.user.email,
          image: data.user.user_metadata?.avatar_url,
          username: data.user.user_metadata?.username,
          role: data.user.user_metadata?.role,
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        const { data: existingUser, error: fetchError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("DATABASE ERROR (Check User):", fetchError);
          return false;
        }

        if (!existingUser) {
          console.log("Attempting to create new user:", user.email);

          // Generate a username from email (before @, sanitized)
          const baseUsername = user.email
            .split("@")[0]
            .replace(/[^a-zA-Z0-9_]/g, "")
            .toLowerCase()
            .slice(0, 20);

          // Check for username collisions and append random suffix if needed
          const { data: usernameExists } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("username", baseUsername)
            .maybeSingle();

          const finalUsername = usernameExists
            ? `${baseUsername}_${Math.random().toString(36).slice(2, 6)}`
            : baseUsername;

          // If user.id is already a UUID (e.g. from credentials provider/Supabase auth), use it.
          const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id || "");
          const newUserId = isUserUuid ? user.id : uuidv4();

          const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
              id: newUserId,
              email: user.email,
              username: (user as any).username || finalUsername,
              display_name: user.name || finalUsername,
              avatar_url: user.image,
              roles: (user as any).role ? [(user as any).role.toLowerCase()] : ["creator"],
              role: (user as any).role ? (user as any).role.toLowerCase() : "creator",
              onboarding_complete: false,
              coins: 0,
            });

          if (insertError) {
            console.error("DATABASE ERROR (Create User):", insertError);
            return false;
          }
          console.log("New user created successfully:", (user as any).username || finalUsername);
        }

        return true;
      } catch (error) {
        console.error("CRITICAL AUTH ERROR:", error);
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
      // On initial sign-in, we have the user object from Google or Credentials
      if (user && user.email) {
        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("id, role, username")
          .eq("email", user.email)
          .single();

        token.sub = profile?.id || user.id;
        token.role = profile?.role || (user as any).role || "creator";
        token.username = profile?.username || (user as any).username;
      }

      // If token.sub is NOT a UUID (it's the Google ID number), we MUST fix it
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token.sub || "");
      
      if (!isUuid && token.email) {
        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("id, role, username")
          .eq("email", token.email)
          .single();

        if (profile) {
          token.sub = profile.id;
          token.role = profile.role;
          token.username = profile.username;
        }
      }

      // Mint a custom Supabase JWT to securely pass to the client
      if (process.env.SUPABASE_JWT_SECRET) {
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
      }
      
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: false,
};
