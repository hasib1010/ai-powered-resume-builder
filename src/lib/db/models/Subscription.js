// lib/db/models/Subscription.js

import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
  },
  stripePriceId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired'],
  },
  currentPeriodStart: {
    type: Date,
    required: true,
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  trialEnd: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Indexes
subscriptionSchema.index({ userId: 1 })
subscriptionSchema.index({ stripeSubscriptionId: 1 })
subscriptionSchema.index({ status: 1 })

export default mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema)