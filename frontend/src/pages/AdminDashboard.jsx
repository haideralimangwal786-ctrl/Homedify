import React, { useEffect, useState, useContext, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Layout, Menu, Card, Table, Tag, Badge, Button, Row, Col, Space,
  Typography, ConfigProvider, theme, Avatar, Tooltip, Modal, Statistic,
  Input, Divider, Progress, Image as AntImage, Switch, Empty, Select, Popconfirm, Slider, Drawer
} from 'antd'
import { 
  LayoutDashboard, UserPlus, ShieldCheck, Users, ClipboardList, 
  Bell, Settings, LogOut, Menu as MenuIcon, ExternalLink, 
  CheckCircle, XCircle, CheckCircle2, Fingerprint, Scan, MapPin, Calendar, 
  TrendingUp, Activity, Info, ChevronRight, Clock, 
  Search, Sparkles, Eye, Phone, Mail, Building,
  FileText, Shield, AlertTriangle, IdCard, ScanFace, Image as ImageIcon,
  History, User, Check, X, RefreshCw, Camera, 
  Zap, ArrowRight, Gavel, FileCheck, Award, Target, Briefcase, Globe,
  ShieldAlert, UserCheck, CreditCard, Box, MapPinned, Info as InfoIcon,
  ShoppingBag, Mail as MailIcon, Hash, Package, Trash2, Slash, Filter, UserX, UserMinus, Tag as TagIcon, Star,
  Wallet, Banknote, Landmark, Store, Upload, ArrowRightCircle, Truck, Percent, Receipt, BarChart3, PieChart,
  MessageSquare
} from 'lucide-react'
import api from '../services/api' 
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'
import AdminProductModeration from './AdminProductModeration'
import AdminOrderMonitoring from './AdminOrderMonitoring'
import AdminProfile from '../components/AdminProfile'
import CategoriesAdmin from './CategoriesAdmin'
import AdminReviewModeration from './AdminReviewModeration'
import { useSettings } from '../context/SettingsContext'
import { calculatePayout } from '../utils/financialUtils'
import AdminInquiries from './AdminInquiries'

