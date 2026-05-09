import React, { useState, useContext } from 'react'
import axios from 'axios'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
    Layout, Menu, Button, Badge, Avatar, Tooltip, ConfigProvider, Typography
} from 'antd'
import { 
    LayoutDashboard, Layout as LucideLayout, ShoppingBag, Heart, MessageSquare, 
    UserCircle, MapPin, Bell, Settings, LogOut, Menu as MenuIcon,
    ChevronRight, Zap, Headphones, Globe, ShoppingCart
} from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { CartContext } from '../context/CartContext'
import { WishlistContext } from '../context/WishlistContext'
import { NotificationContext } from '../context/NotificationContext'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const getMediaUrl = (pathValue) => {
    if (!pathValue) return null;
    const pathStr = String(pathValue);
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    const filename = pathStr.split(/[\\/]/).pop();
    return `${backendUrl}/uploads/${filename}?t=${Date.now()}`;
};

const UserLayout = ({ children }) => {
    const { user, logout } = useContext(AuthContext)
    const { items: cartItems } = useContext(CartContext)
    const { items: wishlistItems } = useContext(WishlistContext)
    const { unreadCount } = useContext(NotificationContext)
    const [collapsed, setCollapsed] = useState(false)
    const [orderCount, setOrderCount] = useState(0)
    const [reviewCount, setReviewCount] = useState(0)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)
    const navigate = useNavigate()
    const location = useLocation()

    React.useEffect(() => {
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

        if (!user) return
        const fetchCounts = async () => {
            try {
                const token = localStorage.getItem('token')
                const headers = { headers: { Authorization: `Bearer ${token}` } }
                
                const [ordersRes, reviewsRes] = await Promise.all([
                    axios.get('/api/v1/orders/user', headers),
                    axios.get('/api/v1/reviews/my', headers)
                ])
                
                const activeOrders = (ordersRes.data.data || []).filter(o => 
                    !['delivered', 'completed', 'cancelled_by_customer', 'cancelled_by_seller', 'returned', 'refunded'].includes(o.status)
                ).length
                setOrderCount(activeOrders)

                // Total reviews written
                const totalReviews = (reviewsRes.data.data || []).length
                setReviewCount(totalReviews)
            } catch (err) {
                console.error("Layout fetch error:", err)
            }
        }
        fetchCounts()
        const interval = setInterval(fetchCounts, 60000)
        return () => {
            clearInterval(interval)
            window.removeEventListener('resize', handleResize)
        }
    }, [user])

    const menuItems = [
        { key: '/customer/dashboard', icon: LayoutDashboard ? <LayoutDashboard size={20} /> : (LucideLayout ? <LucideLayout size={20} /> : <ShoppingBag size={20} />), label: 'Overview' },
        { 
            key: '/customer/orders', 
            icon: <ShoppingBag size={20} />, 
            label: (
                <div className="flex justify-between items-center w-full">
                    <span>My Orders</span>
                    {!collapsed && orderCount > 0 && (
                        <Badge count={orderCount} size="small" />
                    )}
                </div>
            )
        },
        { 
            key: '/customer/wishlist', 
            icon: <Heart size={20} />, 
            label: (
                <div className="flex justify-between items-center w-full">
                    <span>Wishlist</span>
                    {!collapsed && wishlistItems.length > 0 && (
                        <Badge count={wishlistItems.length} size="small" />
                    )}
                </div>
            )
        },
        { 
            key: '/customer/reviews', 
            icon: <MessageSquare size={20} />, 
            label: (
                <div className="flex justify-between items-center w-full">
                    <span>My Reviews</span>
                    {!collapsed && reviewCount > 0 && (
                        <Badge count={reviewCount} size="small" style={{ backgroundColor: '#94A3B8' }} />
                    )}
                </div>
            )
        },
        { type: 'divider' },
        { key: '/customer/profile', icon: <UserCircle size={20} />, label: 'Profile Settings' },
        { 
            key: '/customer/notifications', 
            icon: <Bell size={20} />, 
            label: (
                <div className="flex justify-between items-center w-full">
                    <span>Notifications</span>
                    {!collapsed && unreadCount > 0 && (
                        <Badge count={unreadCount} size="small" />
                    )}
                </div>
            )
        },
    ]

    const getTitle = () => {
        const p = location.pathname
        if (p === '/customer/dashboard') return <>Dashboard <span className="text-coral">Overview</span></>
        if (p === '/customer/orders') return <>My <span className="text-coral">Orders</span></>
        if (p.startsWith('/customer/orders/')) return <>Order <span className="text-coral">Details</span></>
        if (p.startsWith('/customer/track')) return <>Track <span className="text-coral">Order</span></>
        if (p === '/customer/wishlist') return <>My <span className="text-coral">Wishlist</span></>
        if (p === '/customer/reviews') return <>My <span className="text-coral">Reviews</span></>
        if (p === '/customer/profile') return <>Account <span className="text-coral">Profile</span></>
        if (p === '/customer/notifications') return <>User <span className="text-coral">Notifications</span></>
        return <>User <span className="text-coral">Dashboard</span></>
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#FF6B6B',
                    borderRadius: 16,
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
                    },
                },
            }}
        >
            <Layout className="min-h-screen bg-[#FAFAFA]">
                {/* Sidebar */}
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    breakpoint="lg"
                    collapsedWidth={windowWidth < 1024 ? 0 : 80}
                    width={280}
                    theme="light"
                    style={{
                        overflow: 'hidden',
                        height: '100vh',
                        position: 'fixed',
                        left: 0, top: 0, bottom: 0,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '10px 0 30px rgba(0,0,0,0.02)',
                        transition: 'all 0.3s'
                    }}
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

                        <div className="px-4 py-6 border-t border-gray-100 bg-white shrink-0">
                            <div className={`flex items-center gap-4 bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm transition-all duration-300 ${collapsed ? 'justify-center p-2' : ''}`}>
                                <div className="w-12 h-12 rounded-full bg-[#FF6B6B] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                                    {user?.picture ? (
                                        <img 
                                            src={getMediaUrl(user.picture)} 
                                            alt="User" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div 
                                        className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                                        style={{ display: user?.picture ? 'none' : 'flex' }}
                                    >
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                {!collapsed && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#1E293B] m-0 truncate leading-tight">{user?.name}</p>
                                        <p className="text-[9px] font-black text-[#94A3B8] m-0 uppercase tracking-[0.1em] mt-0.5">User Account</p>
                                    </div>
                                )}
                                {!collapsed && (
                                    <Tooltip title="Logout">
                                        <Button 
                                            type="text" 
                                            icon={<LogOut size={20} className="text-[#1E293B] hover:text-[#FF6B6B]" />} 
                                            onClick={logout}
                                            className="p-0 flex items-center justify-center hover:bg-transparent"
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </div>
                </Sider>

                <Layout style={{ 
                    marginLeft: collapsed ? (windowWidth < 1024 ? 0 : 80) : (windowWidth < 1024 ? 0 : 280), 
                    transition: 'all 0.3s',
                    minHeight: '100vh',
                    width: '100%',
                    overflow: 'hidden'
                }}>
                    <Header className="glass-panel sticky top-2 md:top-4 z-40 mx-2 md:mx-6 mt-2 md:mt-4 rounded-2xl md:rounded-[16px] px-4 md:px-8 flex justify-between items-center border-none h-[64px] md:h-[74px] shadow-lg shadow-black/5 relative">
                        <div className="z-10 flex items-center">
                            <Button
                                type="text"
                                icon={<MenuIcon size={20} />}
                                onClick={() => setCollapsed(!collapsed)}
                                className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center transition-all"
                            />
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 hidden xl:flex items-center h-full pointer-events-none">
                            <Title level={4} className="m-0 font-black text-gray-900 tracking-[0.1em] uppercase text-sm md:text-base flex items-center gap-3 justify-center text-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                                User <span className="text-coral">Dashboard</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                            </Title>
                        </div>

                        <div className="flex items-center gap-2 z-10 h-full">
                            <Tooltip title="Cart">
                                <Link to="/cart">
                                    <Badge count={cartItems.length} size="small" offset={[-2, 2]} color="#FF6B6B">
                                        <Button 
                                            shape="circle" 
                                            type="text" 
                                            icon={<ShoppingCart size={20} />} 
                                            className="text-gray-500 hover:bg-gray-100/50 h-11 w-11 flex items-center justify-center transition-all" 
                                        />
                                    </Badge>
                                </Link>
                            </Tooltip>
                            
                            <Tooltip title="Wishlist">
                                <Link to="/customer/wishlist">
                                    <Badge count={wishlistItems.length} size="small" offset={[-2, 2]} color="#FF6B6B">
                                        <Button 
                                            shape="circle" 
                                            type="text" 
                                            icon={<Heart size={20} />} 
                                            className="text-gray-500 hover:bg-gray-100/50 h-11 w-11 flex items-center justify-center transition-all" 
                                        />
                                    </Badge>
                                </Link>
                            </Tooltip>
                            <Tooltip title="Notifications">
                                <Link to="/customer/notifications" className="relative">
                                    <Button 
                                        shape="circle" 
                                        type="text" 
                                        icon={<Bell size={20} />} 
                                        className="text-gray-500 hover:bg-gray-100/50 h-11 w-11 flex items-center justify-center transition-all" 
                                    />
                                    {unreadCount > 0 && (
                                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-coral rounded-full border-2 border-white shadow-sm pointer-events-none" />
                                    )}
                                </Link>
                            </Tooltip>
                            <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden sm:block" />
                            <Tooltip title="Account Settings">
                                <Avatar 
                                    src={getMediaUrl(user?.picture)}
                                    className="bg-coral border-2 border-white shadow-sm font-bold shrink-0 cursor-pointer"
                                    onClick={() => navigate('/customer/profile')}
                                >
                                    {user?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                            </Tooltip>
                        </div>
                    </Header>

                    <Content className="p-4 md:p-8">
                        <div className="max-w-[1400px] mx-auto">
                            {location.pathname !== '/customer/profile' && (
                                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Title level={2} className="m-0 font-black text-gray-900 tracking-[0.05em] uppercase">
                                        {getTitle()}
                                    </Title>
                                    <Text className="text-gray-400 font-medium mt-1 block">
                                        Welcome back, {user?.name}. Manage your orders, wishlist and profile settings.
                                    </Text>
                                </div>
                            )}
                            <div className="animate-in fade-in duration-700">
                                {children}
                            </div>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    )
}

export default UserLayout
