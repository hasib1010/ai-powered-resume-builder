// lib/db/models/VerificationToken.js

import mongoose from 'mongoose'

const verificationTokenSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expires: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
})

// Composite unique index
verificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true })
verificationTokenSchema.index({ token: 1 })

// Auto-delete expired tokens
verificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.VerificationToken || mongoose.model('VerificationToken', verificationTokenSchema)