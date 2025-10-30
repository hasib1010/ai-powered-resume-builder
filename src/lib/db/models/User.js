// lib/db/models/User.js

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    // Password is optional because users can sign in with OAuth
    select: false, // Don't include password in queries by default
  },
  image: {
    type: String,
  },
  emailVerified: {
    type: Date,
  },
  subscriptionTier: {
    type: String,
    enum: ['FREE', 'PRO', 'BUSINESS'],
    default: 'FREE',
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
})

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ stripeCustomerId: 1 })
userSchema.index({ subscriptionTier: 1 })

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next()
  }

  // Skip if password is not set (OAuth users)
  if (!this.password) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // If no password is set (OAuth user), return false
    if (!this.password) {
      return false
    }
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date()
  return this.save()
}

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() })
}

// Virtual for user's public profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    image: this.image,
    subscriptionTier: this.subscriptionTier,
  }
})

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password
    return ret
  }
})

export default mongoose.models.User || mongoose.model('User', userSchema)
