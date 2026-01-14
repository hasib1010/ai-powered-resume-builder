// lib/db/models/Resume.js

import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  sourceText: {
    type: String,
    required: false,
  },
  jobDescription: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'COMPLETED', 'ARCHIVED'],
    default: 'COMPLETED',
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  metadata: {
    jobTitle: String,
    company: String,
    createdAt: Date,
    name: String,
  },
  version: {
    type: Number,
    default: 1,
  },
  isDeleted: {
    type: Boolean,
    default: false,
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
resumeSchema.index({ userId: 1, isDeleted: 1 })
resumeSchema.index({ createdAt: -1 })

// Virtual for counting user's resumes
resumeSchema.statics.countUserResumes = function (userId) {
  return this.countDocuments({ userId, isDeleted: false })
}

// Soft delete method
resumeSchema.methods.softDelete = function () {
  this.isDeleted = true
  return this.save()
}

export default mongoose.models.Resume || mongoose.model('Resume', resumeSchema)