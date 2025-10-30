// lib/db/usage-helpers.js

import connectDB from './mongodb'
import User from './models/User'
import Usage from './models/Usage'
import Resume from './models/Resume'
import { STRIPE_PLANS } from '@/lib/stripe/config'

/**
 * Get user's current usage statistics
 */
export async function getUserUsage(userId) {
  await connectDB()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Get monthly resume generations
  const monthlyGenerations = await Usage.getMonthlyUsage(userId, 'generateResume')

  // Get total saved resumes (not deleted)
  const savedResumes = await Resume.countUserResumes(userId)

  return {
    monthlyGenerations,
    savedResumes,
  }
}

/**
 * Check if user can perform an action based on their subscription tier
 */
export async function canUserPerformAction(userId, actionType) {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const plan = STRIPE_PLANS[user.subscriptionTier] || STRIPE_PLANS.FREE
  const usage = await getUserUsage(userId)

  if (actionType === 'generateResume') {
    const limit = plan.limits.monthlyGenerations
    if (limit === -1) return true // unlimited
    return usage.monthlyGenerations < limit
  }

  if (actionType === 'saveResume') {
    const limit = plan.limits.maxSavedResumes
    if (limit === -1) return true // unlimited
    return usage.savedResumes < limit
  }

  if (actionType === 'exportDocx') {
    return plan.features.exports.includes('docx')
  }

  if (actionType === 'exportPdf') {
    return plan.features.exports.includes('pdf')
  }

  return false
}

/**
 * Track a user action (for usage limits)
 */
export async function trackUserAction(userId, actionType, metadata = {}) {
  await connectDB()

  await Usage.trackAction(userId, actionType, metadata)
}

/**
 * Get user's current plan information
 */
export async function getUserPlanInfo(userId) {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const plan = STRIPE_PLANS[user.subscriptionTier] || STRIPE_PLANS.FREE
  const usage = await getUserUsage(userId)

  return {
    tier: user.subscriptionTier,
    plan: plan,
    usage: usage,
    limits: plan.limits,
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(userId, feature) {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const plan = STRIPE_PLANS[user.subscriptionTier] || STRIPE_PLANS.FREE
  return plan.features[feature] === true || plan.features[feature] === 'unlimited'
}