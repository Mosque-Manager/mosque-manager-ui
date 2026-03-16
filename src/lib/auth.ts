import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import MosqueMember from '@/lib/models/MosqueMember';
import { authConfig } from '@/lib/auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        // Find the user's first mosque membership to set default context
        const membership = await MosqueMember.findOne({ userId: user._id });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isSuperAdmin: user.isSuperAdmin,
          mosqueId: membership?.mosqueId?.toString(),
          role: membership?.role,
          lang: user.lang,
        };
      },
    }),
  ],
});
