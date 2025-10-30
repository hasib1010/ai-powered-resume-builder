// lib/db/mongodb.js

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    }

    console.log('🔄 Connecting to MongoDB...')
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')) // Hide password in logs

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully')
        return mongoose
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message)

        // Provide helpful error messages
        if (error.message.includes('ECONNREFUSED')) {
          console.error('💡 MongoDB is not running. Please start MongoDB or use MongoDB Atlas.')
        } else if (error.message.includes('authentication failed')) {
          console.error('💡 Check your MongoDB username and password.')
        } else if (error.message.includes('connect ETIMEDOUT')) {
          console.error('💡 Cannot reach MongoDB server. Check:')
          console.error('   - MongoDB is running')
          console.error('   - Connection string is correct')
          console.error('   - Network/firewall settings')
          console.error('   - IP whitelist in MongoDB Atlas (if using)')
        }

        throw error
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error('❌ Failed to establish MongoDB connection')
    throw e
  }

  return cached.conn
}

export default connectDB