// lib/db/models/Payment.js

import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  stripeInvoiceId: {
    type: String,
    required: true,
    unique: true,
  },
  stripeSubscriptionId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true, // in cents
  },
  currency: {
    type: String,
    default: 'usd',
    lowercase: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['succeeded', 'failed', 'pending', 'refunded'],
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Indexes
paymentSchema.index({ userId: 1 })
paymentSchema.index({ stripeSubscriptionId: 1 })
paymentSchema.index({ stripeInvoiceId: 1 })
paymentSchema.index({ createdAt: -1 })

// Static method to get user's payment history
paymentSchema.statics.getUserPayments = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Static method to calculate total revenue
paymentSchema.statics.getTotalRevenue = async function() {
  const result = await this.aggregate([
    {
      $match: { status: 'succeeded' }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ])
  
  return result.length > 0 ? result[0].total : 0
}

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema)