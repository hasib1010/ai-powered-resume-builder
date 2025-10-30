// lib/db/models/Session.js

import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
})

// Indexes
sessionSchema.index({ sessionToken: 1 })
sessionSchema.index({ userId: 1 })
sessionSchema.index({ expires: 1 })

// Auto-delete expired sessions
sessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.Session || mongoose.model('Session', sessionSchema)