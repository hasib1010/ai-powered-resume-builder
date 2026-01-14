'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import {
    Users,
    FileText,
    TrendingUp,
    Activity,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Shield,
    ShieldCheck,
    Trash2,
    RefreshCw,
    Download,
    LogOut,
    Home,
    Settings,
    Eye,
    Ban,
    CheckCircle,
    X,
    Mail,
    Calendar,
    CreditCard
} from 'lucide-react'

export default function AdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showUserModal, setShowUserModal] = useState(false)
    const [userResumes, setUserResumes] = useState([])
    const refreshIntervalRef = useRef(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (session?.user?.role !== 'ADMIN') {
            router.push('/dashboard')
        } else {
            fetchStats()
        }
    }, [session, status, router])

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (autoRefresh && !loading) {
            refreshIntervalRef.current = setInterval(() => {
                fetchStats(true)
            }, 30000)
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current)
            }
        }
    }, [autoRefresh, loading])

    const fetchStats = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            const response = await fetch('/api/admin/stats')
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            })

            if (response.ok) {
                fetchStats(true)
            }
        } catch (error) {
            console.error('Error updating role:', error)
        }
    }

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            })

            if (response.ok) {
                fetchStats(true)
                if (selectedUser?._id === userId) {
                    setSelectedUser({ ...selectedUser, isActive: !currentStatus })
                }
            }
        } catch (error) {
            console.error('Error toggling user status:', error)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchStats(true)
                setShowUserModal(false)
                setSelectedUser(null)
            }
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }

    const handleViewUser = async (user) => {
        setSelectedUser(user)
        setShowUserModal(true)

        // Fetch user's resumes
        try {
            const response = await fetch(`/api/admin/users/${user._id}/resumes`)
            if (response.ok) {
                const data = await response.json()
                setUserResumes(data.resumes || [])
            }
        } catch (error) {
            console.error('Error fetching user resumes:', error)
            setUserResumes([])
        }
    }

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' })
    }

    const filteredUsers = stats?.recentUsers?.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE' && user.isActive) ||
            (statusFilter === 'DISABLED' && !user.isActive)
        return matchesSearch && matchesRole && matchesStatus
    }) || []

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading admin dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8" />
                        Admin Panel
                    </h2>
                </div>

                <nav className="flex-1 p-4">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg font-medium mb-2">
                        <Home className="w-5 h-5" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium mb-2"
                    >
                        <FileText className="w-5 h-5" />
                        My Resumes
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{session?.user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
                            <p className="mt-2 text-gray-600">System statistics and user management</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${autoRefresh
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                            </button>
                            <button
                                onClick={() => fetchStats()}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Animated Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <AnimatedStatCard
                            title="Total Users"
                            value={stats?.totalUsers || 0}
                            icon={Users}
                            color="blue"
                            trend={stats?.growthRate > 0 ? 'up' : 'down'}
                        />
                        <AnimatedStatCard
                            title="Total Resumes"
                            value={stats?.totalResumes || 0}
                            icon={FileText}
                            color="green"
                            trend="up"
                        />
                        <AnimatedStatCard
                            title="Active Users"
                            value={stats?.activeUsers || 0}
                            icon={Activity}
                            color="purple"
                            subtitle="Last 30 days"
                        />
                        <AnimatedStatCard
                            title="Growth Rate"
                            value={stats?.growthRate || 0}
                            icon={TrendingUp}
                            color="orange"
                            suffix="%"
                            trend={stats?.growthRate > 0 ? 'up' : 'down'}
                        />
                    </div>

                    {/* User Management Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                                <Download className="w-4 h-4" />
                                Export Users
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white cursor-pointer transition-all"
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="USER">Users</option>
                                    <option value="ADMIN">Admins</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white cursor-pointer transition-all"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="DISABLED">Disabled</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* User Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Role</th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-right py-4 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user, index) => (
                                            <UserRow
                                                key={user._id}
                                                user={user}
                                                index={index}
                                                onRoleChange={handleRoleChange}
                                                onToggleStatus={handleToggleUserStatus}
                                                onViewUser={handleViewUser}
                                                onDeleteUser={handleDeleteUser}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-500">
                                                No users found matching your criteria
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Subscription Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-6 text-gray-900">Subscription Distribution</h2>
                            <div className="space-y-4">
                                {stats?.subscriptionStats?.map((sub, index) => (
                                    <SubscriptionBar
                                        key={sub._id}
                                        tier={sub._id}
                                        count={sub.count}
                                        total={stats.totalUsers}
                                        index={index}
                                    />
                                )) || (
                                        <p className="text-gray-500 text-center py-4">No subscription data</p>
                                    )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-6 text-gray-900">Quick Insights</h2>
                            <div className="space-y-4">
                                <InsightCard
                                    label="User Engagement"
                                    value={`${Math.round((stats?.activeUsers / stats?.totalUsers) * 100) || 0}%`}
                                    description="Active users in last 30 days"
                                    color="purple"
                                />
                                <InsightCard
                                    label="Avg Resumes per User"
                                    value={(stats?.totalResumes / stats?.totalUsers || 0).toFixed(1)}
                                    description="Average resume count"
                                    color="blue"
                                />
                                <InsightCard
                                    label="Growth Trend"
                                    value={stats?.growthRate > 0 ? 'Positive' : 'Negative'}
                                    description={`${Math.abs(stats?.growthRate || 0)}% this week`}
                                    color={stats?.growthRate > 0 ? 'green' : 'red'}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Profile Modal */}
            {showUserModal && selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    resumes={userResumes}
                    onClose={() => {
                        setShowUserModal(false)
                        setSelectedUser(null)
                        setUserResumes([])
                    }}
                    onToggleStatus={handleToggleUserStatus}
                    onRoleChange={handleRoleChange}
                    onDeleteUser={handleDeleteUser}
                />
            )}
        </div>
    )
}

// Animated Stat Card Component
function AnimatedStatCard({ title, value, icon: Icon, color, trend, suffix = '', subtitle }) {
    const [displayValue, setDisplayValue] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0
        let start = 0
        const duration = 1000
        const increment = numValue / (duration / 16)

        const timer = setInterval(() => {
            start += increment
            if (start >= numValue) {
                setDisplayValue(numValue)
                clearInterval(timer)
            } else {
                setDisplayValue(Math.floor(start))
            }
        }, 16)

        return () => clearInterval(timer)
    }, [value])

    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
    }

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-300 cursor-pointer ${isHovered ? 'transform scale-105 shadow-2xl' : ''
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {displayValue}{suffix}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trend === 'up' ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                            <span className="text-xs font-medium">
                                {trend === 'up' ? 'Increasing' : 'Decreasing'}
                            </span>
                        </div>
                    )}
                </div>
                <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-xl transition-transform duration-300 ${isHovered ? 'rotate-12' : ''
                    }`}>
                    <Icon className="h-8 w-8 text-white" />
                </div>
            </div>
        </div>
    )
}

// User Row Component
function UserRow({ user, index, onRoleChange, onToggleStatus, onViewUser, onDeleteUser }) {
    return (
        <tr
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium text-gray-900">{user.name || 'Anonymous'}</span>
                </div>
            </td>
            <td className="py-4 px-4 text-gray-600">{user.email}</td>
            <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                    {user.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {user.role}
                </span>
            </td>
            <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {user.isActive ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                    {user.isActive ? 'Active' : 'Disabled'}
                </span>
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onViewUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Profile"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onToggleStatus(user._id, user.isActive)}
                        className={`p-2 rounded-lg transition-colors ${user.isActive
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                        title={user.isActive ? 'Disable User' : 'Enable User'}
                    >
                        {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                </div>
            </td>
        </tr>
    )
}

// User Profile Modal Component
function UserProfileModal({ user, resumes, onClose, onToggleStatus, onRoleChange, onDeleteUser }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">User Profile</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{user.name || 'Anonymous'}</h3>
                            <p className="text-purple-100">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-900 text-purple-100' : 'bg-blue-900 text-blue-100'
                                    }`}>
                                    {user.role}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'
                                    }`}>
                                    {user.isActive ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* User Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm font-medium">Email</span>
                            </div>
                            <p className="text-gray-900 font-semibold">{user.email}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">Joined</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                                {new Date(user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-sm font-medium">Subscription</span>
                            </div>
                            <p className="text-gray-900 font-semibold">{user.subscriptionTier || 'FREE'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Total Resumes</span>
                            </div>
                            <p className="text-gray-900 font-semibold">{resumes.length}</p>
                        </div>
                    </div>

                    {/* User Resumes */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">User Resumes</h3>
                        {resumes.length > 0 ? (
                            <div className="space-y-3">
                                {resumes.map((resume) => (
                                    <div key={resume._id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{resume.title}</h4>
                                                <p className="text-sm text-gray-600">
                                                    Created: {new Date(resume.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <FileText className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No resumes created yet</p>
                        )}
                    </div>
                </div>

                {/* Modal Footer - Admin Actions */}
                <div className="border-t p-6 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Admin Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        {user.role === 'USER' ? (
                            <button
                                onClick={() => {
                                    onRoleChange(user._id, 'ADMIN')
                                    onClose()
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Promote to Admin
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    onRoleChange(user._id, 'USER')
                                    onClose()
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <Shield className="w-4 h-4" />
                                Demote to User
                            </button>
                        )}
                        <button
                            onClick={() => {
                                onToggleStatus(user._id, user.isActive)
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${user.isActive
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {user.isActive ? (
                                <>
                                    <Ban className="w-4 h-4" />
                                    Disable User
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Enable User
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                onDeleteUser(user._id)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Subscription Bar Component
function SubscriptionBar({ tier, count, total, index }) {
    const percentage = (count / total) * 100

    const tierColors = {
        FREE: 'bg-gray-400',
        PRO: 'bg-blue-500',
        BUSINESS: 'bg-purple-600',
    }

    return (
        <div
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">{tier}</span>
                <span className="text-sm text-gray-600">{count} users ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                    className={`h-full ${tierColors[tier] || 'bg-gray-400'} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

// Insight Card Component
function InsightCard({ label, value, description, color }) {
    const colorClasses = {
        purple: 'text-purple-600 bg-purple-50',
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        red: 'text-red-600 bg-red-50',
    }

    return (
        <div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${colorClasses[color]}`}>
                    {value}
                </span>
            </div>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    )
}
