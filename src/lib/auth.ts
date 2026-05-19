import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

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

          const newUserId = uuidv4();

          const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
              id: newUserId,
              email: user.email,
              username: finalUsername,
              display_name: user.name || finalUsername,
              avatar_url: user.image,
              roles: ["creator"],
              onboarding_complete: false,
              coins: 0,
            });

          if (insertError) {
            console.error("DATABASE ERROR (Create User):", insertError);
            return false;
          }
          console.log("New user created successfully:", finalUsername);
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
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in, we have the user object from Google
      if (user && user.email) {
        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("id, role, username")
          .eq("email", user.email)
          .single();

        if (profile) {
          token.sub = profile.id;
          token.role = profile.role;
          token.username = profile.username;
        }
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
      
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: false,
};
