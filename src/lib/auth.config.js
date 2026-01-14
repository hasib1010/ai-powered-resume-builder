// lib/auth.config.js
// Edge Runtime compatible auth configuration (no database imports)
// This file is used by middleware which runs in Edge Runtime

export const authConfig = {
    pages: {
        signIn: '/login',
        signOut: '/',
        error: '/login',
    },
    callbacks: {
        // JWT callback - runs in Edge Runtime, adds role to token
        async jwt({ token, user, trigger, session }) {
            // On sign in, add role from user object
            if (user) {
                token.role = user.role || 'USER'
            }

            // On session update, update role in token
            if (trigger === 'update' && session?.role) {
                token.role = session.role
            }

            return token
        },

        // Session callback - runs in Edge Runtime, adds role to session for middleware
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role || 'USER'
            }
            return session
        },

        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const userRole = auth?.user?.role

            const isAdminRoute = nextUrl.pathname.startsWith('/admin')
            const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard')
            const isAuthRoute = ['/login', '/register', '/signup'].some((route) =>
                nextUrl.pathname.startsWith(route)
            )


            // Debug logging - inspect full auth object
            console.log('🔐 Middleware check:', {
                path: nextUrl.pathname,
                isLoggedIn,
                userRole,
                isAdminRoute,
                isDashboardRoute,
                fullAuth: JSON.stringify(auth, null, 2) // See full auth object
            })


            // Redirect to login if not authenticated on protected routes
            if (!isLoggedIn && (isAdminRoute || isDashboardRoute)) {
                const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
                console.log('➡️  Redirecting to login (not authenticated)')
                return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
            }

            // Redirect non-admin users away from admin routes
            if (isAdminRoute && userRole !== 'ADMIN') {
                console.log('➡️  Redirecting USER from /admin to /dashboard')
                return Response.redirect(new URL('/dashboard', nextUrl))
            }

            // Redirect admin users from dashboard to admin panel
            if (isDashboardRoute && userRole === 'ADMIN') {
                console.log('➡️  Redirecting ADMIN from /dashboard to /admin')
                return Response.redirect(new URL('/admin', nextUrl))
            }

            // Redirect authenticated users away from auth pages
            if (isAuthRoute && isLoggedIn) {
                const redirectUrl = userRole === 'ADMIN' ? '/admin' : '/dashboard'
                console.log(`➡️  Redirecting from auth page to ${redirectUrl}`)
                return Response.redirect(new URL(redirectUrl, nextUrl))
            }

            return true
        },
    },
    providers: [], // Providers are added in auth.js
}
