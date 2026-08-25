import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import dbConnect from "./mongoose"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_build_only_do_not_use_in_prod",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[auth][authorize] called with email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[auth][authorize] missing email or password in credentials");
          return null;
        }

        try {
          console.log("[auth][authorize] connecting to database...");
          await dbConnect();
          console.log("[auth][authorize] database connection successful");

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.log("[auth][authorize] no user found for email:", credentials.email);
            return null;
          }

          console.log("[auth][authorize] user found:", user.email);

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValid) {
            console.log("[auth][authorize] password comparison failed for email:", credentials.email);
            return null;
          }

          console.log("[auth][authorize] password comparison succeeded for email:", credentials.email);

          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.log("[auth][authorize] error during authorization:", error instanceof Error ? error.message : error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Fallback for JWT expiration (1 day)
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Omitting maxAge makes this a browser session cookie
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.sub!;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
}