const { Header, Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography


const AdminDashboard = () => {
  const { token, user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  const { commissionRate, deliveryCharge, taxRate, updateGlobalSettings } = useSettings()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // System Financials state
  const [newCommission, setNewCommission] = useState(commissionRate || 10)
  const [newDeliveryCharge, setNewDeliveryCharge] = useState(deliveryCharge || 200)
  const [newTaxRate, setNewTaxRate] = useState(taxRate || 0)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

  useEffect(() => {
    if (commissionRate !== undefined) setNewCommission(commissionRate)
    if (deliveryCharge !== undefined) setNewDeliveryCharge(deliveryCharge)
    if (taxRate !== undefined) setNewTaxRate(taxRate)
  }, [commissionRate, deliveryCharge, taxRate])

  // Modal Sub-Tab State
  const [modalActiveTab, setModalActiveTab] = useState('basic')

  // ── Ultra-Reliable Media URL Helper ──
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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  // Data States
  const [sellers, setSellers] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0, totalSellers: 0, pendingSellers: 0, pendingProducts: 0, totalRevenue: 0
  })
  const [usersList, setUsersList] = useState([])
  const [allSellers, setAllSellers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingProducts, setPendingProducts] = useState([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [pendingOrders, setPendingOrders] = useState([])
  const [inquiryCount, setInquiryCount] = useState(0)
  
  // Data States
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Rejection Modal State
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionId, setRejectionId] = useState(null)
  const [rejectionType, setRejectionType] = useState('seller') // 'seller', 'product', or 'shipping'

  // Finance States - Fully Reactive via useMemo
  const financeStats = useMemo(() => {
    const paidToSeller = pendingOrders.filter(o => o.paymentStatus === 'paid_to_seller');
    const refunded = pendingOrders.filter(o => (o.paymentStatus === 'refunded' || o.status === 'refunded'));
    const rate = commissionRate || 10;
    return {
      totalCommission: paidToSeller.reduce((acc, o) => acc + (o.adminCommission || (o.subtotal ? o.subtotal * (rate / 100) : o.total * (rate / 100))), 0),
      totalPayout: paidToSeller.reduce((acc, o) => acc + (o.sellerPayable || (o.total * ((100 - rate) / 100))), 0),
      totalRefund: refunded.reduce((acc, o) => acc + o.total, 0)
    };
  }, [pendingOrders, commissionRate]);

  const releaseQueue = useMemo(() => 
    pendingOrders.filter(o => (o.status === 'delivered' || o.status === 'shipped') && o.paymentStatus === 'held_in_escrow'),
  [pendingOrders]);

  const refundQueue = useMemo(() => 
    pendingOrders.filter(o => 
      (['cancelled_by_customer', 'cancelled_by_seller', 'disputed'].includes(o.status) && ['paid', 'held_in_escrow'].includes(o.paymentStatus)) ||
      (o.status === 'confirmed' && o.paymentStatus === 'held_in_escrow')
    ),
  [pendingOrders]);

  const [withdrawals, setWithdrawals] = useState([])
  const [financeSubTab, setFinanceSubTab] = useState('release')
  const [financeLoading, setFinanceLoading] = useState(false)
  const [payoutProofFile, setPayoutProofFile] = useState(null)
  const [refundProofFile, setRefundProofFile] = useState(null)

  // Finance Modal States
  const [payoutModalVisible, setPayoutModalVisible] = useState(false)
  const [refundModalVisible, setRefundModalVisible] = useState(false)
  const [selectedFinanceOrder, setSelectedFinanceOrder] = useState(null)
  const [payoutReference, setPayoutReference] = useState('')
  const [adminAccount, setAdminAccount] = useState('')
  
  // Deletion Modal States
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null) // 'seller' or 'user'
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
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
    fetchData()
    // Periodic refresh every 30 seconds for dynamic updates
    const interval = setInterval(fetchData, 30000)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
    }
  }, [token])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statRes, sellerRes, allSellersRes, userRes, prodRes, financeRes, withdrawalRes, orderRes, releaseRes, refundRes, inquiryRes] = await Promise.all([
        api.get('/api/v1/admin/stats'),
        api.get('/api/v1/admin/sellers/pending'),
        api.get('/api/v1/admin/sellers'),
        api.get('/api/v1/admin/users'),
        api.get('/api/v1/admin/products/pending'),
        api.get('/api/v1/admin/finance/summary'),
        api.get('/api/v1/payments/withdrawals/all?status=pending'),
        api.get('/api/v1/admin/orders'),
        api.get('/api/v1/admin/finance/release-queue'),
        api.get('/api/v1/admin/finance/refund-queue'),
        api.get('/api/v1/admin/inquiries')
      ])
      
      setStats(statRes.data.data || {})
      setSellers(sellerRes.data.data || [])
      setAllSellers(allSellersRes.data.data || [])
      setUsersList(userRes.data.data || [])
      setPendingProducts(prodRes.data.data || [])
      setWithdrawals(withdrawalRes.data.data || [])
      setPendingOrders(orderRes.data.data || [])
      
      const pendingInqs = (inquiryRes.data.data || []).filter(i => i.status === 'pending').length
      setInquiryCount(pendingInqs)
    } catch (err) {
      console.error('Fetch error:', err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await api.put(`/api/v1/admin/sellers/${id}/approve`, { adminNotes: 'Approved via Admin Dashboard' })
      toast.success('Seller approved successfully!')
      setSellers(prev => prev.filter(s => s._id !== id))
      fetchData()
      if (viewModalVisible) setViewModalVisible(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error approving seller')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setActionLoading(true)
    try {
      if (rejectionType === 'seller') {
        await api.put(`/api/v1/admin/sellers/${rejectionId}/reject`, { rejectionReason: rejectionReason })
        toast.success('Seller rejected')
      } else if (rejectionType === 'product') {
        await api.put(`/api/v1/admin/products/${rejectionId}/reject`, { reason: rejectionReason })
        toast.success('Product rejected')
      } else if (rejectionType === 'shipping') {
        await api.put(`/api/v1/orders/${rejectionId}/reject-shipping`, { reason: rejectionReason })
        toast.success('Shipping receipt rejected & Seller notified')
      }
      
      fetchData()
      setRejectionModalVisible(false)
      setRejectionReason('')
      if (viewModalVisible) setViewModalVisible(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing rejection')
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectionModal = (id) => {
    setRejectionId(id)
    setRejectionReason('Documents did not meet standards')
    setRejectionModalVisible(true)
  }

  const openViewModal = (seller) => {
    setSelectedSeller(seller)
    setModalActiveTab('basic')
    setViewModalVisible(true)
  }

  const handleSuspend = async (id) => {
    try {
      await api.put(`/api/v1/admin/sellers/${id}/suspend`)
      toast.success('Seller status updated')
      fetchData()
    } catch (err) {
      toast.error('Failed to update seller status')
    }
  }

  const handleReleaseEscrow = async (id, ref, proofFile) => {
    try {
      setFinanceLoading(true)
      const formData = new FormData();
      formData.append('adminNotes', ref);
      if (proofFile) formData.append('payoutProof', proofFile);

      const res = await api.put(`/api/v1/admin/orders/${id}/release-payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Reactive Local Update
      setPendingOrders(prev => prev.map(o => o._id === id ? { ...o, paymentStatus: 'paid_to_seller', status: 'completed', payoutProof: res.data.data.payoutProof } : o));
      
      toast.success('Escrow released and seller wallet updated!')
      setPayoutModalVisible(false)
      setPayoutReference('')
      setPayoutProofFile(null)
    } catch (err) {
      console.error('Release Escrow Error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to release payment';
      toast.error(msg, { duration: 4000 });
    } finally {
      setFinanceLoading(false)
    }
  }

  const handleProcessRefund = async (id, notes, proofFile, adminAcc) => {
    try {
      setFinanceLoading(true)
      const formData = new FormData();
      formData.append('refundNotes', notes);
      formData.append('adminAccount', adminAcc);
      if (proofFile) formData.append('refundProof', proofFile);

      const res = await api.put(`/api/v1/admin/orders/${id}/process-refund`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Reactive Local Update
      setPendingOrders(prev => prev.map(o => o._id === id ? { ...o, paymentStatus: 'refunded', status: 'refunded', refundProof: res.data.data.refundProof } : o));

      toast.success('Refund processed and customer notified!')
      setRefundModalVisible(false)
      setAdminAccount('')
      setPayoutReference('')
      setRefundProofFile(null)
    } catch (err) {
      console.error('Refund Error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to process refund';
      toast.error(msg, { duration: 4000 });
    } finally {
      setFinanceLoading(false)
    }
  }

  const handleMarkAsTransferred = async (id) => {
    try {
      setFinanceLoading(true)
      await api.put(`/api/v1/payments/withdrawals/${id}/approve`, { adminNotes: 'Transferred via Admin Dashboard' })
      toast.success('Payout marked as transferred!')
      fetchData()
    } catch (err) {
      toast.error('Failed to update withdrawal status')
    } finally {
      setFinanceLoading(false)
    }
  }

  const handleRejectWithdrawal = async (id) => {
    const reason = window.prompt("Reason for rejection:")
    if (!reason) return
    try {
      setFinanceLoading(true)
      await api.put(`/api/v1/payments/withdrawals/${id}/reject`, { rejectionReason: reason })
      toast.success('Withdrawal rejected and funds returned to seller')
      fetchData()
    } catch (err) {
      toast.error('Failed to reject withdrawal')
    } finally {
      setFinanceLoading(false)
    }
  }

  const handleDeleteSeller = (id) => {
      setItemToDelete(id)
      setDeleteType('seller')
      setDeleteModalVisible(true)
    }

    const confirmDelete = async () => {
      setDeleteLoading(true)
      try {
        const endpoint = deleteType === 'seller' ? `/api/v1/admin/sellers/${itemToDelete}` : `/api/v1/admin/users/${itemToDelete}`
        await api.delete(endpoint)
        toast.success(`${deleteType === 'seller' ? 'Seller' : 'User'} deleted successfully`)
        setDeleteModalVisible(false)
        fetchData()
        if (viewModalVisible) setViewModalVisible(false)
      } catch (err) {
        toast.error(`Failed to delete ${deleteType}`)
      } finally {
        setDeleteLoading(false)
      }
    }

  const handleStatusChange = async (id) => {
    try {
      await api.put(`/api/v1/admin/users/${id}/status`)
      toast.success('User status updated')
      fetchData()
    } catch (err) {
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = (id) => {
    setItemToDelete(id)
    setDeleteType('user')
    setDeleteModalVisible(true)
  }

  const menuItems = [
    { key: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { 
      key: 'approvals', 
      icon: <ShieldCheck size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Seller Verification</span>
          {!collapsed && sellers.length > 0 && (
            <Badge count={sellers.length} size="small" className="sidebar-badge" />
          )}
        </div>
      )
    },
    { key: 'sellers', icon: <Store size={20} />, label: 'Seller Management' },
    { 
      key: 'products', 
      icon: <Package size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Product Moderation</span>
          {!collapsed && pendingProducts.length > 0 && (
            <Badge count={pendingProducts.length} size="small" className="sidebar-badge" />
          )}
        </div>
      )
    },
    { 
      key: 'orders', 
      icon: <Activity size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Order Monitoring</span>
          {!collapsed && pendingOrders.filter(o => o.paymentStatus === 'pending_verification').length > 0 && (
            <Badge count={pendingOrders.filter(o => o.paymentStatus === 'pending_verification').length} size="small" className="sidebar-badge" />
          )}
        </div>
      )
    },
    { 
      key: 'reviews', 
      icon: <Star size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Review Moderation</span>
          {!collapsed && stats.pendingReviews > 0 && (
            <Badge count={stats.pendingReviews} size="small" className="sidebar-badge" />
          )}
        </div>
      )
    },
    { 
      key: 'users', 
      icon: <Users size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>User Management</span>
          {!collapsed && stats.totalUsers > 0 && (
            <Badge count={stats.totalUsers} size="small" className="sidebar-badge" style={{ backgroundColor: '#94A3B8' }} />
          )}
        </div>
      )
    },
    { key: 'categories', icon: <TagIcon size={20} />, label: 'Category Management' },
    {
      key: 'finance',
      icon: <Wallet size={20} />,
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Financial Management</span>
          {!collapsed && (withdrawals.length + releaseQueue.length + refundQueue.length) > 0 && (
            <Badge count={withdrawals.length + releaseQueue.length + refundQueue.length} size="small" className="sidebar-badge" />
          )}
        </div>
      )
    },
    { key: 'system_financials', icon: <Landmark size={20} />, label: 'System Financials' },
    { 
      key: 'inquiries', 
      icon: <MessageSquare size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Customer Inquiries</span>
          {!collapsed && inquiryCount > 0 && (
            <Badge count={inquiryCount} size="small" className="sidebar-badge" />
          )}
        </div>
      )
    },
    { type: 'divider' },
    { key: 'settings', icon: <Settings size={20} />, label: 'System Settings' },
  ]

  const sellerColumns = [
    {
      title: 'Seller Details',
      key: 'sellerInfo',
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <Avatar className="bg-coral/10 text-coral font-bold w-12 h-12 rounded-xl">
            {record.userId?.name ? record.userId.name[0] : 'S'}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <Text className="font-bold text-gray-900 text-sm truncate">{record.userId?.name || 'New Seller'}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              {record.storeName || 'Store Pending'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Contact Information',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-gray-300" />
            <Text className="text-[11px] font-medium text-gray-600 truncate max-w-[160px]">{record.email || record.userId?.email || 'no-email'}</Text>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-gray-300" />
            <Text className="text-[11px] font-medium text-gray-600">{record.contactNumber || record.userId?.contactNumber || 'N/A'}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'AI Verification',
      dataIndex: 'faceMatchScore',
      key: 'score',
      align: 'center',
      width: 120,
      render: (score) => (
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-[1px]">
            <div 
              className={`h-full rounded-full transition-all duration-700 shadow-sm ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-orange-400' : 'bg-red-500'}`}
              style={{ width: `${score || 0}%` }}
            />
          </div>
          <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: score >= 70 ? '#10b981' : score >= 40 ? '#fbbf24' : '#ef4444' }}>
            {score || 0}% Score
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'verificationStatus',
      key: 'status',
      align: 'center',
      width: 100,
      render: (status) => (
        <div className="flex justify-center">
          <Tag 
            color={status === 'approved' ? 'success' : status === 'suspended' ? 'error' : 'warning'} 
            className="rounded-full px-4 border-none font-black uppercase text-[9px] tracking-wider py-0.5"
          >
            {status.replace('_', ' ')}
          </Tag>
        </div>
      )
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: 140,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Application">
            <Button 
              type="text"
              icon={<Eye size={18} />} 
              onClick={() => openViewModal(record)}
              className="text-gray-400 hover:text-coral hover:bg-coral/5 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
            />
          </Tooltip>
          <Tooltip title="Approve Seller">
            <Button 
              type="text"
              onClick={() => handleApprove(record._id)}
              className="text-green-500 hover:bg-green-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
              icon={<CheckCircle2 size={20} />}
            />
          </Tooltip>
          <Tooltip title="Reject Application">
            <Button 
              type="text"
              onClick={() => openRejectionModal(record._id)}
              className="text-red-500 hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
              icon={<XCircle size={20} />}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const managementColumns = [
    {
      title: 'Shop Details',
      key: 'shopInfo',
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <Avatar className="bg-coral/10 text-coral font-bold w-12 h-12 rounded-xl">
            {record.storeName ? record.storeName[0] : 'S'}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <Text className="font-bold text-gray-900 text-sm truncate">{record.storeName || 'Store Name'}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              {record.userId?.name || 'Seller'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Contact Information',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-gray-300" />
            <Text className="text-[11px] font-medium text-gray-600 truncate max-w-[160px]">{record.email || record.userId?.email || 'no-email'}</Text>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-gray-300" />
            <Text className="text-[11px] font-medium text-gray-600">{record.contactNumber || record.userId?.contactNumber || 'N/A'}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      align: 'center',
      width: 110,
      render: (_, record) => (
        <div className="flex flex-col items-center">
          <span className="font-bold text-coral text-xs">{record.totalProducts || 0}</span>
          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Products</span>
        </div>
      )
    },
    {
      title: 'Documents',
      key: 'docs',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <div className="flex justify-center gap-2">
           <Tooltip title="CNIC/Identity Verified">
             <div className="w-8 h-8 rounded-lg bg-[#FC6A6B]/10 flex items-center justify-center text-[#FC6A6B] border border-[#FC6A6B]/50">
               <Fingerprint size={16} />
             </div>
           </Tooltip>
           <Tooltip title="Bank Details Verified">
             <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100/50">
               <Landmark size={16} />
             </div>
           </Tooltip>
        </div>
      )
    },
    {
      title: 'Verification',
      dataIndex: 'verificationStatus',
      key: 'status',
      align: 'center',
      width: 100,
      render: (status) => (
        <div className="flex justify-center">
          <Tag 
            color={status === 'approved' ? 'success' : status === 'suspended' ? 'error' : 'warning'} 
            className="rounded-full px-4 border-none font-black uppercase text-[9px] tracking-wider py-0.5"
          >
            {status === 'approved' ? 'Verified' : status}
          </Tag>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 140,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Profile">
            <Button 
              type="text"
              icon={<Eye size={18} />} 
              onClick={() => openViewModal(record)}
              className="text-gray-400 hover:text-coral hover:bg-coral/5 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
            />
          </Tooltip>
          <Tooltip title={record.verificationStatus === 'suspended' ? "Activate Seller" : "Suspend Seller"}>
            <Button 
              type="text"
              onClick={() => handleSuspend(record._id)}
              className={`rounded-xl flex items-center justify-center h-10 w-10 transition-all ${
                record.verificationStatus === 'suspended' ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'
              } hover:scale-110`}
              icon={record.verificationStatus === 'suspended' ? <CheckCircle2 size={20} /> : <Slash size={18} />}
            />
          </Tooltip>
          <Tooltip title="Delete Account">
            <Button 
              type="text"
              onClick={() => handleDeleteSeller(record._id)}
              className="text-red-500 hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
              icon={<Trash2 size={18} />}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const userColumns = [
    {
      title: 'Customer Details',
      key: 'userInfo',
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <Avatar className="bg-coral/10 text-coral font-bold w-12 h-12 rounded-xl">
            {record.name ? record.name[0] : 'U'}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <Text className="font-bold text-gray-900 text-sm truncate">{record.name || 'Anonymous User'}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              {record.role === 'admin' ? 'Platform Admin' : 'Homedify Customer'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Contact Information',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-gray-300" />
            <Text className="text-[11px] font-medium text-gray-600 truncate max-w-[200px]">{record.email}</Text>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-gray-300" />
            <Text className="text-[11px] font-medium text-gray-600">Joined {new Date(record.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Shopping Activity',
      dataIndex: 'totalSpent',
      key: 'spent',
      align: 'center',
      width: 110,
      render: (amount) => (
        <div className="flex flex-col items-center">
          <span className="font-bold text-coral text-xs">Rs. {(amount || 0).toLocaleString()}</span>
          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Total Spent</span>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isBlocked',
      key: 'status',
      align: 'center',
      width: 100,
      render: (isBlocked) => (
        <div className="flex justify-center">
          <Tag 
            color={isBlocked ? 'error' : 'success'} 
            className="rounded-full px-4 border-none font-black uppercase text-[9px] tracking-wider py-0.5"
          >
            {isBlocked ? 'Blocked' : 'Active'}
          </Tag>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 110,
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title={record.isBlocked ? "Unblock Account" : "Block Account"}>
            <Button 
              type="text"
              onClick={() => handleStatusChange(record._id)}
              className={`rounded-xl flex items-center justify-center h-10 w-10 transition-all ${
                record.isBlocked ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'
              } hover:scale-110`}
              icon={record.isBlocked ? <CheckCircle2 size={20} /> : <Slash size={18} />}
            />
          </Tooltip>
          <Tooltip title="Permanently Delete">
            <Button 
              type="text"
              onClick={() => handleDeleteUser(record._id)}
              className="text-red-500 hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
              icon={<Trash2 size={18} />}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const walletColumns = [
    {
      title: 'Store Name',
      dataIndex: 'storeName',
      key: 'storeName',
      render: (text, record) => (
        <Space>
           <Avatar src={getMediaUrl(record.logo)} className="bg-coral/10 text-coral">
             {text ? text[0].toUpperCase() : 'S'}
           </Avatar>
           <Text className="font-bold text-gray-800">{text}</Text>
        </Space>
      )
    },
    {
      title: 'Seller',
      dataIndex: ['userId', 'name'],
      key: 'sellerName',
      render: (name) => <Text className="text-gray-600">{name}</Text>
    },
    {
      title: 'Escrow (Pending)',
      dataIndex: 'pendingBalance',
      key: 'pending',
      render: (val) => <Text className="font-bold text-orange-500">PKR {val?.toLocaleString()}</Text>
    },
    {
      title: 'Available',
      dataIndex: 'availableBalance',
      key: 'available',
      render: (val) => <Text className="font-bold text-green-600">PKR {val?.toLocaleString()}</Text>
    },
    {
      title: 'Total Withdrawn',
      dataIndex: 'totalWithdrawn',
      key: 'withdrawn',
      render: (val) => <Text className="font-bold text-gray-400">PKR {val?.toLocaleString()}</Text>
    }
  ];

  const payoutColumns = [
    {
      title: 'Requested By',
      dataIndex: 'sellerId',
      key: 'seller',
      render: (seller) => (
        <div className="flex flex-col">
          <Text className="font-bold text-gray-800">{seller?.storeName}</Text>
          <Text className="text-[10px] text-gray-400 font-medium">{seller?.userId?.name}</Text>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt) => <Text className="font-black text-coral text-lg">PKR {amt.toLocaleString()}</Text>
    },
    {
      title: 'Payment Details',
      dataIndex: 'bankDetails',
      key: 'bank',
      render: (bank) => (
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={12} className="text-gray-400" />
            <Text className="text-[11px] font-black uppercase text-gray-400 tracking-wider">{bank.bankName}</Text>
          </div>
          <Text className="block text-xs font-bold text-gray-800">{bank.accountTitle}</Text>
          <Text className="block text-[10px] text-gray-400 font-medium font-mono">{bank.accountNumber}</Text>
          {bank.iban && <Text className="block text-[10px] text-gray-400 font-medium font-mono">{bank.iban}</Text>}
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => <Text className="text-gray-500 text-xs">{new Date(date).toLocaleDateString()}</Text>
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space>
           <Popconfirm
             title="Manual Payout Confirmation"
             description={
               <div className="max-w-[240px] py-2">
                 <Text className="text-xs text-gray-500 block mb-3">
                   Have you <span className="font-bold text-gray-900">manually transferred</span> the amount to the seller's account?
                 </Text>
                 <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <Text className="text-[10px] text-orange-700 font-bold block mb-1 uppercase tracking-wider">Warning</Text>
                    <Text className="text-[10px] text-orange-600 block leading-tight">
                      System balance will only be updated after you confirm. This action is irreversible.
                    </Text>
                 </div>
               </div>
             }
             onConfirm={() => handleMarkAsTransferred(record._id)}
             okText="Yes, Transferred"
             cancelText="No"
             okButtonProps={{ className: 'bg-coral border-none h-10 px-6 font-bold rounded-lg' }}
           >
             <Button 
               type="primary" 
               size="small"
               icon={<Check size={14} />}
               className="bg-coral hover:bg-coral/90 border-none rounded-lg h-9 px-4 font-bold text-[11px] uppercase tracking-wider shadow-md shadow-coral/20"
               loading={financeLoading}
             >
               Confirm Payout
             </Button>
           </Popconfirm>
           <Button 
             type="text" 
             danger
             size="small"
             icon={<X size={14} />}
             onClick={() => handleRejectWithdrawal(record._id)}
             className="hover:bg-red-50 rounded-lg h-9 w-9 flex items-center justify-center"
           />
        </Space>
      )
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B6B',
          borderRadius: 12,
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          Button: {
            colorPrimary: '#FF6B6B',
            colorPrimaryHover: '#FF8585',
            borderRadius: 10,
            fontWeight: 600,
          },
          Menu: {
            itemSelectedBg: '#FFEBEE',
            itemSelectedColor: '#FF6B6B',
            itemHoverBg: '#FAFAFA',
            itemBorderRadius: 8,
          },
          Card: {
            borderRadiusLG: 20,
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
      <div className="admin-dashboard-wrapper">
        <Layout className="min-h-screen bg-[#FAFAFA]">
          {/* Mobile Drawer */}
          <Drawer
            title={
              <div className="flex justify-center py-2">
                <img src={logo} alt="Homedify" className="h-10" />
              </div>
            }
            placement="left"
            onClose={() => setIsMobileMenuOpen(false)}
            open={isMobileMenuOpen}
            size="default"
            styles={{ body: { padding: 0 } }}
            closeIcon={<XCircle className="text-gray-400" size={24} />}
          >
             <div className="flex flex-col h-full bg-white">
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <Menu
                        mode="inline"
                        selectedKeys={[activeTab]}
                        items={menuItems}
                        onClick={({ key }) => {
                            setActiveTab(key);
                            setIsMobileMenuOpen(false);
                            fetchData();
                        }}
                        className="border-none px-3"
                    />
                </div>
                <div className="px-4 py-6 border-t border-gray-50 bg-white">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-[#FF6B6B] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                            {user?.picture && <img src={getMediaUrl(user.picture)} alt="Admin" className="w-full h-full object-cover" />}
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg" style={{ display: user?.picture ? 'none' : 'flex' }}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#1E293B] m-0 truncate leading-tight">{user?.name || 'Admin'}</p>
                            <p className="text-[9px] font-black text-[#94A3B8] m-0 uppercase tracking-[0.1em] mt-0.5">Administrator</p>
                        </div>
                        <Button type="text" icon={<LogOut size={20} className="text-[#1E293B]" />} onClick={logout} />
                    </div>
                </div>
             </div>
          </Drawer>

          {/* Sidebar */}
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={280}
            collapsedWidth={windowWidth < 1024 ? 0 : 80}
            theme="light"
            style={{
              overflow: 'hidden',
              height: '100vh',
              position: 'fixed',
              left: 0, top: 0, bottom: 0,
              zIndex: 1000,
              display: windowWidth < 1024 ? 'none' : 'flex',
              flexDirection: 'column',
              boxShadow: '10px 0 30px rgba(0,0,0,0.02)'
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
                selectedKeys={[activeTab]}
                items={menuItems}
                onClick={({ key }) => {
                  setActiveTab(key);
                  fetchData();
                }}
                className="border-none px-3"
              />
            </div>

            <div className="px-4 py-6 border-t border-gray-50 bg-white shrink-0">
              <div className={`flex items-center gap-4 bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm transition-all duration-300 ${collapsed ? 'justify-center p-2' : ''}`}>
                {/* Avatar with Image Fallback - Matching the Circle with Border design */}
                <div className="w-12 h-12 rounded-full bg-[#FF6B6B] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                  {user?.picture ? (
                    <img 
                      src={getMediaUrl(user.picture)} 
                      alt="Admin" 
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
                    <p className="text-sm font-bold text-[#1E293B] m-0 truncate leading-tight">{user?.name || 'Admin'}</p>
                    <p className="text-[9px] font-black text-[#94A3B8] m-0 uppercase tracking-[0.1em] mt-0.5">Administrator</p>
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
          marginLeft: windowWidth < 1024 ? 0 : (collapsed ? 80 : 280), 
          transition: 'all 0.3s',
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Header className={`glass-panel sticky top-4 z-40 mx-2 sm:mx-6 mt-4 rounded-[16px] px-4 sm:px-8 flex justify-between items-center border-none h-[74px] shadow-lg shadow-black/5 relative`}>
            <div className="z-10">
                <Button
                  type="text"
                  icon={<MenuIcon size={20} />}
                  onClick={() => windowWidth < 1024 ? setIsMobileMenuOpen(true) : setCollapsed(!collapsed)}
                  className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center transition-all"
                />
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block pointer-events-none">
              <Title level={4} className="m-0 font-black text-gray-900 tracking-tight text-sm md:text-base flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                Admin <span className="text-coral">Dashboard</span>
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              </Title>
            </div>
            
            <Space size={16} className="z-10">
              <div className="flex items-center gap-2">
                <Tooltip title="Notifications">
                  <Badge 
                    count={sellers.length + pendingProducts.length + pendingOrders.filter(o => o.paymentStatus === 'pending_verification').length + withdrawals.length + releaseQueue.length + refundQueue.length + inquiryCount} 
                    size="small" 
                    offset={[-2, 2]} 
                    color="#FF6B6B"
                  >
                    <Button 
                      shape="circle" 
                      type="text" 
                      icon={<Bell size={20} className="text-gray-500" />} 
                      className="h-11 w-11 flex items-center justify-center transition-all hover:bg-gray-100/50" 
                    />
                  </Badge>
                </Tooltip>

                <Tooltip title="Refresh All Data">
                   <Button 
                      shape="circle" 
                      type="text" 
                      icon={<RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />} 
                      onClick={fetchData}
                      className="h-11 w-11 flex items-center justify-center transition-all hover:bg-gray-100/50" 
                   />
                </Tooltip>

                <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden sm:block" />

                <Tooltip title="Account">
                  <div className="w-10 h-10 rounded-full bg-coral overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0 cursor-pointer">
                    {user?.picture ? (
                      <img 
                        src={getMediaUrl(user.picture)} 
                        alt="Account" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-bold"
                      style={{ display: user?.picture ? 'none' : 'flex' }}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </Tooltip>
              </div>
            </Space>
          </Header>

          <Content className="px-4 sm:px-8 py-8">
            <div className="max-w-[1200px] mx-auto">
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col mb-3">
                    <div>
                        <Title level={2} className="m-0 font-black text-gray-900 tracking-tight">
                          {activeTab === 'overview' ? <>Dashboard <span className="text-coral">Overview</span></> : 
                           activeTab === 'approvals' ? <>Seller <span className="text-coral">Verification</span></> : 
                           activeTab === 'products' ? <>Product <span className="text-coral">Moderation</span></> : 
                           activeTab === 'sellers' ? <>Seller <span className="text-coral">Management</span></> :
                           activeTab === 'users' ? <>Customer <span className="text-coral">Management</span></> :
                           activeTab === 'orders' ? <>Order <span className="text-coral">Monitoring</span></> :
                           activeTab === 'reviews' ? <>Review <span className="text-coral">Moderation</span></> : 
                           activeTab === 'categories' ? <>Category <span className="text-coral">Management</span></> : 
                           activeTab === 'finance' ? <>Financial <span className="text-coral">Management</span></> :
                           activeTab === 'system_financials' ? <>System <span className="text-coral">Financials</span></> :
                           activeTab === 'inquiries' ? <>Customer <span className="text-coral">Inquiries</span></> :
                           <>System <span className="text-coral">Settings</span></>}
                        </Title>
                        <Text className="text-gray-400 font-medium mt-1 block">
                          {activeTab === 'overview' ? 'Track platform metrics and real-time performance.' :
                           activeTab === 'approvals' ? 'Review and approve new seller registration requests.' :
                           activeTab === 'products' ? 'Quality check and approve new product listings.' :
                           activeTab === 'sellers' ? 'Manage active sellers and their business profiles.' :
                           activeTab === 'users' ? 'Monitor customer activity and shopping history logs.' :
                           activeTab === 'orders' ? 'Review and verify customer payment proofs to approve order transactions.' :
                           activeTab === 'reviews' ? 'Monitor and moderate user reviews and ratings.' :
                           activeTab === 'categories' ? 'Manage product categories and sub-categories.' :
                           activeTab === 'finance' ? 'Monitor platform revenue, escrow funds, and seller payouts.' :
                           activeTab === 'system_financials' ? 'Configure global platform commissions, tax rates, and delivery charges.' :
                           activeTab === 'inquiries' ? 'Manage and respond to messages from the landing page contact form.' :
                           'Configure platform parameters and administrative site preferences.'}
                        </Text>
                    </div>
                </div>
              </div>

              {activeTab === 'overview' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Row gutter={[24, 24]} className="mb-8">
                    <Col xs={24} sm={12} lg={6}>
                      <Card loading={loading} className="border-none shadow-sm bg-[#FFEBEE] hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Users size={24} className="text-coral" />
                          </div>
                          <div>
                            <Text type="secondary" className="text-xs font-bold uppercase tracking-wider text-coral/60">Total Users</Text>
                            <Title level={3} className="m-0 font-black text-gray-900 mt-1">{stats.totalUsers}</Title>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card loading={loading} className="border-none shadow-sm bg-[#FFEBEE] hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <ShieldCheck size={24} className="text-coral" />
                          </div>
                          <div>
                            <Text type="secondary" className="text-xs font-bold uppercase tracking-wider text-coral/60">Verified Sellers</Text>
                            <Title level={3} className="m-0 font-black text-gray-900 mt-1">{stats.totalSellers}</Title>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card 
                        loading={loading} 
                        className={`border-none shadow-sm transition-all ${sellers.length > 0 ? 'bg-[#FFEBEE] animate-border-red' : 'bg-[#f0fdf4] animate-border-green'}`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <UserPlus size={24} className={sellers.length > 0 ? 'text-red-500' : 'text-green-500'} />
                          </div>
                          <div>
                            <Text type="secondary" className={`text-xs font-bold uppercase tracking-wider ${sellers.length > 0 ? 'text-red-500/60' : 'text-green-500/60'}`}>Pending Sellers</Text>
                            <Title level={3} className="m-0 font-black text-gray-900 mt-1">{sellers.length}</Title>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card loading={loading} className="border-none shadow-sm bg-[#FFEBEE] hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <TrendingUp size={24} className="text-coral" />
                          </div>
                          <div>
                            <Text type="secondary" className="text-xs font-bold uppercase tracking-wider text-coral/60">Total Commission</Text>
                            <Title level={3} className="m-0 font-black text-gray-900 mt-1">Rs. {financeStats.totalCommission?.toLocaleString()}</Title>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                      <Card 
                        title={<span className="text-lg font-black text-gray-900">Recent Verification Requests</span>}
                        extra={<Button type="link" className="text-coral font-bold" onClick={() => setActiveTab('approvals')}>View All</Button>}
                        className="border-none shadow-sm"
                        styles={{ body: { padding: 0 } }}
                      >
                        <Table 
                          columns={sellerColumns} 
                          dataSource={sellers.slice(0, 5)} 
                          pagination={false} 
                          loading={loading}
                          rowKey="_id"
                          scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                      <Card title={<span className="text-lg font-black text-gray-900">System Logs</span>} className="border-none shadow-sm h-full">
                         <div className="space-y-6">
                            {[
                              { label: 'Security Scan', color: 'blue', icon: <ShieldCheck size={20} />, time: '2 mins ago' },
                              { label: 'Cloud Sync', color: 'purple', icon: <Activity size={20} />, time: '15 mins ago' },
                              { label: 'DB Optimization', color: 'green', icon: <TrendingUp size={20} />, time: '1 hour ago' },
                            ].map((log, i) => (
                              <div key={i} className="flex items-center gap-4">
                                <div className={`w-10 h-10 bg-${log.color}-50 text-${log.color}-600 rounded-xl flex items-center justify-center`}>
                                  {log.icon}
                                </div>
                                <div className="flex-1">
                                  <p className="m-0 font-bold text-gray-900">{log.label}</p>
                                  <p className="m-0 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{log.time}</p>
                                </div>
                              </div>
                            ))}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                               <div className="bg-coral/5 p-4 rounded-2xl border border-coral/10">
                                  <Text strong className="text-coral block mb-1 uppercase text-[10px] tracking-widest font-black">Admin Notice</Text>
                                  <Text className="text-[11px] text-gray-600 leading-relaxed font-medium">
                                    All AI verification results with score &lt; 50% must be manually reviewed before approval.
                                  </Text>
                               </div>
                            </div>
                         </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {activeTab === 'approvals' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <Card 
                    title={<span className="text-lg font-black text-gray-900 px-6 pt-6 block">Seller Verification Queue</span>}
                    className="border-none shadow-sm rounded-[1.5rem] overflow-hidden"
                    styles={{ body: { padding: 0 } }}
                  >
                    <Table 
                      columns={sellerColumns} 
                      className="premium-table"
                      dataSource={sellers} 
                      loading={loading}
                      rowKey="_id"
                      pagination={false}
                      scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
                    />
                  </Card>
                </div>
              )}

              {activeTab === 'sellers' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1 w-full max-w-xl">
                        <Input 
                          placeholder="Search sellers by store name, owner, or email..." 
                          prefix={<Search size={20} className="text-gray-400 mr-2" />}
                          size="large"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="rounded-2xl border-none h-14 bg-gray-50/50 hover:bg-gray-100 transition-all font-medium text-sm shadow-inner"
                        />
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <Text className="font-black text-gray-400 text-[10px] uppercase tracking-widest shrink-0">Filter Status:</Text>
                        <Select
                          value={sellerFilter}
                          onChange={(value) => setSellerFilter(value)}
                          className="w-full md:w-[200px]"
                          size="large"
                        >
                          <Select.Option value="all">All Verified Sellers</Select.Option>
                          <Select.Option value="active">Active Accounts</Select.Option>
                          <Select.Option value="suspended">Suspended Accounts</Select.Option>
                        </Select>
                      </div>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden rounded-[1.25rem]" styles={{ body: { padding: 0 } }}>
                      <Table 
                        columns={managementColumns} 
                        className="premium-table"
                        dataSource={allSellers.filter(s => {
                          const matchesSearch = 
                            s.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
                          
                          const matchesFilter = sellerFilter === 'all' ? true : 
                                               sellerFilter === 'active' ? s.verificationStatus === 'approved' : 
                                               s.verificationStatus === 'suspended';
                          
                          return matchesSearch && matchesFilter;
                        })} 
                        loading={loading}
                        rowKey="_id"
                        pagination={false}
                        scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
                      />
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <AdminProductModeration 
                    products={pendingProducts} 
                    loading={loading} 
                    onRefresh={fetchData} 
                    windowWidth={windowWidth}
                  />
                </div>
              )}

              {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1 w-full max-w-xl">
                        <Input 
                          placeholder="Search users by name or email address..." 
                          prefix={<Search size={20} className="text-gray-400 mr-2" />}
                          size="large"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="rounded-2xl border-none h-14 bg-gray-50/50 hover:bg-gray-100 transition-all font-medium text-sm shadow-inner"
                        />
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <Text className="font-black text-gray-400 text-[10px] uppercase tracking-widest shrink-0">Account Type:</Text>
                        <Select
                          value={userFilter}
                          onChange={(value) => setUserFilter(value)}
                          className="w-full md:w-[180px]"
                          size="large"
                        >
                          <Select.Option value="all">All Users</Select.Option>
                          <Select.Option value="active">Active Only</Select.Option>
                          <Select.Option value="suspended">Suspended Only</Select.Option>
                        </Select>
                      </div>
                    </div>
                            <Card className="border-none shadow-sm overflow-hidden rounded-[1.25rem]" styles={{ body: { padding: 0 } }}>
                      <Table 
                        columns={userColumns} 
                        className="premium-table"
                        dataSource={usersList.filter(u => {
                          const query = userSearchQuery.toLowerCase();
                          const matchesSearch = u.email?.toLowerCase().includes(query) || 
                                               u.name?.toLowerCase().includes(query);
                          const matchesFilter = userFilter === 'all' ? true : 
                                               userFilter === 'active' ? !u.isBlocked : 
                                               u.isBlocked;
                          return matchesSearch && matchesFilter;
                        })} 
                        loading={loading}
                        rowKey="_id"
                        pagination={false}
                        scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
                      />
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <AdminOrderMonitoring windowWidth={windowWidth} />
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <CategoriesAdmin windowWidth={windowWidth} />
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <AdminReviewModeration windowWidth={windowWidth} />
                </div>
              )}
              {activeTab === 'system_financials' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-0">
                    {/* Top title removed to match global header */}
                  </div>

                  <Row gutter={[32, 32]}>
                    <Col xs={24} lg={16}>
                      <div className="flex flex-col">
                        {/* Commission Settings */}
                        <Card 
                          className="shadow-sm border-none rounded-2xl" 
                          title={<span className="font-bold text-gray-800">Platform Commission</span>}
                          extra={<Tag color="orange" className="font-bold border-none rounded-full px-3">{newCommission}%</Tag>}
                        >
                          <div className="p-6">
                            <div className="flex justify-between mb-6">
                              <Text className="text-gray-400 text-xs font-bold tracking-wider">Current Platform Fee</Text>
                              <Text className="text-coral font-black text-lg">{newCommission}%</Text>
                            </div>
                            <Slider 
                              min={0} 
                              max={50} 
                              step={1} 
                              value={newCommission} 
                              onChange={(val) => setNewCommission(val)}
                              trackStyle={{ backgroundColor: '#FF6B6B', height: 6 }}
                              handleStyle={{ borderColor: '#FF6B6B', width: 20, height: 20 }}
                              railStyle={{ height: 6 }}
                            />
                            <div className="flex justify-between mt-4 text-[10px] text-gray-300 font-bold">
                              <span>0% (Minimum)</span>
                              <span>50% (Maximum)</span>
                            </div>
                          </div>
                        </Card>
                        <div className="h-[10px] w-full" />

                        {/* Tax & Logistics Row */}
                        <Row gutter={[32, 10]}>
                          <Col xs={24} md={12}>
                            <Card 
                              className="shadow-sm border-none rounded-2xl h-full mb-[10px]" 
                              title={<span className="font-bold text-gray-800">Global Tax (VAT)</span>}
                            >
                              <div className="p-6">
                                <div className="flex justify-between items-center mb-8">
                                  <Statistic 
                                    value={newTaxRate} 
                                    suffix="%" 
                                    styles={{ content: { color: '#1890ff', fontWeight: 900, fontSize: 28 } }} 
                                  />
                                  <div className="w-12 h-12 bg-[#FC6A6B]/10 rounded-2xl flex items-center justify-center text-[#FC6A6B] shadow-sm border border-[#FC6A6B]/50">
                                    <Receipt size={24} />
                                  </div>
                                </div>
                                <Slider 
                                  min={0} 
                                  max={25} 
                                  step={0.5} 
                                  value={newTaxRate} 
                                  onChange={(val) => setNewTaxRate(val)}
                                  trackStyle={{ height: 6 }}
                                  handleStyle={{ width: 20, height: 20 }}
                                  railStyle={{ height: 6 }}
                                />
                                <Text className="text-[10px] text-gray-400 font-bold uppercase block mt-6 leading-relaxed">
                                  Platform-wide sales tax applied at checkout.
                                </Text>
                              </div>
                            </Card>
                          </Col>
                          <Col xs={24} md={12}>
                            <Card 
                              className="shadow-sm border-none rounded-2xl h-full mb-[10px]" 
                              title={<span className="font-bold text-gray-800">Logistics Fee</span>}
                            >
                              <div className="p-6">
                                <div className="flex justify-between items-center mb-8">
                                  <Statistic 
                                    value={newDeliveryCharge} 
                                    prefix="Rs." 
                                    styles={{ content: { color: '#fa8c16', fontWeight: 900, fontSize: 28 } }} 
                                  />
                                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100/50">
                                    <Truck size={24} />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                  {[0, 100, 200, 250, 280].map((val) => (
                                    <Button 
                                      key={val}
                                      className={`rounded-xl font-bold text-[10px] h-10 transition-all ${
                                        newDeliveryCharge === val 
                                        ? 'bg-orange-500 text-white border-none shadow-md shadow-orange-100' 
                                        : 'text-gray-400 border-gray-100 hover:text-orange-500 hover:border-orange-200'
                                      }`}
                                      onClick={() => setNewDeliveryCharge(val)}
                                    >
                                      {val === 0 ? 'FREE' : `Rs.${val}`}
                                    </Button>
                                  ))}
                                </div>
                                
                                <Input 
                                  type="number"
                                  placeholder="Custom amount..."
                                  value={newDeliveryCharge}
                                  onChange={(e) => setNewDeliveryCharge(Number(e.target.value))}
                                  className="h-12 rounded-xl border-gray-100 font-bold text-gray-700 shadow-sm"
                                  prefix={<span className="text-gray-300 mr-1">Rs.</span>}
                                />
                              </div>
                            </Card>
                          </Col>
                        </Row>
                        <div className="h-[10px] w-full" />

                        {/* Sync Action */}
                        <Card className="bg-gray-900 border-none rounded-3xl overflow-hidden relative">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div>
                              <Title level={5} className="text-white m-0 font-black tracking-tight mb-1">Global Core Sync</Title>
                              <Text className="text-gray-400 text-xs font-medium">Deploy these financial parameters across the entire system.</Text>
                            </div>
                            <Button 
                              type="primary"
                              size="large"
                              loading={isUpdatingSettings}
                              onClick={async () => {
                                setIsUpdatingSettings(true);
                                const result = await updateGlobalSettings({ 
                                  commissionRate: newCommission, 
                                  deliveryCharge: newDeliveryCharge,
                                  taxRate: newTaxRate
                                });
                                if (result.success) {
                                  toast.success('System Financials Synced!', {
                                    style: { borderRadius: '16px', fontWeight: 'bold' }
                                  });
                                } else {
                                  toast.error(result.error);
                                }
                                setIsUpdatingSettings(false);
                              }}
                              className="h-14 px-10 rounded-2xl bg-coral border-none font-black text-xs tracking-widest hover:scale-105 transition-all"
                            >
                              {isUpdatingSettings ? 'Syncing...' : 'Deploy Changes'}
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </Col>

                    <Col xs={24} lg={8}>
                      <Card 
                        className="shadow-sm border-none rounded-2xl sticky top-8"
                        title={<span className="font-bold text-gray-800">Impact Analysis</span>}
                      >
                        <div className="space-y-6">
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100/50">
                            <Text className="text-[10px] font-black text-gray-400 block mb-6 text-center">Simulation: Rs. 10,000 Order</Text>
                            
                            <div className="space-y-4 mb-6">
                              <div className="flex justify-between text-xs">
                                <Text className="text-gray-500 font-bold">Subtotal</Text>
                                <Text className="font-black">Rs. 10,000</Text>
                              </div>
                              <div className="flex justify-between text-xs">
                                <Text className="text-gray-500 font-bold">Tax ({newTaxRate}%)</Text>
                                <Text className="font-black text-[#FC6A6B]">+ Rs. {(10000 * (newTaxRate/100)).toLocaleString()}</Text>
                              </div>
                              <div className="flex justify-between text-xs">
                                <Text className="text-gray-500 font-bold">Shipping</Text>
                                <Text className="font-black">+ Rs. {newDeliveryCharge.toLocaleString()}</Text>
                              </div>
                              <Divider className="my-3 border-gray-200" />
                              <div className="flex justify-between">
                                <Text className="font-black text-gray-900">User Total</Text>
                                <Text className="font-black text-lg">Rs. {(10000 + (10000 * (newTaxRate/100)) + newDeliveryCharge).toLocaleString()}</Text>
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                              <div className="flex justify-between items-center mb-1">
                                <Text className="text-[10px] font-black text-gray-400 uppercase">Platform Earns ({newCommission}%)</Text>
                                <Text className="text-coral font-black">Rs. {(10000 * (newCommission/100)).toLocaleString()}</Text>
                              </div>
                              <Progress 
                                percent={newCommission} 
                                size="small" 
                                strokeColor="#FF6B6B" 
                                showInfo={false} 
                                className="m-0"
                              />
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                <Text className="text-[10px] font-black text-gray-400 uppercase">Seller Receives</Text>
                                <Text className="text-gray-900 font-black">Rs. {(10000 * (1 - newCommission/100)).toLocaleString()}</Text>
                              </div>
                              <Progress 
                                percent={100 - newCommission} 
                                size="small" 
                                strokeColor="#111" 
                                showInfo={false} 
                                className="m-0"
                              />
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-[#FC6A6B]/10 border border-[#FC6A6B]/50 flex gap-3">
                            <InfoIcon size={18} className="text-[#FC6A6B] shrink-0 mt-0.5" />
                            <Text className="text-[10px] text-[#FC6A6B] font-medium leading-relaxed">
                              Platform commission is applied ONLY to the item subtotal. Tax and shipping fees are passed directly.
                            </Text>
                          </div>
                        </div>

                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {activeTab === 'finance' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                     {/* Finance Stats Row */}
                     <Row gutter={[24, 24]} className="mb-8">
                        {[
                          { title: 'Total Commission', value: financeStats.totalCommission, icon: <TrendingUp size={24} />, color: 'text-coral', bg: 'bg-white', sub: 'Total earnings from platform fees' },
                          { title: 'Total Payout', value: financeStats.totalPayout, icon: <Banknote size={24} />, color: 'text-coral', bg: 'bg-white', sub: 'Total funds transferred to sellers' },
                          { title: 'Total Refund', value: financeStats.totalRefund, icon: <RefreshCw size={24} />, color: 'text-coral', bg: 'bg-white', sub: 'Total funds returned to customers' }
                        ].map((card, i) => (
                          <Col xs={24} md={8} key={i}>
                             <Card className="bg-white border border-gray-100 shadow-sm h-full relative overflow-hidden group transition-all hover:scale-[1.02] rounded-3xl">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-all">
                                   {card.icon}
                                </div>
                                <div className="flex flex-col">
                                   <div className={`w-12 h-12 bg-gray-50 text-coral rounded-2xl flex items-center justify-center mb-4 border border-gray-100`}>
                                      {card.icon}
                                   </div>
                                   <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{card.title}</Text>
                                   <Title level={3} className="m-0 font-black text-coral tracking-tighter">
                                      <span className="text-sm text-gray-300 font-medium mr-1">PKR</span>
                                      {card.value?.toLocaleString()}
                                   </Title>
                                   <Text className="text-[10px] text-gray-400 mt-2 italic">{card.sub}</Text>
                                </div>
                             </Card>
                          </Col>
                        ))}
                      </Row>

                    {/* High-Fidelity Sub-Navigation */}
                    <div className="mb-8 flex justify-center w-full">
                       <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-50 flex flex-wrap justify-center gap-2">
                          {[
                             { id: 'release', label: 'Seller Releases', icon: <Package size={14} />, badge: releaseQueue.length },
                             { id: 'refund', label: 'Customer Refunds', icon: <RefreshCw size={14} />, badge: refundQueue.length },
                             { id: 'history', label: 'Transaction History', icon: <History size={14} />, badge: 0 }
                          ].map((tab) => (
                             <button
                               key={tab.id}
                               onClick={() => setFinanceSubTab(tab.id)}
                               className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2
                                  ${financeSubTab === tab.id 
                                     ? 'bg-coral text-white shadow-lg shadow-coral/20 scale-105' 
                                     : 'text-gray-400 hover:bg-gray-50'}`}
                             >
                                {tab.icon}
                                {tab.label}
                                {tab.badge > 0 && (
                                   <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${financeSubTab === tab.id ? 'bg-white text-coral' : 'bg-coral text-white'}`}>
                                      {tab.badge}
                                   </span>
                                )}
                             </button>
                          ))}
                       </div>
                    </div>

                    <Row gutter={[24, 24]}>
                       <Col span={24} className="min-w-0 max-w-full overflow-hidden">
                          {financeSubTab === 'release' && (
                             <Card 
                               title={<Text className="text-lg font-black text-gray-900 tracking-tight uppercase">Seller Payout Queue</Text>}
                               className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
                               styles={{ 
                                 body: { padding: 0 },
                                 header: { paddingTop: 8, paddingBottom: 8, minHeight: 0 }
                               }}
                               >
                                  <Table 
                                    dataSource={releaseQueue} 
                                    rowKey="_id"
                                    pagination={false}
                                    className="premium-table"
                                    scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
                                    columns={[
                                      {
                                         title: 'Order Date',
                                         key: 'orderDate',
                                         width: 80,
                                         render: (_, record) => (
                                            <div className="flex flex-col gap-0.5 text-left">
                                               <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">#{record.orderId.split('-').pop()}</span>
                                               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide whitespace-nowrap">
                                                  {new Date(record.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                               </span>
                                            </div>
                                         )
                                      },
                                      {
                                        title: 'Product Details', width: 160,
                                        render: (_, record) => (
                                          <div className="flex items-center gap-4 text-left">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
                                              <img 
                                                src={getMediaUrl(record.orderItems?.[0]?.productImage) || 'https://files.catbox.moe/6z7x6v.png'} 
                                                alt="p" 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
                                              />
                                            </div>
                                            <Tooltip 
                                              title={
                                                record.orderItems?.length > 1 
                                                  ? <div className="flex flex-col gap-1">{record.orderItems.map((item, idx) => <span key={idx} className="text-xs">{item.quantity}x {item.productName}</span>)}</div>
                                                  : record.orderItems?.[0]?.productName
                                              }
                                              color="#1f2937"
                                              placement="right"
                                            >
                                              <div className="flex flex-col min-w-0 cursor-pointer hover:bg-gray-50 p-1 -ml-1 rounded-md transition-colors">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-bold text-gray-800 text-xs truncate max-w-[110px]">
                                                    {record.orderItems?.[0]?.productName || 'Handi Craft'}
                                                  </span>
                                                  {record.orderItems?.length > 1 && (
                                                    <span className="px-1.5 py-0.5 bg-coral/10 text-coral rounded-[4px] text-[8px] font-black whitespace-nowrap">
                                                      +{record.orderItems.length - 1}
                                                    </span>
                                                  )}
                                                </div>
                                                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                                  <Store size={8} className="text-coral" /> {record.sellerId?.storeName || 'Homedify Artisan'}
                                                </span>
                                              </div>
                                            </Tooltip>
                                          </div>
                                        )
                                      },
                                      { 
                                         title: 'Seller Details', width: 120, 
                                         render: (_, record) => (
                                            <div className="flex flex-col text-left">
                                               <span className="font-bold text-gray-800 text-[10px] leading-tight truncate uppercase tracking-tighter">{record.sellerId?.storeName || 'Artisan Store'}</span>
                                               <span className="text-[8px] text-gray-400 font-medium lowercase tracking-tight truncate">
                                                 {record.sellerId?.email || (record.sellerId?.email || record.sellerId?.userId?.email || 'no-email') || 'no-email'}
                                               </span>
                                            </div>
                                         ) 
                                      },
                                        {
                                           title: 'Payout Account', width: 120,
                                           render: (_, record) => {
                                             const accNum = record.sellerId?.bankDetails?.accountNumber;
                                             const bank = record.sellerId?.bankDetails?.bankName || 'Wallet';
                                             const isEP = bank.toLowerCase().includes('easypaisa');
                                             const isJC = bank.toLowerCase().includes('jazzcash');

                                             if (!accNum) {
                                               return <Tag color="red" className="text-[7px] font-black uppercase rounded-md border-none px-1.5 py-0.5 m-0">Missing</Tag>;
                                             }

                                             return (
                                               <div className="flex flex-col gap-0.5 text-left">
                                                 <div className="flex items-center gap-1">
                                                   {isEP && <span className="px-1 py-0.5 rounded-[2px] text-[7px] font-black uppercase tracking-widest bg-[#00B551] text-white shadow-sm">EP</span>}
                                                   {isJC && <span className="px-1 py-0.5 rounded-[2px] text-[7px] font-black uppercase tracking-widest bg-[#ED1C24] text-white shadow-sm">JC</span>}
                                                   {!isEP && !isJC && bank && <span className="px-1 py-0.5 rounded-[2px] text-[7px] font-black uppercase tracking-widest bg-gray-100 text-gray-500">{bank.substring(0, 6)}</span>}
                                                 </div>
                                                 <span className="font-mono font-bold text-gray-900 leading-none tracking-tighter" style={{ fontSize: '10px' }}>
                                                   {accNum}
                                                 </span>
                                               </div>
                                             );
                                           }
                                        },
                                        {
                                           title: 'Slip', width: 80,
                                           render: (_, record) => (
                                              <div className="flex items-center justify-center gap-2">
                                                {record.shippingReceipt ? (
                                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in group relative">
                                                    <img 
                                                      src={getMediaUrl(record.shippingReceipt)} 
                                                      alt="slip" 
                                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                                                    />
                                                    <div 
                                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                      onClick={() => window.open(getMediaUrl(record.shippingReceipt), '_blank')}
                                                    >
                                                      <Eye size={12} className="text-white" />
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest italic">None</span>
                                                )}
                                              </div>
                                           )
                                        },
                                        {
                                           title: 'Amount', width: 100, 
                                           align: 'right',
                                           render: (_, record) => {
                                             const payout = record.sellerPayable || (record.total * 0.9);
                                             return (
                                               <div className="flex flex-col items-end">
                                                 <span className="font-black text-coral text-[10px] italic tracking-tighter">Rs.{payout?.toLocaleString()}</span>
                                                 <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest leading-none">Net Payout</span>
                                               </div>
                                             );
                                           }
                                        },
                                        {
                                          title: 'Status', width: 90,
                                          align: 'center',
                                          render: (_, record) => (
                                            <Tag 
                                              color={record.status === 'delivered' ? 'success' : 'warning'}
                                              className="rounded-full px-2 py-0.5 border-none font-medium capitalize text-[7px] tracking-wider m-0"
                                            >
                                              {record.status === 'delivered' ? 'Confirmed' : 'Pending'}
                                            </Tag>
                                          )
                                        },
                                        { 
                                           title: 'Action', width: 60, 
                                           align: 'right',
                                           render: (_, record) => (
                                              <Tooltip title="Release Payout">
                                                <Button 
                                                   type="text"
                                                   onClick={() => { setSelectedFinanceOrder(record); setPayoutModalVisible(true); }}
                                                   className="text-gray-900 hover:bg-gray-100 rounded-xl h-9 w-9 flex items-center justify-center transition-all hover:scale-110 ml-auto"
                                                   icon={<Banknote size={18} />}
                                                />
                                              </Tooltip>
                                           )
                                        }
                                    ]}
                                 />
                              </Card>
                           )}

                          {financeSubTab === 'refund' && (
                             <Card 
                               title={<Text className="text-lg font-black text-gray-900 tracking-tight uppercase">Customer Refund Queue</Text>}
                               className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
                               styles={{ 
                                 body: { padding: 0, overflow: 'hidden' },
                                 header: { paddingTop: 8, paddingBottom: 8, minHeight: 0 }
                               }}
                             >
                                 <Table 
                                    dataSource={refundQueue} 
                                    rowKey="_id"
                                    pagination={false}
                                    className="premium-table"
                                    scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
                                    columns={[
                                        {
                                           title: 'Order Date',
                                           key: 'orderDate',
                                           width: 90,
                                           render: (_, record) => (
                                              <div className="flex flex-col gap-0.5 text-left">
                                                 <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">#{record.orderId.split('-').pop()}</span>
                                                 <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide whitespace-nowrap">
                                                    {new Date(record.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                 </span>
                                              </div>
                                           )
                                        },
                                        {
                                          title: 'Product Details', 
                                          width: 200,
                                          render: (_, record) => (
                                            <div className="flex items-center gap-3 text-left">
                                              <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
                                                <img 
                                                  src={getMediaUrl(record.orderItems?.[0]?.productImage) || 'https://files.catbox.moe/6z7x6v.png'} 
                                                  alt="p" 
                                                  className="w-full h-full object-cover" 
                                                  onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
                                                />
                                              </div>
                                              <Tooltip 
                                                title={
                                                  record.orderItems?.length > 1 
                                                    ? <div className="flex flex-col gap-1">{record.orderItems.map((item, idx) => <span key={idx} className="text-xs">{item.quantity}x {item.productName}</span>)}</div>
                                                    : record.orderItems?.[0]?.productName
                                                }
                                                color="#1f2937"
                                                placement="right"
                                              >
                                                <div className="flex flex-col min-w-0">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-gray-800 text-xs truncate max-w-[120px]">
                                                      {record.orderItems?.[0]?.productName || 'Handi Craft'}
                                                    </span>
                                                    {record.orderItems?.length > 1 && (
                                                      <span className="px-1.5 py-0.5 bg-coral/10 text-coral rounded-[4px] text-[8px] font-black whitespace-nowrap">
                                                        +{record.orderItems.length - 1}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                                    <Store size={8} className="text-coral" /> {record.sellerId?.storeName || 'Homedify Artisan'}
                                                  </span>
                                                </div>
                                              </Tooltip>
                                            </div>
                                          )
                                        },
                                        { 
                                           title: 'Customer', width: 200, 
                                           render: (_, record) => (
                                              <div className="flex flex-col text-left">
                                                 <span className="font-bold text-gray-800 text-[11px] leading-tight truncate">{record.customerId?.name || 'Guest User'}</span>
                                                 <span className="text-[9px] text-gray-400 font-medium lowercase tracking-tight truncate">{record.customerId?.email || 'no-email'}</span>
                                              </div>
                                           ) 
                                        },
                                        {
                                           title: 'Refund Account', width: 210,
                                           render: (_, record) => {
                                             const pMethod = record.paymentId?.paymentMethod || 'Wallet';
                                             const isEP = pMethod.toLowerCase() === 'easypaisa';
                                             const isJC = pMethod.toLowerCase() === 'jazzcash';
                                             const refundNum = record.paymentId?.senderNumber || record.senderNumber || record.customerId?.contactNumber;
                                             return (
                                               <div className="flex flex-col gap-0.5 text-left">
                                                 <div className="flex flex-col gap-0.5">
                                                   <div className="flex items-center gap-1">
                                                     {isEP && <span className="px-1 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest bg-[#00B551] text-white shadow-sm">EasyPaisa</span>}
                                                     {isJC && <span className="px-1 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest bg-[#ED1C24] text-white shadow-sm">JazzCash</span>}
                                                     {!isEP && !isJC && pMethod && <span className="px-1 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest bg-gray-100 text-gray-500">{pMethod === 'cod' ? 'COD' : pMethod}</span>}
                                                   </div>
                                                   <span className="font-mono font-bold text-gray-900 leading-none tracking-tighter" style={{ fontSize: '11px' }}>
                                                     {refundNum || 'Missing'}
                                                   </span>
                                                 </div>
                                               </div>
                                             );
                                           }
                                        },
                                        {
                                           title: 'Amount', width: 130, 
                                           align: 'right',
                                           render: (_, record) => (
                                             <div className="flex flex-col items-end">
                                               <span className="font-black text-rose-500 text-[11px] italic tracking-tighter">Rs. {record.total?.toLocaleString()}</span>
                                               <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none">Full Refund</span>
                                             </div>
                                           )
                                        },
                                        {
                                           title: 'Reason', width: 130, 
                                           align: 'center',
                                           render: (_, record) => (
                                             <Tag color={record.status === 'disputed' ? 'orange' : 'red'} className="font-bold text-[8px] capitalize rounded-md border-none px-2 py-1 shadow-sm m-0 h-auto inline-flex items-center justify-center text-center">
                                               <span className="block w-[60px] whitespace-normal leading-[1.1] break-words text-center mx-auto">
                                                 {record.status?.replace(/_/g, ' ')}
                                               </span>
                                             </Tag>
                                           )
                                        },
                                        { 
                                           title: 'Action', width: 100, 
                                           align: 'right',
                                           render: (_, record) => (
                                              <Tooltip title="Process Refund">
                                                <Button 
                                                   type="text"
                                                   onClick={() => { setSelectedFinanceOrder(record); setRefundModalVisible(true); }}
                                                   className="text-gray-900 hover:bg-gray-100 rounded-xl h-10 w-10 flex items-center justify-center transition-all hover:scale-110 ml-auto"
                                                   icon={<RefreshCw size={20} />}
                                                />
                                              </Tooltip>
                                           )
                                        }
                                     ]}
                                 />
                             </Card>
                          )}

                          {financeSubTab === 'history' && (
                             <Card 
                                title={<Text className="text-lg font-black text-gray-900 tracking-tight uppercase">Platform Transaction History</Text>}
                                className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
                                styles={{ 
                                  body: { padding: 0, overflow: 'hidden' },
                                  header: { paddingTop: 8, paddingBottom: 8, minHeight: 0 }
                                }}
                             >
                                 <Table 
                                   dataSource={pendingOrders.filter(o => ['paid_to_seller', 'refunded', 'completed'].includes(o.paymentStatus) || o.status === 'refunded')}
                                   rowKey="_id"
                                   pagination={false}
                                   className="premium-table"
                                   scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
                                   locale={{ emptyText: <Empty description="No transactions recorded yet" /> }}
                                   columns={[
                                       {
                                         title: 'Order Date',
                                         width: 90,
                                         render: (_, record) => (
                                           <div className="flex flex-col gap-0.5 text-left">
                                             <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">#{record.orderId.split('-').pop()}</span>
                                             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide whitespace-nowrap">
                                               {new Date(record.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                             </span>
                                           </div>
                                         )
                                       },
                                       {
                                         title: 'Product Details', 
                                         width: 200,
                                         render: (_, record) => (
                                           <div className="flex items-center gap-3 text-left">
                                             <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
                                               <img 
                                                 src={getMediaUrl(record.orderItems?.[0]?.productImage) || 'https://files.catbox.moe/6z7x6v.png'} 
                                                 alt="p" 
                                                 className="w-full h-full object-cover" 
                                                 onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
                                               />
                                             </div>
                                             <Tooltip 
                                               title={
                                                 record.orderItems?.length > 1 
                                                   ? <div className="flex flex-col gap-1">{record.orderItems.map((item, idx) => <span key={idx} className="text-xs">{item.quantity}x {item.productName}</span>)}</div>
                                                   : record.orderItems?.[0]?.productName
                                               }
                                               color="#1f2937"
                                               placement="right"
                                             >
                                               <div className="flex flex-col min-w-0">
                                                 <div className="flex items-center gap-1.5">
                                                   <span className="font-bold text-gray-800 text-[11px] truncate max-w-[120px]">
                                                     {record.orderItems?.[0]?.productName || 'Handi Craft'}
                                                   </span>
                                                   {record.orderItems?.length > 1 && (
                                                     <span className="px-1.5 py-0.5 bg-coral/10 text-coral rounded-[4px] text-[8px] font-black whitespace-nowrap">
                                                       +{record.orderItems.length - 1}
                                                     </span>
                                                   )}
                                                 </div>
                                                 <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                                   <Store size={8} className="text-coral" /> {record.sellerId?.storeName || 'Artisan'}
                                                 </span>
                                               </div>
                                             </Tooltip>
                                           </div>
                                         )
                                       },
                                       {
                                         title: 'Type',
                                         width: 100,
                                         render: (_, record) => {
                                           const isRefund = record.paymentStatus === 'refunded' || record.status === 'refunded';
                                           return (
                                             <Tag color={isRefund ? 'blue' : 'green'} className="border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider m-0">
                                               {isRefund ? 'Refund' : 'Payout'}
                                             </Tag>
                                           );
                                         }
                                       },
                                       {
                                         title: 'Recipient Info', width: 150,
                                         render: (_, record) => {
                                           const isRefund = record.paymentStatus === 'refunded' || record.status === 'refunded';
                                           const name = isRefund ? record.customerId?.name : record.sellerId?.storeName;
                                           const info = isRefund 
                                              ? (record.paymentId?.senderNumber || record.senderNumber || record.customerId?.contactNumber)
                                              : (record.sellerId?.bankDetails?.accountNumber || record.sellerId?.email || record.sellerId?.userId?.email);
                                           return (
                                             <div className="flex flex-col text-left">
                                                <Text className="text-[11px] font-black text-gray-900 leading-none">{name || 'Unknown'}</Text>
                                                <Text className="text-[9px] text-gray-400 font-bold tracking-tight mt-1 truncate max-w-[140px] uppercase">{info || 'no-details'}</Text>
                                             </div>
                                           );
                                         }
                                       },
                                       {
                                         title: 'Amount',
                                         align: 'right',
                                         width: 130,
                                         render: (_, record) => {
                                           const isRefund = record.paymentStatus === 'refunded' || record.status === 'refunded';
                                            const amount = isRefund ? record.total : (record.sellerPayable || record.total * ((100 - (commissionRate || 10)) / 100));
                                           return (
                                             <div className="flex flex-col items-end">
                                               <span className={`text-[11px] font-black italic tracking-tighter ${isRefund ? 'text-[#FC6A6B]' : 'text-coral'}`}>
                                                 Rs. {amount?.toLocaleString()}
                                               </span>
                                               <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none">
                                                 {isRefund ? 'Full Refund' : 'Released'}
                                               </span>
                                             </div>
                                           );
                                         }
                                       },
                                       {
                                         title: 'Evidence',
                                         align: 'center',
                                         width: 100,
                                         render: (_, record) => {
                                           const proof = record.payoutProof || record.refundProof;
                                           return proof ? (
                                             <div className="group relative cursor-pointer hover:scale-110 transition-all duration-300 w-10 h-10 mx-auto">
                                                <div className="absolute inset-0 z-20 opacity-0">
                                                  <AntImage 
                                                    src={getMediaUrl(proof)} 
                                                    width="100%"
                                                    height="100%"
                                                    fallback="https://files.catbox.moe/6z7x6v.png"
                                                    preview={{ mask: null }}
                                                  />
                                                </div>
                                                <div className="absolute inset-0 z-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-coral group-hover:text-white group-hover:border-coral group-hover:shadow-md group-hover:shadow-coral/20 transition-all duration-300 shadow-sm">
                                                  <ImageIcon size={14} className="group-hover:scale-125 transition-transform duration-300" />
                                                </div>
                                             </div>
                                           ) : (
                                             <div className="w-8 h-8 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-200 mx-auto">
                                               <X size={12} />
                                             </div>
                                           );
                                         }
                                       }
                                    ]}
                                 />
                             </Card>
                           )}

                          {/* ── Finance Modals ── */}
                          <Modal
                             title={null}
                             open={payoutModalVisible}
                             closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
                             onCancel={() => setPayoutModalVisible(false)}
                             footer={null}
                             centered
                             width={420}
                             styles={{ content: { borderRadius: 32, padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' } }}
                          >
                             {selectedFinanceOrder && (
                                <div className="flex flex-col">
                                   {/* Premium Header */}
                                   <div className="bg-gradient-to-br from-[#10b981] to-[#34d399] p-5 text-white relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 blur-2xl rounded-full -ml-12 -mb-12" />
                                      
                                      <div className="relative z-10 flex flex-col items-center text-center">
                                         <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/30 shadow-inner">
                                            <Banknote size={28} className="text-white" />
                                         </div>
                                         <Title level={3} className="m-0 text-white font-black tracking-tight uppercase text-base">Manual Payout Release</Title>
                                         <div className="flex items-center gap-2 mt-1.5 px-2.5 py-0.5 bg-black/10 backdrop-blur-sm rounded-full border border-white/10">
                                            <Shield size={10} className="text-white/80" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/90">Verified Escrow Release</span>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="p-6 space-y-6 bg-white">
                                      {/* Order Summary Section */}
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                          <div className="flex items-center gap-2">
                                            <Package size={14} className="text-[#10b981]" />
                                            <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Summary</Text>
                                          </div>
                                          <Tag className="m-0 border-none bg-gray-50 text-gray-400 font-bold text-[9px] rounded-md px-2">#{selectedFinanceOrder.orderId?.split('-').pop()}</Tag>
                                        </div>
                                        
                                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50">
                                          <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Seller Net Payout ({100 - (commissionRate || 10)}%)</span>
                                            <span className="font-black text-[#10b981] text-xl italic tracking-tighter">Rs. {(selectedFinanceOrder.total * ((100 - (commissionRate || 10)) / 100)).toLocaleString()}</span>
                                          </div>
                                          <div className="mt-1 px-1">
                                            <span className="text-[8px] text-gray-400 font-bold italic">Note: {commissionRate || 10}% Platform Fee Deducted</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Recipient Bank Details */}
                                      <div className="bg-[#10b981]/5 p-4 rounded-2xl border border-[#10b981]/10 hover:bg-white hover:shadow-md transition-all group">
                                         <div className="flex items-center gap-2 mb-3">
                                           <Building size={12} className="text-[#10b981]" />
                                           <span className="text-[9px] font-black uppercase tracking-widest text-[#059669]">Recipient Bank Info</span>
                                         </div>
                                         <div className="space-y-2">
                                           <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-bold text-gray-400 uppercase">Title</span>
                                              <Text className="text-gray-900 font-black text-[11px] block truncate">{selectedFinanceOrder.sellerId?.bankDetails?.accountTitle || 'N/A'}</Text>
                                           </div>
                                           <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-bold text-gray-400 uppercase">Account</span>
                                              <Text copyable={{ text: selectedFinanceOrder.sellerId?.bankDetails?.accountNumber }} className="text-gray-900 font-black text-[11px] block">{selectedFinanceOrder.sellerId?.bankDetails?.accountNumber || 'N/A'}</Text>
                                           </div>
                                           <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-bold text-gray-400 uppercase">Bank</span>
                                              <Text className="text-gray-400 font-bold text-[9px] block uppercase">{selectedFinanceOrder.sellerId?.bankDetails?.bankName || 'Wallet'}</Text>
                                           </div>
                                         </div>
                                      </div>

                                      {/* Admin Inputs */}
                                      <div className="flex flex-col space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Transfer Reference ID</label>
                                          <Input 
                                             placeholder="Enter bank reference ID..." 
                                             prefix={<CreditCard size={14} className="text-gray-300 mr-2" />}
                                             className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs hover:bg-white focus:bg-white transition-all shadow-inner"
                                             value={payoutReference}
                                             onChange={e => setPayoutReference(e.target.value)}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Payout Proof</label>
                                          <div 
                                            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#10b981]/30 hover:bg-[#10b981]/5 transition-all bg-gray-50/30 cursor-pointer group"
                                            onClick={() => document.getElementById('payout-proof-upload').click()}
                                          >
                                            {payoutProofFile ? (
                                              <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                                  <CheckCircle className="text-green-500" size={24} />
                                                </div>
                                                <Text className="text-[11px] font-black text-gray-900 truncate max-w-[200px]">{payoutProofFile.name}</Text>
                                                <Button type="link" size="small" className="text-[10px] font-bold text-[#10b981] h-auto p-0 transition-colors" onClick={(e) => { e.stopPropagation(); setPayoutProofFile(null); }}>Change Image</Button>
                                              </div>
                                            ) : (
                                              <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                  <Upload size={24} className="text-gray-300" />
                                                </div>
                                                <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Upload Payout Receipt</Text>
                                                <Text className="text-[9px] text-gray-300 font-bold italic">JPEG or PNG (Max 5MB)</Text>
                                              </div>
                                            )}
                                            <input 
                                              type="file" 
                                              id="payout-proof-upload" 
                                              hidden 
                                              onChange={e => setPayoutProofFile(e.target.files[0])}
                                              accept="image/*"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <Button 
                                         type="primary" 
                                         block 
                                         loading={financeLoading}
                                         className="h-14 rounded-[20px] bg-gray-900 hover:bg-black border-none font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                                         onClick={() => handleReleaseEscrow(selectedFinanceOrder._id, payoutReference, payoutProofFile)}
                                         disabled={!payoutReference || !payoutProofFile}
                                      >
                                         Confirm Release
                                      </Button>
                                   </div>
                                </div>
                             )}
                          </Modal>

                          <Modal
                             title={null}
                             open={refundModalVisible}
                             closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
                             onCancel={() => setRefundModalVisible(false)}
                             footer={null}
                             centered
                             width={420}
                             styles={{ content: { borderRadius: 32, padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' } }}
                          >
                             {selectedFinanceOrder && (
                                <div className="flex flex-col">
                                   {/* Premium Header */}
                                   <div className="bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] p-5 text-white relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 blur-2xl rounded-full -ml-12 -mb-12" />
                                      
                                      <div className="relative z-10 flex flex-col items-center text-center">
                                         <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/30 shadow-inner">
                                            <RefreshCw size={28} className="text-white" />
                                         </div>
                                         <Title level={3} className="m-0 text-white font-black tracking-tight uppercase text-base">Process Refund</Title>
                                         <div className="flex items-center gap-2 mt-1.5 px-2.5 py-0.5 bg-black/10 backdrop-blur-sm rounded-full border border-white/10">
                                            <Shield size={10} className="text-white/80" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/90">Secure Escrow Reversal</span>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="p-6 space-y-6 bg-white">
                                      {/* Order Summary Section */}
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                          <div className="flex items-center gap-2">
                                            <Package size={14} className="text-[#FF6B6B]" />
                                            <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</Text>
                                          </div>
                                          <Tag className="m-0 border-none bg-gray-50 text-gray-400 font-bold text-[9px] rounded-md px-2">#{selectedFinanceOrder.orderId?.split('-').pop()}</Tag>
                                        </div>
                                        
                                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50 space-y-4">
                                          {selectedFinanceOrder.orderItems?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center group">
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-[#FF6B6B] text-[10px] border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                                                  {item.quantity}x
                                                </div>
                                                <Text className="font-bold text-gray-700 text-xs truncate max-w-[180px]">{item.productName}</Text>
                                              </div>
                                              <Text className="font-black text-gray-900 text-xs">Rs. {(item.price * item.quantity).toLocaleString()}</Text>
                                            </div>
                                          ))}
                                          <Divider className="my-2 border-gray-100" />
                                          <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total Refund Amount</span>
                                            <span className="font-black text-[#FF6B6B] text-xl italic tracking-tighter">Rs. {selectedFinanceOrder.total?.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Customer & Account Details */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                                          <div className="flex items-center gap-2 mb-2.5">
                                            <User size={11} className="text-[#FF6B6B]" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Recipient</span>
                                          </div>
                                          <Text className="text-gray-900 font-black text-[11px] block truncate">{selectedFinanceOrder.customerId?.name}</Text>
                                          <Text className="text-gray-400 font-bold text-[8.5px] block mt-0.5 tracking-tight">{selectedFinanceOrder.customerId?.contactNumber}</Text>
                                        </div>
                                        <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                                          <div className="flex items-center gap-2 mb-2.5">
                                            <Building size={11} className="text-[#FF6B6B]" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Account Type</span>
                                          </div>
                                          <Text className="text-gray-900 font-black text-[11px] block uppercase tracking-tighter">Wallet / EasyPaisa</Text>
                                          <Text className="text-gray-400 font-bold text-[8.5px] block mt-0.5">Verified Refund Node</Text>
                                        </div>
                                      </div>

                                      {/* Admin Inputs */}
                                      <div className="flex flex-col space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Admin Source Account</label>
                                          <Input 
                                             placeholder="Enter account used for reversal..." 
                                             prefix={<CreditCard size={14} className="text-gray-300 mr-2" />}
                                             className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs hover:bg-white focus:bg-white transition-all shadow-inner"
                                             value={adminAccount}
                                             onChange={e => setAdminAccount(e.target.value)}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Internal Notes</label>
                                          <Input.TextArea 
                                             rows={3}
                                             placeholder="Document the reason for this refund..." 
                                             className="rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-xs font-bold hover:bg-white focus:bg-white transition-all shadow-inner"
                                             onChange={e => setPayoutReference(e.target.value)}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Transfer Proof</label>
                                          <div 
                                            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/5 transition-all bg-gray-50/30 cursor-pointer group"
                                            onClick={() => document.getElementById('refund-proof-upload').click()}
                                          >
                                            {refundProofFile ? (
                                              <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                                  <CheckCircle className="text-green-500" size={24} />
                                                </div>
                                                <Text className="text-[11px] font-black text-gray-900 truncate max-w-[200px]">{refundProofFile.name}</Text>
                                                <Button type="link" size="small" className="text-[10px] font-bold text-[#FF6B6B] h-auto p-0 transition-colors" onClick={(e) => { e.stopPropagation(); setRefundProofFile(null); }}>Change Image</Button>
                                              </div>
                                            ) : (
                                              <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                  <Upload size={24} className="text-gray-300" />
                                                </div>
                                                <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Upload Transaction Receipt</Text>
                                                <Text className="text-[9px] text-gray-300 font-bold italic">JPEG, PNG or PDF (Max 5MB)</Text>
                                              </div>
                                            )}
                                            <input 
                                              type="file" 
                                              id="refund-proof-upload" 
                                              hidden 
                                              onChange={e => setRefundProofFile(e.target.files[0])}
                                              accept="image/*"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <Button 
                                         type="primary" 
                                         block 
                                         loading={financeLoading}
                                         className="h-14 rounded-[20px] bg-gray-900 hover:bg-black border-none font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                                         onClick={() => handleProcessRefund(selectedFinanceOrder._id, payoutReference, refundProofFile, adminAccount)}
                                         disabled={!refundProofFile || !adminAccount}
                                      >
                                         Finalize Refund
                                      </Button>
                                   </div>
                                </div>
                             )}
                          </Modal>
                       </Col>
                    </Row>
                 </div>
               )}
               {activeTab === 'inquiries' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <AdminInquiries windowWidth={windowWidth} />
                </div>
              )}
               {activeTab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <AdminProfile onCancel={() => setActiveTab('overview')} />
                </div>
              )}

            </div>
          </Content>

          <Modal
            title={null}
            open={deleteModalVisible}
            onCancel={() => setDeleteModalVisible(false)}
            footer={null}
            centered
            width={400}
            closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
            styles={{ content: { borderRadius: 32, padding: 32 } }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <Title level={4} className="m-0 font-black text-gray-900 tracking-tight uppercase">Delete Confirmation</Title>
              <Paragraph className="text-gray-400 text-xs font-medium mt-3 leading-relaxed">
                Are you sure you want to delete this <span className="text-red-500 font-bold">{deleteType}</span> account? 
                This action is <span className="text-gray-900 font-black underline">permanent</span> and cannot be undone.
              </Paragraph>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Button 
                className="h-12 rounded-2xl border-none bg-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200"
                onClick={() => setDeleteModalVisible(false)}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                danger
                loading={deleteLoading}
                className="h-12 rounded-2xl border-none font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 bg-red-500 hover:bg-red-600"
                onClick={confirmDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </Modal>

          {/* Rejection Modal */}
          <Modal
            title={<span className="font-black uppercase tracking-tight text-gray-900">Reject <span className="text-coral">{rejectionType === 'shipping' ? 'Shipping' : rejectionType === 'product' ? 'Product' : 'Seller'}</span></span>}
            open={rejectionModalVisible}
            onCancel={() => setRejectionModalVisible(false)}
            footer={null}
            centered
            width={400}
            closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
            styles={{ content: { borderRadius: 32, padding: 32 } }}
          >
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Admin Action Required</span>
                </div>
                <Paragraph className="text-[11px] text-red-800 m-0 leading-relaxed font-medium">
                  Rejecting this will notify the user and ask them to re-submit valid information.
                </Paragraph>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Rejection Reason</label>
                <Input.TextArea 
                  placeholder="Explain why you are rejecting this..." 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-xs font-bold focus:bg-white focus:border-coral transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="h-12 rounded-2xl border-none bg-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200"
                  onClick={() => setRejectionModalVisible(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  loading={actionLoading}
                  className="h-12 rounded-2xl border-none font-black text-[10px] uppercase tracking-widest shadow-lg shadow-coral/20 bg-coral hover:bg-coral"
                  onClick={handleReject}
                >
                  Reject Now
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            title={null}
            open={viewModalVisible}
            onCancel={() => setViewModalVisible(false)}
            footer={null}
            width={720}
            centered
            styles={{ 
              content: { 
                padding: 0, 
                borderRadius: 16, 
                overflow: 'hidden', 
                background: '#ffffff',
                boxShadow: '0 15px 40px rgba(0,0,0,0.08)'
              } 
            }}
            closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
          >
            {selectedSeller && (
              <div className="flex flex-col h-[520px]">
                <div className="px-5 py-2.5 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                  <Title level={5} className="m-0 font-black text-gray-900 tracking-tight text-xs uppercase">
                    {selectedSeller.verificationStatus === 'approved' || selectedSeller.verificationStatus === 'suspended' ? 'Seller Profile' : 'Verification Hub'}
                  </Title>
                  <div 
                    onClick={() => setViewModalVisible(false)}
                    className="group h-7 w-7 flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 hover:bg-[#FF6B6B]"
                  >
                    <X size={16} className="text-gray-300 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  <div className="w-[160px] border-r border-gray-50 bg-gray-50/10 p-3 flex flex-col shrink-0">
                     <div className="flex-1 space-y-1">
                        {[
                           { id: 'basic', label: 'Basic Info', icon: <InfoIcon size={12} /> },
                           { id: 'face', label: 'Face Images', icon: <ImageIcon size={12} /> },
                           { id: 'ai', label: 'AI Review', icon: <Zap size={12} /> }
                        ].map((item) => (
                           <button
                             key={item.id}
                             onClick={() => setModalActiveTab(item.id)}
                             className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all font-bold text-[9px] text-left
                                ${modalActiveTab === item.id 
                                   ? 'bg-white text-coral shadow-sm border border-coral/5' 
                                   : 'text-gray-400 hover:bg-gray-100'}`}
                           >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all
                                 ${modalActiveTab === item.id ? 'bg-coral text-white' : 'bg-gray-100 text-gray-400'}`}>
                                 {item.icon}
                              </div>
                              {item.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden bg-white">
                     <div className={`flex-1 overflow-hidden ${modalActiveTab === 'face' ? 'p-1' : 'p-5'} flex flex-col`}>
                        {modalActiveTab === 'basic' && (
                           <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-2 flex-1 flex flex-col justify-center">
                              {[
                                 { icon: <User size={10} />, label: 'Owner', val: selectedSeller.userId?.name, color: 'bg-coral/5 text-coral' },
                                 { icon: <ShoppingBag size={10} />, label: 'Store', val: selectedSeller.storeName, color: 'bg-[#FC6A6B]/10 text-[#FC6A6B]' },
                                 { icon: <MailIcon size={10} />, label: 'Email', val: selectedSeller.email || selectedSeller.userId?.email || 'no-email', color: 'bg-green-50 text-green-500' },
                                 { icon: <Hash size={10} />, label: 'CNIC', val: selectedSeller.cnicNumber, color: 'bg-orange-50 text-orange-500' },
                                 { icon: <MapPin size={10} />, label: 'Location', val: selectedSeller.storeAddress, color: 'bg-purple-50 text-purple-500' },
                              ].map((item, i) => (
                                 <div key={i} className="flex items-center gap-3 bg-gray-50/30 p-2 rounded-lg border border-gray-50">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.color}`}>
                                       {item.icon}
                                    </div>
                                    <div className="min-w-0">
                                       <Text className="block text-[7px] font-black text-gray-300 uppercase tracking-widest">{item.label}</Text>
                                       <Text className="font-bold text-gray-800 text-[9px] block truncate">{item.val}</Text>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {modalActiveTab === 'face' && (
                           <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full flex flex-col justify-between py-1 px-1 overflow-y-auto custom-scrollbar">
                              {[
                                 { title: 'Identity Document', path: selectedSeller.cnicImages?.front || selectedSeller.cnicImage, icon: <IdCard size={12} className="text-coral" /> },
                                 { title: 'Liveness Capture', path: selectedSeller.selfieImage, icon: <Camera size={12} className="text-green-500" /> }
                              ].map((img, i) => (
                                 <div key={i} className="space-y-1 mb-2 last:mb-0">
                                    <div className="flex items-center justify-between px-1">
                                       <Text className="block text-[7px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                          {img.icon} {img.title}
                                       </Text>
                                    </div>
                                    <div className="relative group bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden min-h-[170px]">
                                       <AntImage 
                                          src={getMediaUrl(img.path)} 
                                          className="max-w-full max-h-[170px] object-contain transition-transform duration-500 group-hover:scale-105" 
                                          crossOrigin="anonymous"
                                          style={{ display: 'block' }}
                                          fallback="https://files.catbox.moe/6z7x6v.png"
                                       />
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {modalActiveTab === 'ai' && (
                           <div className="animate-in fade-in slide-in-from-right-2 duration-300 h-full flex items-center justify-center">
                              <div className="bg-gray-50 rounded-[24px] p-6 border border-gray-100 w-full text-center space-y-4 relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 w-24 h-24 bg-coral/5 blur-3xl rounded-full" />
                                 <Progress 
                                    type="circle" 
                                    percent={selectedSeller.faceMatchScore} 
                                    strokeColor="#FF6B6B"
                                    railColor="#fff"
                                    strokeWidth={12}
                                    size={70}
                                    format={(p) => <span className="text-gray-900 font-black text-xs">{p}%</span>}
                                 />
                                 <div className="space-y-1 px-4 relative z-10">
                                    <Text className="text-gray-900 font-black text-[10px] block uppercase tracking-[0.2em]">Authenticity Rating</Text>
                                    <Paragraph className="text-gray-400 text-[8px] leading-relaxed m-0 italic line-clamp-2 font-medium">
                                       Identity documents and biometric patterns match with high precision. No security threats detected.
                                    </Paragraph>
                                  </div>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="px-6 py-4 border-t border-gray-50 bg-white">
                       <div className="grid grid-cols-2 gap-3">
                           {selectedSeller.verificationStatus === 'approved' || selectedSeller.verificationStatus === 'suspended' ? (
                             <>
                               <Button 
                                  className={`w-full h-10 rounded-xl border-none font-black text-[10px] uppercase tracking-widest transition-all ${selectedSeller.verificationStatus === 'suspended' ? 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white'}`}
                                  onClick={() => handleSuspend(selectedSeller._id)}
                               >
                                  {selectedSeller.verificationStatus === 'suspended' ? 'Activate' : 'Suspend'}
                               </Button>
                               <Button 
                                  type="primary" 
                                  className="w-full h-10 rounded-xl font-black text-[10px] bg-[#FF6B6B] border-none uppercase tracking-widest shadow-lg shadow-coral/20 hover:scale-[1.02] active:scale-95 transition-all"
                                  onClick={() => handleDeleteSeller(selectedSeller._id)}
                               >
                                  Delete Profile
                               </Button>
                             </>
                           ) : (
                             <>
                               <Button 
                                  className="w-full h-10 rounded-xl border-none bg-red-50 text-red-500 font-black text-[10px] hover:bg-red-500 hover:text-white uppercase tracking-widest transition-all"
                                  onClick={() => handleReject(selectedSeller._id)}
                               >
                                  Reject
                               </Button>
                               <Button 
                                  type="primary" 
                                  className="w-full h-10 rounded-xl font-black text-[10px] bg-coral border-none uppercase tracking-widest shadow-lg shadow-coral/20 hover:scale-[1.02] active:scale-95 transition-all"
                                  onClick={() => handleApprove(selectedSeller._id)}
                                >
                                  Approve
                                </Button>
                             </>
                           )}
                         </div>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </Modal>

        </Layout>

        <style jsx="true">{`
          .premium-table .ant-table-thead > tr > th {
            background: #FAFAFA !important;
            color: #8C8C8C !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            font-size: 9px !important;
            letter-spacing: 0.05em !important;
            padding: 8px 10px !important;
            border-bottom: 1px solid rgba(0,0,0,0.03) !important;
          }
          .premium-table .ant-table-tbody > tr > td {
            padding: 8px 10px !important;
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
      </Layout>
    </div>
  </ConfigProvider>
  )
}

export default AdminDashboard
