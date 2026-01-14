import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// GET /api/admin/system/health - System health check
export async function GET(request) {
    try {
        const session = await auth()

        // Check if user is admin
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: process.memoryUsage().heapUsed,
                total: process.memoryUsage().heapTotal,
                percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(2)
            },
            environment: process.env.NODE_ENV,
            nodeVersion: process.version,
        }

        return NextResponse.json(health)
    } catch (error) {
        console.error('Error checking system health:', error)
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: 'Failed to check system health'
            },
            { status: 500 }
        )
    }
}
