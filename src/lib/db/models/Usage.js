// lib/db/models/Usage.js

import mongoose from 'mongoose'

const usageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actionType: {
    type: String,
    required: true,
    enum: ['generateResume', 'exportPdf', 'exportDocx'],
  },
  count: {
    type: Number,
    default: 1,
  },
  periodStart: {
    type: Date,
    required: true,
  },
  periodEnd: {
    type: Date,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

// Indexes
usageSchema.index({ userId: 1, periodStart: 1, periodEnd: 1 })
usageSchema.index({ actionType: 1 })
usageSchema.index({ createdAt: -1 })

// Static method to get monthly usage
usageSchema.statics.getMonthlyUsage = async function(userId, actionType) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  
  const usage = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        actionType: actionType,
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' }
      }
    }
  ])
  
  return usage.length > 0 ? usage[0].total : 0
}

// Static method to track an action
usageSchema.statics.trackAction = async function(userId, actionType, metadata = {}) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  
  return await this.create({
    userId,
    actionType,
    count: 1,
    periodStart: startOfMonth,
    periodEnd: endOfMonth,
    metadata,
  })
}

export default mongoose.models.Usage || mongoose.model('Usage', usageSchema)