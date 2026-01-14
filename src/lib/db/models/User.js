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
    // ❌ Remove: index: true (duplicate - unique already creates index)
  },
  password: {
    type: String,
    select: false,
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
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER',
    required: true,
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true,
    // ❌ Remove separate index - unique already creates one
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

// ✅ Only keep indexes that aren't already created by unique: true
userSchema.index({ subscriptionTier: 1 })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

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

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      return false
    }
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date()
  return this.save()
}

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() })
}

userSchema.virtual('profile').get(function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    image: this.image,
    subscriptionTier: this.subscriptionTier,
  }
})

userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password
    return ret
  }
})

export default mongoose.models.User || mongoose.model('User', userSchema)