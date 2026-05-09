import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { NotificationContext } from '../context/NotificationContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Layout, Menu, Card, Tag, Badge, Button, Row, Col, Space,
  Typography, ConfigProvider, Avatar, Tooltip, Empty, Divider
} from 'antd'
import {
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Wallet, Store,
  LogOut, Menu as MenuIcon, Bell, Trash2, CheckCheck, CreditCard, Star,
  AlertCircle, ChevronRight, User
} from 'lucide-react'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'
import toast from 'react-hot-toast'
import SellerSidebarProfile from '../components/SellerSidebarProfile'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

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

const NotificationItem = ({ notif, onRead, onDelete, getMediaUrl }) => {
    const cfg = typeConfig[notif.type] || typeConfig.system
    const Icon = cfg.icon
    return (
        <div
            className={`relative mb-6 group max-w-[95%] md:max-w-[85%] ${!notif.is_read ? 'mr-auto' : 'mr-auto opacity-80'}`}
        >
            <div 
                className={`p-5 rounded-2xl rounded-tl-none shadow-sm border border-[#EEEEEE] transition-all hover:shadow-md cursor-pointer ${!notif.is_read ? 'bg-white' : 'bg-slate-50'}`}
                onClick={() => !notif.is_read && onRead(notif._id)}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-2xl flex items-center justify-center ${cfg.color} shadow-sm`}>
                            <Icon size={14} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cfg.label}</span>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notif._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <p className={`text-sm leading-relaxed mb-4 ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                    {notif.message}
                </p>

                {notif.image && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                        <img 
                            src={getMediaUrl(notif.image)} 
                            alt="Notification attachment" 
                            className="w-full h-auto max-h-72 object-contain hover:scale-[1.01] transition-transform cursor-pointer"
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
                    {!notif.is_read && <CheckCheck size={14} className="text-coral" />}
                </div>
            </div>
            {!notif.is_read && (
                <div className="absolute -left-1 top-0 w-3 h-3 bg-white border-l border-t border-[#EEEEEE] -rotate-45" />
            )}
        </div>
    )
}

const SellerNotifications = () => {
  const { token, user, logout } = useContext(AuthContext)
  const { refresh, unreadCount: globalUnread } = useContext(NotificationContext)
  const navigate = useNavigate()
  const location = useLocation()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [seller, setSeller] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ totalProducts: 0 })
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    
    // If the path already contains 'uploads', just ensure it has a leading slash
    if (pathStr.includes('uploads')) {
        const uploadsIndex = pathStr.indexOf('uploads');
        return `${backendUrl}/${pathStr.substring(uploadsIndex)}`;
    }
    
    // Otherwise, assume it's a file in the uploads directory
    const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    return `${backendUrl}/uploads${normalizedPath}`;
  };

  useEffect(() => {
    // Auto collapse sidebar on mobile
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)

    if (!token) return
    loadData()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [token])

  const loadData = async () => {
    setLoading(true)
    try {
      const [notifRes, sellerRes] = await Promise.all([
        axios.get('/api/v1/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/sellers/me', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setNotifications(notifRes.data.data || [])
      setUnreadCount(notifRes.data.unreadCount || 0)
      setSeller(sellerRes.data.data)
      const [orderRes, prodRes] = await Promise.all([
        axios.get('/api/v1/orders/seller', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/products/seller', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setOrders(orderRes.data.data || [])
      const products = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || [])
      setStats({ totalProducts: products.length })
    } catch (err) {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleRead = async (id) => {
    try {
      await axios.put(`/api/v1/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      refresh()
    } catch { }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/v1/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setNotifications(prev => prev.filter(n => n._id !== id))
      toast.success('Notification deleted')
      refresh()
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const handleReadAll = async () => {
    try {
      await axios.put('/api/v1/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      refresh()
      toast.success('All marked as read')
    } catch { }
  }

  const isVerified = seller?.verificationStatus === 'approved'

  const menuItems = [
    { key: '/seller/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard Overview' },
    { 
      key: '/seller/products', 
      icon: <Package size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Product Management</span>
          {!collapsed && stats.totalProducts > 0 && (
            <Badge count={stats.totalProducts} size="small" style={{ backgroundColor: '#94A3B8' }} />
          )}
        </div>
      ),
      disabled: !isVerified 
    },
    { key: '/seller/add-product', icon: <PlusCircle size={20} />, label: 'Add New Product', disabled: !isVerified },
    { 
      key: '/seller/orders', 
      icon: <ShoppingCart size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Orders & Tracking</span>
          {!collapsed && orders.filter(o => ['confirmed', 'seller_accepted', 'preparing'].includes(o.status)).length > 0 && (
            <Badge count={orders.filter(o => ['confirmed', 'seller_accepted', 'preparing'].includes(o.status)).length} size="small" />
          )}
        </div>
      )
    },
    { 
      key: '/seller/notifications', 
      icon: <Bell size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Notifications</span>
          {!collapsed && globalUnread > 0 && (
            <Badge count={globalUnread} size="small" />
          )}
        </div>
      )
    },
    { key: '/seller/earnings', icon: <Wallet size={20} />, label: 'Wallet & Earnings' },
    { key: '/seller/profile', icon: <Store size={20} />, label: 'Store Profile' }
  ]

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B6B',
          borderRadius: 12,
          fontFamily: 'Outfit, Inter, system-ui, sans-serif',
        },
        components: {
          Button: {
            colorPrimary: '#FF6B6B',
            colorPrimaryHover: '#FF5252',
            controlHeight: 44,
            fontWeight: 700,
            borderRadius: 10,
          },
          Menu: {
            itemSelectedBg: '#FFEBEE',
            itemSelectedColor: '#FF6B6B',
            itemHoverBg: '#FAFAFA',
            itemBorderRadius: 8,
          }
        },
      }}
    >
      <Layout className="min-h-screen bg-[#FAFAFA]">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          theme="light"
          style={{
            overflow: 'hidden',
            height: '100vh',
            position: 'fixed',
            left: 0, top: 0, bottom: 0,
            zIndex: 1000,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s',
            boxShadow: collapsed && windowWidth < 1024 ? 'none' : '10px 0 30px rgba(0,0,0,0.02)'
          }}
          collapsedWidth={windowWidth < 1024 ? 0 : 80}
          className="border-none"
        >
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-center mb-4 shrink-0 transition-all duration-300">
              <Link to="/">
                {collapsed ? (
                  <img src={favicon} alt="H" className="h-8 w-8 object-contain animate-in zoom-in-95" />
                ) : (
                  <img src={logo} alt="Homedify" className="h-12 transition-all duration-300 animate-in fade-in" />
                )}
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                className="border-none px-3"
              />
            </div>
            <SellerSidebarProfile collapsed={collapsed} seller={seller} />
          </div>
        </Sider>

        <Layout style={{ 
          marginLeft: collapsed ? (windowWidth < 1024 ? 0 : 80) : (windowWidth < 1024 ? 0 : 280), 
          transition: 'all 0.3s',
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Header className="glass-panel sticky top-2 md:top-4 z-40 mx-2 md:mx-6 mt-2 md:mt-4 rounded-xl md:rounded-[16px] px-4 md:px-8 flex justify-between items-center border-none h-[64px] md:h-[74px] shadow-lg shadow-black/5 relative">
            <div className="z-10">
              <Button
                type="text"
                icon={<MenuIcon size={20} />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center transition-all"
              />
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 hidden xl:block pointer-events-none">
              <Title level={4} className="m-0 font-black text-gray-900 tracking-[0.1em] uppercase text-sm md:text-base flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                Seller <span className="text-coral">Notifications</span>
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              </Title>
            </div>
            
            <Space size={16} className="z-10">
              <div className="flex items-center gap-2">
                <Tooltip title="Notifications">
                  <Badge count={globalUnread} size="small" offset={[-2, 2]} color="#FF6B6B">
                    <Button
                      type="text"
                      icon={<Bell size={20} className="text-gray-400" />}
                      className="h-11 w-11 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-all"
                      onClick={() => navigate('/seller/notifications')}
                    />
                  </Badge>
                </Tooltip>

                <div className="w-px h-8 bg-gray-100 mx-2 self-center opacity-50" />

                <Tooltip title="Profile Settings">
                  <div 
                    onClick={() => navigate('/seller/profile')}
                    className="p-1 rounded-xl bg-gray-50/50 hover:bg-coral/5 transition-all cursor-pointer group"
                  >
                    <Avatar 
                      src={getMediaUrl(user?.picture)} 
                      icon={<User size={18} />} 
                      className="bg-coral text-white border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                      size={40}
                    />
                  </div>
                </Tooltip>
              </div>
            </Space>
          </Header>

          <Content className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Title level={2} className="m-0 font-black text-gray-900 tracking-[0.05em] uppercase">Notifications <span className="text-coral">Inbox</span></Title>
                <Text type="secondary" className="text-sm font-medium text-gray-400">Stay updated with orders, payments, and system alerts.</Text>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-white rounded-2xl border border-gray-50 animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-gray-50 shadow-sm">
                  <Bell className="mx-auto text-gray-100 mb-6" size={64} />
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">No Notifications</h3>
                  <p className="text-gray-400 font-medium max-w-sm mx-auto">We'll let you know when something important happens with your shop.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map(notif => (
                    <NotificationItem 
                      key={notif._id} 
                      notif={notif} 
                      onRead={handleRead} 
                      onDelete={handleDelete}
                      getMediaUrl={getMediaUrl}
                    />
                  ))}
                </div>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default SellerNotifications
