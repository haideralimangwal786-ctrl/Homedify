import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { NotificationContext } from '../context/NotificationContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout, Menu, Card, Table, Tag, Badge, Button, Row, Col, Space,
  Typography, ConfigProvider, theme, Avatar, Tooltip, Divider
} from 'antd'
import {
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Wallet, Store,
  DollarSign, Clock, Box, ShieldCheck, LogOut, Menu as MenuIcon,
  ChevronRight, AlertCircle, ExternalLink, TrendingUp, CheckCircle, User
} from 'lucide-react'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'
import { Bell, Sparkles } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { calculatePayout } from '../utils/financialUtils'
import toast from 'react-hot-toast'
import SellerSidebarProfile from '../components/SellerSidebarProfile'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const SellerDashboard = () => {
  const { token, user, logout } = useContext(AuthContext)
  const { unreadCount: globalUnread } = useContext(NotificationContext)
  const { commissionRate } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [stats, setStats] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    totalRevenue: 0,
    totalPayout: 0,
    pendingRevenue: 0
  })
  const [seller, setSeller] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    
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
    
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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
  };

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        const [prodRes, orderRes, sellerRes, paymentRes] = await Promise.all([
          axios.get('/api/v1/products/seller', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/orders/seller', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/sellers/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/payments/seller', { headers: { Authorization: `Bearer ${token}` } })
        ])

        // Correctly handle direct array response from /api/v1/products/seller
        const products = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || [])
        const orders = orderRes.data.data || []
        const sellerData = sellerRes.data.data
        const paymentData = paymentRes.data.balances || { available: 0, pending: 0, total: 0 }

        setSeller(sellerData)

        const pendingRev = paymentData.pending || 0
        const released = paymentData.available || 0
        const totalRev = paymentData.total || 0
        const totalPayoutReceived = orders
          .filter(o => o.paymentStatus === 'paid_to_seller' || o.paymentStatus === 'released')
          .reduce((sum, o) => sum + (o.sellerPayable || (o.total * ((100 - (commissionRate || 10)) / 100))), 0)

        const approved = products.filter(p => p.status === 'active' || p.status === 'approved').length
        const pendingProd = products.filter(p => p.status === 'pending_approval' || p.status === 'pending').length
        const pending = orders.filter(o => ['confirmed', 'seller_accepted', 'preparing'].includes(o.status)).length

        setStats({
          totalProducts: products.length,
          approvedProducts: approved,
          pendingProducts: pendingProd,
          totalOrders: orders.length,
          pendingOrders: pending,
          totalEarnings: released,
          totalRevenue: totalRev,
          totalPayout: totalPayoutReceived,
          pendingRevenue: pendingRev
        })
        setRecentOrders(orders.slice(0, 5))

      } catch (err) {
        console.error("Dashboard fetch error:", err)
        // Only show toast on first load to avoid spamming on periodic refreshes
        if (loading) toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    // Periodic refresh every 30 seconds for dynamic updates
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [token, loading, commissionRate])

  const isVerified = seller?.verificationStatus === 'approved'

  const menuItems = [
    {
      key: '/seller/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard Overview',
    },
    {
      key: '/seller/products',
      icon: <Package size={20} />,
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Product Management</span>
          {!collapsed && stats.pendingProducts > 0 && (
            <Badge count={stats.pendingProducts} size="small" style={{ backgroundColor: '#FF6B6B' }} />
          )}
          {!collapsed && stats.pendingProducts === 0 && stats.totalProducts > 0 && (
            <Badge count={stats.totalProducts} size="small" style={{ backgroundColor: '#94A3B8' }} />
          )}
        </div>
      ),
      disabled: !isVerified
    },
    {
      key: '/seller/add-product',
      icon: <PlusCircle size={20} />,
      label: 'Add New Product',
      disabled: !isVerified
    },
    {
      key: '/seller/orders',
      icon: <ShoppingCart size={20} />,
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Orders & Tracking</span>
          {!collapsed && stats.pendingOrders > 0 && (
            <Badge count={stats.pendingOrders} size="small" />
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
    {
      key: '/seller/earnings',
      icon: <Wallet size={20} />,
      label: 'Wallet & Earnings',
    },
    { key: '/seller/profile', icon: <Store size={20} />, label: 'Shop Profile' }
  ]

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Text strong>#{id.substring(0, 8)}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => {
        const amt = record.total || record.amount || record.orderItems?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0
        return (
          <div className="flex flex-col text-right">
            <span className="font-black text-emerald-500 text-sm">Rs. {(record.sellerPayable || (amt * ((100 - (commissionRate || 10)) / 100))).toLocaleString()}</span>
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Net Earnings</span>
          </div>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold'
        let label = status.replace(/_/g, ' ')
        if (status === 'delivered' || status === 'completed') color = '#52c41a' // Green
        if (status === 'shipped') color = '#1890ff' // Blue
        if (status === 'cancelled_by_customer' || status === 'cancelled_by_seller') color = '#FF4D4F' // Red
        if (status === 'confirmed' || status === 'seller_accepted') color = '#13c2c2' // Cyan

        return (
          <Tag color={color} className="rounded-full px-3 py-0.5 border-none font-semibold capitalize text-[10px]">
            {label}
          </Tag>
        )
      }
    },
  ]

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
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: '0 10px 40px rgba(0,0,0,0.03)',
          },
          Table: {
            headerBg: '#FAFAFA',
            headerColor: '#8C8C8C',
            headerBorderRadius: 10,
          }
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
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s',
            boxShadow: collapsed && windowWidth < 1024 ? 'none' : '10px 0 30px rgba(0,0,0,0.02)'
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
          <Header className="glass-panel sticky top-2 md:top-4 z-40 mx-2 md:mx-6 mt-2 md:mt-4 rounded-2xl md:rounded-[24px] px-4 md:px-8 flex justify-between items-center border-none h-[64px] md:h-[74px] shadow-lg shadow-black/5 relative">
            {/* Left: Menu Toggle */}
            <div className="z-10">
              <Button
                type="text"
                icon={<MenuIcon size={20} />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center transition-all"
              />
            </div>

            {/* Center: Seller Dashboard Title */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden xl:block pointer-events-none">
              <Title level={4} className="m-0 font-black text-gray-900 tracking-[0.1em] uppercase text-sm md:text-base flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                Seller <span className="text-coral">Dashboard</span>
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              </Title>
            </div>

            {/* Right: Actions */}
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
            <div className="max-w-[1200px] mx-auto">
              <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Title level={2} className="m-0 font-black text-gray-900 tracking-[0.05em] uppercase text-xl md:text-3xl">Seller <span className="text-coral">Overview</span></Title>
                <Text type="secondary" className="font-medium text-xs md:text-sm">Manage your shop, track sales, and grow your business.</Text>
              </div>

              {/* Restricted Access Banner */}
              {!isVerified && (
                <div className="mb-8 bg-gradient-to-r from-coral/10 to-transparent p-6 rounded-2xl border border-coral/20 flex flex-col md:flex-row items-center gap-6 animate-pulse">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <ShieldCheck size={32} className="text-coral" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-gray-900 mb-1">Account Under Review</h3>
                    <p className="text-gray-600 font-medium max-w-lg">Your dashboard functionality is currently limited. Complete your profile verification to unlock all features and start selling.</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <Row gutter={[24, 24]} className="mb-8">
                {/* 1. Total Products */}
                <Col xs={24} sm={12} lg={6}>
                  <Card loading={loading} className="border-none shadow-sm bg-indigo-50/50 hover:shadow-md transition-all h-full group border border-indigo-100/50">
                    <div className="flex flex-col gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Box size={24} className="text-indigo-500" />
                      </div>
                      <div>
                        <Text type="secondary" className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Total Products</Text>
                        <Title level={3} className="m-0 font-black text-indigo-900 mt-1">
                          {stats.totalProducts}
                        </Title>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* 2. Pending Orders */}
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    loading={loading}
                    className={`border-none shadow-sm transition-all h-full group ${stats.pendingOrders > 0 ? 'animate-border-red' : 'animate-border-green'}`}
                  >
                    <div className="flex flex-col gap-4 relative z-10">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Clock size={24} className={stats.pendingOrders > 0 ? 'text-coral' : 'text-green-500'} />
                      </div>
                      <div>
                        <Text type="secondary" className={`text-[10px] font-black tracking-widest uppercase ${stats.pendingOrders > 0 ? 'text-coral/60' : 'text-green-500/60'}`}>Pending Orders</Text>
                        <Title level={3} className="m-0 font-black text-gray-900 mt-1">
                          {stats.pendingOrders}
                        </Title>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* 3. Total Payout */}
                <Col xs={24} sm={12} lg={6}>
                  <Card loading={loading} className="border-none shadow-sm bg-emerald-50/50 hover:shadow-md transition-all h-full group border border-emerald-100/50">
                    <div className="flex flex-col gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <CheckCircle size={24} className="text-emerald-500" />
                      </div>
                      <div>
                        <Text type="secondary" className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">Total Payouts</Text>
                        <Title level={3} className="m-0 font-black text-emerald-900 mt-1">
                          Rs. {stats.totalPayout.toLocaleString()}
                        </Title>
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* 4. Profile Status */}
                <Col xs={24} sm={12} lg={6}>
                  <Card loading={loading} className={`border-none shadow-sm transition-all h-full group border ${isVerified ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-amber-50/50 border-amber-100/50'}`}>
                    <div className="flex flex-col gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} className={isVerified ? 'text-emerald-500' : 'text-amber-500'} />
                      </div>
                      <div>
                        <Text type="secondary" className={`text-[10px] font-black tracking-widest uppercase ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>Profile Status</Text>
                        <div className="mt-1">
                          <Tag 
                            color={isVerified ? 'success' : 'orange'} 
                            className="m-0 border-none px-3 py-1 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm"
                            icon={isVerified ? <CheckCircle size={10} /> : <Clock size={10} />}
                          >
                            {isVerified ? 'Verified' : 'Pending'}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Main Content Area */}
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <Card
                    title={<span className="text-lg font-black text-gray-900">Recent Orders</span>}
                    extra={<Link to="/seller/orders" className="text-coral font-bold hover:underline">View All</Link>}
                    className="border-none shadow-sm"
                    styles={{ body: { padding: 0 } }}
                  >
                    <Table
                      columns={columns}
                      dataSource={recentOrders}
                      pagination={false}
                      loading={loading}
                      rowKey="_id"
                      className="seller-table"
                      scroll={{ x: 600 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card
                    title={<span className="text-lg font-black text-gray-900">Quick Growth</span>}
                    className="border-none shadow-sm h-full"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/seller/products')}>
                        <div className="w-10 h-10 bg-[#FC6A6B]/10 text-[#FC6A6B] rounded-xl flex items-center justify-center group-hover:bg-[#FC6A6B] group-hover:text-white transition-all">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <p className="m-0 font-bold text-gray-900">Optimize Listings</p>
                          <p className="m-0 text-xs text-gray-500">Boost visibility with high-res photos</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/seller/profile')}>
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                          <Store size={20} />
                        </div>
                        <div>
                          <p className="m-0 font-bold text-gray-900">Brand Identity</p>
                          <p className="m-0 text-xs text-gray-500">Update your store banner & logo</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/seller/earnings')}>
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all">
                          <Wallet size={20} />
                        </div>
                        <div>
                          <p className="m-0 font-bold text-gray-900">Payout Schedules</p>
                          <Tag color="default" className="m-0 rounded-full px-2 py-0.5 border-none font-bold text-[9px] bg-gray-50 text-gray-400">
                            -{commissionRate || 10}% FEE
                          </Tag>
                          <p className="m-0 text-xs text-gray-500">Manage your bank details & history</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="bg-coral/5 p-4 rounded-2xl border border-coral/10">
                          <div className="flex items-center justify-between mb-2">
                            <Text strong className="text-coral">Seller Support</Text>
                            <ExternalLink size={14} className="text-coral" />
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed m-0">Need help with your store? Our dedicated support team is available 24/7 for our community of craftspersons.</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default SellerDashboard
