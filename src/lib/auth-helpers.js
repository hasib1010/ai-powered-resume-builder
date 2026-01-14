// lib/auth-helpers.js
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Get the current session in server components
 * @returns {Promise<import('next-auth').Session | null>}
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current user from session in server components
 * @returns {Promise<{id: string, email: string, name: string, image: string, subscriptionTier: string, role: string} | null>}
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use in server components or page components
 * @param {string} [callbackUrl] - URL to redirect to after login
 * @returns {Promise<import('next-auth').Session>}
 */
export async function requireAuth(callbackUrl) {
  const session = await auth()
  
  if (!session?.user) {
    const loginUrl = callbackUrl 
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login'
    redirect(loginUrl)
  }
  
  return session
}

/**
 * Require specific role - redirects to unauthorized page if role doesn't match
 * @param {string | string[]} allowedRoles - Role or array of roles allowed
 * @param {string} [redirectTo='/unauthorized'] - Where to redirect if unauthorized
 * @returns {Promise<import('next-auth').Session>}
 */
export async function requireRole(allowedRoles, redirectTo = '/unauthorized') {
  const session = await requireAuth()
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  if (!roles.includes(session.user.role)) {
    redirect(redirectTo)
  }
  
  return session
}

/**
 * Require admin role
 * @returns {Promise<import('next-auth').Session>}
 */
export async function requireAdmin() {
  return requireRole('ADMIN')
}

/**
 * Check if user has a specific subscription tier
 * @param {string | string[]} allowedTiers - Tier or array of tiers allowed
 * @returns {Promise<boolean>}
 */
export async function hasSubscriptionTier(allowedTiers) {
  const session = await auth()
  
  if (!session?.user) {
    return false
  }
  
  const tiers = Array.isArray(allowedTiers) ? allowedTiers : [allowedTiers]
  return tiers.includes(session.user.subscriptionTier)
}

/**
 * Require specific subscription tier
 * @param {string | string[]} allowedTiers - Tier or array of tiers allowed
 * @param {string} [redirectTo='/pricing'] - Where to redirect if tier doesn't match
 * @returns {Promise<import('next-auth').Session>}
 */
export async function requireSubscription(allowedTiers, redirectTo = '/pricing') {
  const session = await requireAuth()
  
  const tiers = Array.isArray(allowedTiers) ? allowedTiers : [allowedTiers]
  
  if (!tiers.includes(session.user.subscriptionTier)) {
    redirect(redirectTo)
  }
  
  return session
}