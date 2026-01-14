// hooks/useAuth.js
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Custom hook for authentication in client components
 */
export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const user = session?.user || null

  /**
   * Sign in with credentials
   */
  const loginWithCredentials = useCallback(async (email, password, callbackUrl = '/dashboard') => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: result.error }
      }

      router.push(callbackUrl)
      router.refresh()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [router])

  /**
   * Sign in with Google
   */
  const loginWithGoogle = useCallback(async (callbackUrl = '/dashboard') => {
    try {
      await signIn('google', { callbackUrl })
    } catch (error) {
      console.error('Google sign in error:', error)
    }
  }, [])

  /**
   * Sign out
   */
  const logout = useCallback(async (callbackUrl = '/') => {
    await signOut({ callbackUrl })
  }, [])

  /**
   * Update session data (e.g., after subscription change)
   */
  const updateSession = useCallback(async (data) => {
    await update(data)
    router.refresh()
  }, [update, router])

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role) => {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.role)
  }, [user])

  /**
   * Check if user has specific subscription tier
   */
  const hasTier = useCallback((tier) => {
    if (!user) return false
    const tiers = Array.isArray(tier) ? tier : [tier]
    return tiers.includes(user.subscriptionTier)
  }, [user])

  /**
   * Check if user is admin
   */
  const isAdmin = user?.role === 'ADMIN'

  /**
   * Check if user is on free tier
   */
  const isFreeTier = user?.subscriptionTier === 'FREE'

  /**
   * Check if user is on pro tier or higher
   */
  const isProOrHigher = user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'BUSINESS'

  return {
    // Session state
    session,
    user,
    status,
    isLoading,
    isAuthenticated,
    
    // Auth actions
    loginWithCredentials,
    loginWithGoogle,
    logout,
    updateSession,
    
    // Role checks
    hasRole,
    isAdmin,
    
    // Subscription checks
    hasTier,
    isFreeTier,
    isProOrHigher,
  }
}

/**
 * Hook to require authentication in client components
 * Redirects to login if not authenticated
 */
export function useRequireAuth(callbackUrl) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  if (!isLoading && !isAuthenticated) {
    const loginUrl = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login'
    router.push(loginUrl)
  }

  return { isLoading, isAuthenticated }
}