import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { NotificationContext } from '../context/NotificationContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Layout, Menu, Card, Table, Tag, Badge, Button, Row, Col, Space,
  Typography, ConfigProvider, theme, Avatar, Tooltip, Input,
  Empty, Tabs, Modal, Steps, Form, Select, Divider
} from 'antd'
import {
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Wallet, Store,
  LogOut, Menu as MenuIcon, Search, Filter, Truck, User,
  CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, MapPin, X,
  Upload, FileText, Eye, Box, DollarSign, Phone, ShieldCheck, Hash,
  Bell, Sparkles
} from 'lucide-react'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'

import toast from 'react-hot-toast'
import { useSettings } from '../context/SettingsContext'
import { calculatePayout } from '../utils/financialUtils'
import SellerSidebarProfile from '../components/SellerSidebarProfile'

const { Header, Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography

const SellerOrders = () => {
  const { token, user, logout } = useContext(AuthContext)
  const { unreadCount: globalUnread } = useContext(NotificationContext)
  const { commissionRate } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [seller, setSeller] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [stats, setStats] = useState({ totalProducts: 0 })
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Shipping Modal State
  const [isShippingModalVisible, setIsShippingModalVisible] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingReceipt, setShippingReceipt] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Cancellation State
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

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
    // Periodic refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [token])

  const loadData = async () => {
    setLoading(true)
    try {
      const [orderRes, sellerRes, prodRes] = await Promise.all([
        axios.get('/api/v1/orders/seller', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/sellers/me', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/products/seller', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setOrders(orderRes.data.data || [])
      setSeller(sellerRes.data.data)
      const products = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || [])
      setStats({ totalProducts: products.length })
    } catch (err) {
      console.error(err)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

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

  const updateStatus = async (orderId, newStatus, tracking, receiptFile) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('status', newStatus)
      if (tracking) formData.append('trackingNumber', tracking)
      if (receiptFile) formData.append('shippingReceipt', receiptFile)

      await axios.put(`/api/v1/orders/${orderId}/status`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success('Order status updated!')
      setIsShippingModalVisible(false)
      setTrackingNumber('')
      setShippingReceipt(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error("Please provide a reason")
    setIsSubmitting(true)
    try {
      await axios.put(`/api/v1/orders/${selectedOrderId}/reject`, {
        reason: cancelReason,
        cancelledBy: 'seller'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Order cancelled')
      setIsCancelModalVisible(false)
      setCancelReason('')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed')
    } finally {
      setIsSubmitting(false)
    }
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

  const filteredOrders = orders.filter(o => {
    let matchesTab = activeTab === 'all' || o.status === activeTab;
    
    // Grouped status matching
    if (activeTab === 'confirmed') {
      matchesTab = ['confirmed', 'seller_accepted'].includes(o.status);
    } else if (activeTab === 'delivered') {
      matchesTab = ['delivered', 'completed'].includes(o.status);
    } else if (activeTab === 'cancelled_by_seller') {
      matchesTab = o.status.startsWith('cancelled');
    }

    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      o.orderId?.toLowerCase().includes(searchLower) ||
      o._id?.toLowerCase().includes(searchLower) ||
      o.customerId?.name?.toLowerCase().includes(searchLower);
      
    return matchesTab && matchesSearch;
  })

  const columns = [
    {
      title: 'Order Date',
      key: 'orderDate',
      width: 140,
      render: (_, record) => (
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">
            #{record.orderId?.split('-').pop() || record._id.substring(0, 8)}
          </span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide whitespace-nowrap">
            {new Date(record.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )
    },
    {
      title: 'Product Details',
      dataIndex: 'orderItems',
      key: 'product',
      width: 250,
      render: (items, record) => (
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
            <img
              src={getMediaUrl(items?.[0]?.productImage)}
              alt="p"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
            />
          </div>
          <Tooltip
            title={
              items?.length > 1
                ? <div className="flex flex-col gap-1">{items.map((item, idx) => <span key={idx} className="text-xs">{item.quantity}x {item.productName}</span>)}</div>
                : items?.[0]?.productName
            }
            color="#1f2937"
            placement="right"
          >
            <div className="flex flex-col min-w-0 cursor-pointer hover:bg-gray-50 p-1 -ml-1 rounded-md transition-colors" onClick={() => { setSelectedOrder(record); setIsDetailsModalVisible(true); }}>
              <span className="font-bold text-gray-800 text-xs truncate max-w-[140px]">
                {items?.[0]?.productName || 'Handmade Item'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight">
                  {items.length > 1 ? `${items.length} Items` : '1 Item'}
                </span>
                {items.length > 1 && (
                  <span className="px-1 py-0.5 bg-coral/10 text-coral rounded-[4px] text-[8px] font-black">+{items.length - 1} MORE</span>
                )}
              </div>
            </div>
          </Tooltip>
        </div>
      )
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-gray-800 text-[11px] leading-tight">{record.customerId?.name || 'Guest User'}</span>
          <span className="text-[9px] text-gray-400 font-medium lowercase tracking-tight">{record.customerId?.email || 'no-email'}</span>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'amount',
      align: 'right',
      width: 110,
      render: (val, record) => {
        const net = record.sellerPayable || calculatePayout(val, commissionRate).net;
        return (
          <div className="flex flex-col text-right">
            <span className="font-bold text-coral text-xs">Rs. {net.toLocaleString()}</span>
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Net Earnings</span>
          </div>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => {
        let color = 'orange'
        let label = status.replace(/_/g, ' ')
        if (status === 'delivered' || status === 'completed') color = 'green'
        if (status === 'shipped') color = 'blue'
        if (status === 'cancelled_by_customer' || status === 'cancelled_by_seller') color = 'red'
        if (status === 'confirmed' || status === 'seller_accepted' || status === 'preparing') color = 'cyan'

        const tag = (
          <Tag color={color} className="rounded-full px-3 py-0.5 border-none font-bold capitalize text-[9px] tracking-tighter">
            {label}
          </Tag>
        )

        if (status.startsWith('cancelled') && record.cancellationReason) {
          return (
            <Tooltip title={`Reason: ${record.cancellationReason}`}>
              {tag}
            </Tooltip>
          )
        }

        if (status === 'preparing' && record.rejectionReason) {
          return (
            <Tooltip title={
              <div className="flex flex-col gap-1 p-1">
                <span className="font-black text-[10px] uppercase tracking-widest text-red-400">Shipping Rejected</span>
                <span className="text-[11px] font-bold text-white">{record.rejectionReason}</span>
                <span className="text-[9px] text-gray-400">Please re-upload a valid receipt</span>
              </div>
            }>
              <div className="flex items-center gap-2">
                {tag}
                <AlertCircle size={14} className="text-red-500 animate-pulse" />
              </div>
            </Tooltip>
          )
        }

        return tag
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 160,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Order Details">
            <Button
              type="text"
              icon={<Eye size={18} />}
              onClick={() => { setSelectedOrder(record); setIsDetailsModalVisible(true); }}
              className="text-gray-400 hover:text-coral hover:bg-coral/5 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
            />
          </Tooltip>
          
          {['confirmed', 'seller_accepted', 'pending_payment'].includes(record.status) ? (
            <Tooltip title={(record.paymentStatus === 'pending_verification' || record.paymentStatus === 'pending') ? 'Waiting for Payment Payout' : 'Prepare Order'}>
              <Button
                type="text"
                icon={<CheckCircle size={18} />}
                loading={isSubmitting && selectedOrderId === record._id}
                onClick={() => {
                  setSelectedOrderId(record._id)
                  updateStatus(record._id, 'preparing')
                }}
                disabled={record.paymentStatus === 'pending_verification' || record.paymentStatus === 'pending'}
                className="text-gray-900 bg-gray-50 hover:bg-gray-100 border-none flex items-center justify-center h-10 w-10 rounded-xl shadow-sm disabled:opacity-30"
              />
            </Tooltip>
          ) : record.status === 'preparing' ? (
            <Tooltip title="Mark as Shipped">
              <Button
                type="text"
                icon={<Truck size={18} />}
                onClick={() => {
                  setSelectedOrderId(record._id)
                  setIsShippingModalVisible(true)
                }}
                className="text-coral bg-coral/5 hover:bg-coral/10 border-none flex items-center justify-center h-10 w-10 rounded-xl shadow-sm"
              />
            </Tooltip>
          ) : null}

          {['confirmed', 'seller_accepted', 'preparing', 'pending_payment'].includes(record.status) && (
            <Tooltip title="Cancel Order">
              <Button
                type="text"
                danger
                icon={<XCircle size={18} />}
                onClick={() => {
                  setSelectedOrderId(record._id)
                  setIsCancelModalVisible(true)
                }}
                className="text-red-400 hover:text-red-500 hover:bg-red-50 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#FF6B6B', borderRadius: 12, fontFamily: 'Inter, system-ui, sans-serif' },
        components: {
          Button: { colorPrimary: '#FF6B6B', colorPrimaryHover: '#FF5252', controlHeight: 40, fontWeight: 700 },
          Menu: { itemSelectedBg: '#FFEBEE', itemSelectedColor: '#FF6B6B', itemHoverBg: '#FAFAFA' },
          Card: { borderRadiusLG: 16 },
          Table: { headerBg: '#FAFAFA', headerColor: '#8C8C8C', headerBorderRadius: 12 },
          Tabs: { itemSelectedColor: '#FF6B6B', inkBarColor: '#FF6B6B' }
        },
      }}
    >
      <Layout className="min-h-screen bg-[#FAFAFA]">
        <Sider
          trigger={null}
          collapsed={collapsed}
          width={280}
          collapsedWidth={windowWidth < 1024 ? 0 : 80}
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
          className="border-r border-gray-100 shadow-sm"
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
          <Header className="glass-panel sticky top-2 md:top-4 z-40 mx-2 md:mx-6 mt-2 md:mt-4 rounded-2xl md:rounded-[16px] px-4 md:px-8 flex justify-between items-center border-none h-[64px] md:h-[74px] shadow-lg shadow-black/5 relative">
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
              {/* Search & Status Header - Admin Style */}
              <div className="bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-50 flex flex-col gap-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1 w-full max-w-md">
                    <Input
                      placeholder="Search by Order ID or Customer..."
                      prefix={<Search size={18} className="text-gray-400 mr-2" />}
                      size="large"
                      className="h-12 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 transition-all text-sm"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                </div>
                
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  className="seller-status-tabs"
                  items={[
                    { 
                      key: 'all', 
                      label: (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest">All Orders</span>
                          <Badge count={orders.length} size="small" overflowCount={999} 
                                 style={{ backgroundColor: activeTab === 'all' ? '#FF6B6B' : '#94A3B8' }} />
                        </div>
                      )
                    },
                    { 
                      key: 'confirmed', 
                      label: (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest">Confirmed</span>
                          <Badge count={orders.filter(o => ['confirmed', 'seller_accepted'].includes(o.status)).length} size="small"
                                 style={{ backgroundColor: activeTab === 'confirmed' ? '#FF6B6B' : '#94A3B8' }} />
                        </div>
                      )
                    },
                    { 
                      key: 'preparing', 
                      label: (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest">Preparing</span>
                          <Badge count={orders.filter(o => o.status === 'preparing').length} size="small"
                                 style={{ backgroundColor: activeTab === 'preparing' ? '#FF6B6B' : '#94A3B8' }} />
                        </div>
                      )
                    },
                    { 
                      key: 'shipped', 
                      label: (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest">Shipped</span>
                          <Badge count={orders.filter(o => o.status === 'shipped').length} size="small"
                                 style={{ backgroundColor: activeTab === 'shipped' ? '#FF6B6B' : '#94A3B8' }} />
                        </div>
                      )
                    },
                    { 
                      key: 'delivered', 
                      label: (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest">Delivered</span>
                          <Badge count={orders.filter(o => ['delivered', 'completed'].includes(o.status)).length} size="small"
                                 style={{ backgroundColor: activeTab === 'delivered' ? '#FF6B6B' : '#94A3B8' }} />
                        </div>
                      )
                    }
                  ]}
                />
              </div>

              <Card className="border-none shadow-sm overflow-hidden rounded-2xl" styles={{ body: { padding: 0 } }}>

                <Table
                  columns={columns}
                  dataSource={filteredOrders}
                  loading={loading}
                  pagination={false}
                  rowKey="_id"
                  className="premium-table"
                  scroll={{ x: windowWidth < 1200 ? 800 : undefined }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No orders found in this category"
                      />
                    )
                  }}
                />
              </Card>


            </div>
          </Content>

          <style jsx="true">{`
            .premium-table .ant-table-thead > tr > th {
              background: #FAFAFA !important;
              color: #8C8C8C !important;
              font-weight: 800 !important;
              text-transform: uppercase !important;
              font-size: 10px !important;
              letter-spacing: 0.1em !important;
              padding: 16px 24px !important;
              border-bottom: 1px solid rgba(0,0,0,0.03) !important;
            }
            .premium-table .ant-table-tbody > tr > td {
              padding: 16px 24px !important;
              border-bottom: 1px solid #f9fafb !important;
              background: #fff !important;
            }
            .premium-table .ant-table-row:hover > td {
              background-color: #FFF1F0 !important;
            }
            .ant-table-wrapper {
                background: white !important;
                border-radius: 24px !important;
            }
            .premium-table .ant-table {
                background: transparent !important;
            }
          `}</style>

          {/* 🚚 MARK AS SHIPPED MODAL */}
          <Modal
            title={<Title level={4} className="m-0 font-black tracking-tight">Upload <span className="text-coral">Shipping Receipt</span></Title>}
            open={isShippingModalVisible}
            onCancel={() => setIsShippingModalVisible(false)}
            footer={null}
            width={windowWidth < 500 ? '95%' : 450}
            centered
            className="premium-modal"
            closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
            styles={{ content: { borderRadius: 24, padding: 0, overflow: 'hidden' } }}
          >
            <div className="p-5 md:p-8">
              <div className="bg-coral/5 p-4 rounded-2xl border border-coral/10 mb-4">
                <Text className="text-[11px] text-coral font-bold uppercase tracking-widest block mb-1">Escrow Protocol</Text>
                <Text className="text-xs text-gray-500 leading-relaxed block">
                  Providing valid shipping proof triggers the <span className="font-bold text-gray-900">3-day release cycle</span>. Ensure the receipt is clearly visible.
                </Text>
              </div>

              {orders.find(o => o._id === selectedOrderId)?.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <Text className="text-[11px] text-red-500 font-black uppercase tracking-widest">Previous Rejection Reason</Text>
                  </div>
                  <Text className="text-xs text-red-700 leading-relaxed block font-bold">
                    "{orders.find(o => o._id === selectedOrderId)?.rejectionReason}"
                  </Text>
                  <Text className="text-[10px] text-red-400 mt-2 block italic">
                    Please correct the above issue in your new submission.
                  </Text>
                </div>
              )}

              <Form layout="vertical" onFinish={() => updateStatus(selectedOrderId, 'shipped', trackingNumber, shippingReceipt)}>
                <Form.Item label={<span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tracking ID / Waybill Number</span>} required>
                  <Input
                    placeholder="e.g. TCS-12345678"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                  />
                </Form.Item>

                <Form.Item label={<span className="text-xs font-bold uppercase tracking-wider text-gray-400">Courier Receipt Image</span>} required>
                  <div
                    className="border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center hover:border-coral/30 transition-all bg-gray-50/30 cursor-pointer"
                    onClick={() => document.getElementById('receipt-upload').click()}
                  >
                    {shippingReceipt ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="text-green-500" size={32} />
                        <Text className="text-xs font-bold text-gray-900">{shippingReceipt.name}</Text>
                        <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); setShippingReceipt(null) }}>Remove</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-coral">
                          <Upload size={24} />
                        </div>
                        <Text className="text-xs font-bold text-gray-900 mt-2">Upload Shipping Receipt</Text>
                        <Text className="text-[10px] text-gray-400">PNG, JPG or PDF (Max 5MB)</Text>
                      </div>
                    )}
                    <input
                      type="file"
                      id="receipt-upload"
                      hidden
                      onChange={e => setShippingReceipt(e.target.files[0])}
                      accept="image/*"
                    />
                  </div>
                </Form.Item>

                <div className="flex gap-3 mt-8">
                  <Button
                    className="flex-1 h-12 rounded-xl font-bold border-gray-100"
                    onClick={() => setIsShippingModalVisible(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={!trackingNumber || !shippingReceipt}
                    className="flex-2 h-12 rounded-xl font-bold bg-coral border-none shadow-lg shadow-coral/20"
                  >
                    Confirm & Mark Shipped
                  </Button>
                </div>
              </Form>
            </div>
          </Modal>

          {/* ❌ CANCEL ORDER MODAL */}
          <Modal
            title={<Title level={4} className="m-0 font-black tracking-tight text-red-500">Order <span className="text-gray-900 text-sm md:text-base">Cancellation</span></Title>}
            open={isCancelModalVisible}
            onCancel={() => { setIsCancelModalVisible(false); setCancelReason(''); }}
            footer={null}
            className="premium-modal"
            width={windowWidth < 500 ? '95%' : 480}
            centered
            styles={{ content: { borderRadius: 24, padding: 0, overflow: 'hidden' } }}
            closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
          >
            <div className="p-4 md:p-8">
              {/* Order Context */}
              {orders.find(o => o._id === selectedOrderId) && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                  <div className="flex flex-wrap justify-between items-start gap-y-2 mb-2">
                    <div className="min-w-[140px]">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Cancelling Order</Text>
                      <Text className="text-sm font-black text-gray-900">#{orders.find(o => o._id === selectedOrderId).orderId?.split('-').pop()}</Text>
                    </div>
                    <div className="text-left sm:text-right">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Amount</Text>
                      <Text className="text-sm font-black text-coral">Rs. {orders.find(o => o._id === selectedOrderId).total?.toLocaleString()}</Text>
                    </div>
                  </div>
                  <Text className="text-[10px] font-bold text-gray-400 italic">
                    {orders.find(o => o._id === selectedOrderId).orderItems?.length} items will be marked as cancelled
                  </Text>
                </div>
              )}

              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <Text className="text-[11px] text-red-500 font-black uppercase tracking-widest">Protocol Warning</Text>
                </div>
                <Text className="text-xs text-red-700 leading-relaxed block font-medium">
                  Cancelling an order after confirmation negatively impacts your <span className="font-black underline">Seller Performance Score</span> and may restrict future storefront visibility.
                </Text>
              </div>

              <Form layout="vertical" onFinish={handleCancel}>
                <Form.Item 
                  label={<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reason for Cancellation</span>} 
                  required
                >
                  <Select
                    placeholder="Select why you're cancelling..."
                    className="w-full h-12"
                    size="large"
                    onChange={(val) => setCancelReason(val)}
                    suffixIcon={<Filter size={16} className="text-gray-400" />}
                    dropdownStyle={{ borderRadius: 16, padding: 8 }}
                  >
                    <Select.Option value="Out of stock">
                      <div className="flex items-center gap-2 py-1"><Box size={14} /> <span>Out of stock</span></div>
                    </Select.Option>
                    <Select.Option value="Unable to deliver to this location">
                      <div className="flex items-center gap-2 py-1"><Truck size={14} /> <span>Logistics Issue</span></div>
                    </Select.Option>
                    <Select.Option value="Pricing error">
                      <div className="flex items-center gap-2 py-1"><DollarSign size={14} /> <span>Pricing error</span></div>
                    </Select.Option>
                    <Select.Option value="Product quality issue">
                      <div className="flex items-center gap-2 py-1"><AlertCircle size={14} /> <span>Quality Issue</span></div>
                    </Select.Option>
                    <Select.Option value="Other">
                      <div className="flex items-center gap-2 py-1"><FileText size={14} /> <span>Other (Specify)</span></div>
                    </Select.Option>
                  </Select>
                </Form.Item>

                {cancelReason === 'Other' && (
                   <Form.Item required className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <Input.TextArea 
                        placeholder="Please provide a detailed explanation for the customer..." 
                        rows={4}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm focus:bg-white transition-all"
                      />
                   </Form.Item>
                )}

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8 md:mt-10">
                  <Button
                    className="w-full sm:flex-1 h-12 md:h-13 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] border-gray-100 hover:border-gray-300 text-gray-400 order-2 sm:order-1"
                    onClick={() => { setIsCancelModalVisible(false); setCancelReason(''); }}
                  >
                    Keep Order
                  </Button>
                  <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={!cancelReason || (cancelReason === 'Other')}
                    className="w-full sm:flex-[1.5] h-12 md:h-13 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] border-none shadow-xl shadow-red-200 bg-red-500 hover:bg-red-600 active:scale-95 transition-all order-1 sm:order-2"
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </Form>
            </div>
          </Modal>

          <Modal
            title={null}
            open={isDetailsModalVisible}
            onCancel={() => setIsDetailsModalVisible(false)}
            footer={null}
            width={windowWidth < 500 ? '95%' : 540}
            centered
            styles={{ content: { borderRadius: 16, padding: 0, overflow: 'hidden' } }}
            closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
          >
            {selectedOrder && (
              <div className="flex flex-col">
                {/* Simplified Header */}
                <div className="bg-gray-50 p-6 md:p-8 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Order Details</Text>
                      <Title level={3} className="m-0 font-bold text-gray-900">#{selectedOrder.orderId?.split('-').pop()}</Title>
                    </div>
                    <Tag 
                      color={selectedOrder.status === 'delivered' ? 'green' : 'blue'} 
                      className="rounded-lg px-3 py-1 border-none font-bold capitalize text-xs m-0"
                    >
                      {selectedOrder.status.replace(/_/g, ' ')}
                    </Tag>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {/* Items Section */}
                  <div>
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Products</Text>
                    <div className="space-y-3">
                      {selectedOrder.orderItems?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-50 shrink-0">
                              <img src={getMediaUrl(item.productImage)} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex flex-col">
                              <Text className="text-sm font-bold text-gray-800">{item.productName}</Text>
                              <Text className="text-xs text-gray-400">Qty: {item.quantity}</Text>
                            </div>
                          </div>
                          <Text className="font-bold text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</Text>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                      <Text className="font-bold text-gray-500">Subtotal</Text>
                      <Text className="text-lg font-bold text-coral">Rs. {selectedOrder.subtotal?.toLocaleString()}</Text>
                    </div>
                  </div>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Buyer Card */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Buyer</Text>
                      <div className="flex items-center gap-3 mb-3">
                        <User size={16} className="text-gray-400" />
                        <Text className="text-sm font-bold text-gray-800">{selectedOrder.customerId?.name}</Text>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={14} className="text-gray-400" />
                        <Text className="text-xs text-gray-600">{selectedOrder.deliveryAddress?.contactNumber || 'N/A'}</Text>
                      </div>
                    </div>

                    {/* Logistics Card */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Shipping To</Text>
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                        <div>
                          <Text className="text-sm font-bold text-gray-800 block">{selectedOrder.deliveryAddress?.city}</Text>
                          <Text className="text-xs text-gray-500 leading-tight">{selectedOrder.deliveryAddress?.street}</Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  {selectedOrder.status.startsWith('cancelled') && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <Text className="text-[10px] font-bold text-red-500 uppercase block mb-1">Reason for Cancellation</Text>
                      <Text className="text-xs text-red-700 italic">{selectedOrder.cancellationReason || 'No reason specified'}</Text>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 pt-0 flex gap-3">
                  <Button
                    className="flex-1 h-10 rounded-lg font-bold text-gray-500"
                    onClick={() => setIsDetailsModalVisible(false)}
                  >
                    Close
                  </Button>
                  {['confirmed', 'seller_accepted', 'pending_payment'].includes(selectedOrder.status) && (
                    <Button
                      type="primary"
                      className="flex-1 h-10 rounded-lg font-bold bg-gray-900 border-none shadow-md"
                      onClick={() => {
                        setIsDetailsModalVisible(false);
                        setSelectedOrderId(selectedOrder._id);
                        updateStatus(selectedOrder._id, 'preparing');
                      }}
                    >
                      Prepare Order
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Modal>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default SellerOrders
