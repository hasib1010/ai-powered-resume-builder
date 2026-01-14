// lib/auth.js
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/db/mongodb-client'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Allow linking OAuth to existing email accounts
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          await connectDB()

          const user = await User.findOne({
            email: credentials.email.toLowerCase()
          }).select('+password')

          if (!user) {
            return null
          }

          // Check if user has a password (OAuth users might not)
          if (!user.password) {
            return null
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isValidPassword) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            subscriptionTier: user.subscriptionTier,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  events: {
    async createUser({ user }) {
      // This runs after a new OAuth user is created
      try {
        await connectDB()

        // Only set defaults if fields don't already exist (preserves manual admin role assignments)
        await User.findOneAndUpdate(
          { email: user.email },
          {
            $setOnInsert: {
              role: 'USER',
              subscriptionTier: 'FREE',
              isActive: true,
            },
          },
          { upsert: true, new: true }
        )

        console.log('OAuth user defaults set (if new):', user.email)
      } catch (error) {
        console.error('Error setting defaults for new user:', error)
      }
    },
    async signIn({ user, account }) {
      // Update last login timestamp and preserve admin roles
      if (user?.email) {
        try {
          await connectDB()

          // Get existing user to check current role
          const existingUser = await User.findOne({ email: user.email })

          // Prepare update - preserve ADMIN role if it exists
          const updateData = {
            $set: { lastLogin: new Date() }
          }

          // Only set role to USER if user doesn't exist or doesn't have a role yet
          // This prevents overwriting manually assigned ADMIN roles
          if (!existingUser || !existingUser.role) {
            updateData.$set.role = 'USER'
            updateData.$set.subscriptionTier = 'FREE'
            updateData.$set.isActive = true
          }

          await User.findOneAndUpdate(
            { email: user.email },
            updateData,
            { upsert: true }
          )

          console.log('User sign-in processed:', user.email, existingUser?.role ? `(role: ${existingUser.role})` : '(new user)')
        } catch (error) {
          console.error('Error updating lastLogin:', error)
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in with credentials
      if (user) {
        token.id = user.id
        token.subscriptionTier = user.subscriptionTier || 'FREE'
        token.role = user.role || 'USER'
      }

      // For OAuth users OR on token refresh, fetch fresh data from database
      // This ensures middleware always has the latest role
      if (account?.provider === 'google' || (!user && token.email)) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: token.email })
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role || 'USER'
            token.subscriptionTier = dbUser.subscriptionTier || 'FREE'
            console.log('🔄 JWT token updated from DB:', token.email, '| Role:', token.role)
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error)
        }
      }

      // Update session from client (when using update() function)
      if (trigger === 'update' && session) {
        if (session.subscriptionTier) {
          token.subscriptionTier = session.subscriptionTier
        }
        if (session.role) {
          token.role = session.role
        }
        if (session.name) {
          token.name = session.name
        }
        if (session.image) {
          token.picture = session.image
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.subscriptionTier = token.subscriptionTier || 'FREE'
        session.user.role = token.role || 'USER'

        // Debug logging to verify role is being set
        console.log('📋 Session created for:', session.user.email, '| Role:', session.user.role)
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow all sign ins by default
      // You can add custom logic here to block certain users

      if (account?.provider === 'google') {
        // Verify email is verified for Google accounts
        if (!profile?.email_verified) {
          return false
        }
      }

      return true
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})

