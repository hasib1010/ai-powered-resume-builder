// app/api/auth/[...nextauth]/route.js

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/db/mongodb-client'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/db/models/User'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          await connectDB()
          
          const user = await User.findOne({ email: credentials.email }).select('+password')
          
          if (!user) {
            return null
          }
          
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            return null
          }
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            subscriptionTier: user.subscriptionTier,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
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
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.subscriptionTier = user.subscriptionTier
      }
      
      // Update session from client
      if (trigger === 'update' && session) {
        token.subscriptionTier = session.subscriptionTier
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.subscriptionTier = token.subscriptionTier
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }