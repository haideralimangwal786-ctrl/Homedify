import React, { useState, useEffect, useContext } from 'react'
import UserLayout from '../shared/UserLayout'
import { Bell, Package, Tag, Star, CheckCheck, AlertCircle, CreditCard, Trash2 } from 'lucide-react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { NotificationContext } from '../context/NotificationContext'
import { toast } from 'react-hot-toast'

const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    
    if (pathStr.includes('uploads')) {
        const uploadsIndex = pathStr.indexOf('uploads');
        return `${backendUrl}/${pathStr.substring(uploadsIndex)}`;
    }
    
    const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    return `${backendUrl}/uploads${normalizedPath}`;
}

const typeConfig = {
    order: { icon: Package, color: 'bg-[#FC6A6B]/10 text-[#FC6A6B]', label: 'Order' },
    payment: { icon: CreditCard, color: 'bg-green-50 text-green-600', label: 'Payment' },
    review: { icon: Star, color: 'bg-yellow-50 text-yellow-500', label: 'Review' },
    verification: { icon: CheckCheck, color: 'bg-purple-50 text-purple-500', label: 'Verification' },
    system: { icon: Bell, color: 'bg-slate-50 text-slate-500', label: 'System' }
}

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins || 1} min${mins !== 1 ? 's' : ''} ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`
    const days = Math.floor(hrs / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
}

const NotificationItem = ({ notif, onRead, onDelete }) => {
    const cfg = typeConfig[notif.type] || typeConfig.system
    const Icon = cfg.icon
    return (
        <div
            className={`relative mb-4 group max-w-[90%] md:max-w-[70%] ${!notif.is_read ? 'mr-auto' : 'mr-auto opacity-80'}`}
        >
            <div 
                className={`p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#EEEEEE] transition-all hover:shadow-md cursor-pointer ${!notif.is_read ? 'bg-white' : 'bg-slate-50'}`}
                onClick={() => !notif.is_read && onRead(notif._id)}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${cfg.color}`}>
                            <Icon size={12} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cfg.label}</span>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notif._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-md transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                
                <p className={`text-sm leading-relaxed mb-4 ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                    {notif.message}
                </p>

                {notif.image && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <img 
                            src={getMediaUrl(notif.image)} 
                            alt="Notification attachment" 
                            className="w-full h-auto max-h-60 object-contain hover:scale-[1.02] transition-transform cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(getMediaUrl(notif.image), '_blank');
                            }}
                        />
                    </div>
                )}

                <div className="flex justify-end items-center gap-2">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-tight">
                        {timeAgo(notif.createdAt)}
                    </p>
                    {!notif.is_read && <CheckCheck size={12} className="text-coral" />}
                </div>
            </div>
            {!notif.is_read && (
                <div className="absolute -left-1 top-0 w-3 h-3 bg-white border-l border-t border-[#EEEEEE] -rotate-45" />
            )}
        </div>
    )
}

const UserNotifications = () => {
    const { token } = useContext(AuthContext)
    const { refresh } = useContext(NotificationContext)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const headers = { Authorization: `Bearer ${token}` }

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/v1/notifications', { headers })
            setNotifications(res.data.data || [])
            setUnreadCount(res.data.unreadCount || 0)
        } catch (err) {
            setError('Failed to load notifications. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchNotifications() }, [])

    const handleRead = async (id) => {
        try {
            await axios.put(`/api/v1/notifications/${id}/read`, {}, { headers })
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            refresh() // Update global count
        } catch { }
    }

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/v1/notifications/${id}`, { headers })
            setNotifications(prev => prev.filter(n => n._id !== id))
            const deletedNotif = notifications.find(n => n._id === id)
            if (deletedNotif && !deletedNotif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
            refresh() // Update global count
            toast.success('Notification deleted')
        } catch {
            toast.error('Failed to delete notification')
        }
    }

    const handleReadAll = async () => {
        try {
            await axios.put('/api/v1/notifications/read-all', {}, { headers })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
            refresh() // Update global count
        } catch { }
    }

    return (
        <UserLayout>
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="bg-coral text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3 p-6 bg-rose-50 rounded-2xl text-rose-600">
                        <AlertCircle size={20} />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-24 text-center">
                        <Bell className="mx-auto text-slate-100 mb-6" size={56} />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No Notifications Yet</h3>
                        <p className="text-slate-400 font-medium">You're all caught up! New notifications will appear here.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map(notif => (
                            <NotificationItem 
                                key={notif._id} 
                                notif={notif} 
                                onRead={handleRead} 
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    )
}

export default UserNotifications
