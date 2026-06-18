import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: "Email i contrasenya",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasenya", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const users = await sql`
          select id, email, nom, password_hash, rol
          from users
          where email = ${credentials.email as string}
          limit 1
        `;

        const user = users[0];
        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash as string
        );
        if (!valid) return null;

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.nom as string,
          rol: user.rol as string,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol ?? "usuari";
      }

      if (account?.provider === "google" && profile?.email) {
        const existing = await sql`
          select id, rol from users where email = ${profile.email}
        `;

        if (existing.length === 0) {
          const nou = await sql`
            insert into users (email, nom, genere, rol)
            values (
              ${profile.email},
              ${profile.name ?? profile.email},
              'no_especificat',
              'usuari'
            )
            returning id, rol
          `;
          token.id = nou[0].id;
          token.rol = nou[0].rol;
        } else {
          token.id = existing[0].id;
          token.rol = existing[0].rol;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).rol = token.rol as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
  },
});
