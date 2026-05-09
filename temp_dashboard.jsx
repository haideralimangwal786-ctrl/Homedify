import React, { useEffect, useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Layout, Menu, Card, Table, Tag, Badge, Button, Row, Col, Space,
  Typography, ConfigProvider, theme, Avatar, Tooltip, Modal, Statistic,
  Input, Divider, Progress, Image as AntImage, Switch, Empty, Select, Popconfirm
} from 'antd'
import { 
  LayoutDashboard, UserPlus, ShieldCheck, Users, ClipboardList, 
  Bell, Settings, LogOut, Menu as MenuIcon, ExternalLink, 
  CheckCircle, XCircle, CheckCircle2, Fingerprint, Scan, MapPin, Calendar, 
  TrendingUp, Activity, Info, ChevronRight, Search, Clock, 
  Search as SearchIcon, Sparkles, Eye, Phone, Mail, Building,
  FileText, Shield, AlertTriangle, IdCard, ScanFace, Image as ImageIcon,
  History, User, Check, X, RefreshCw, Camera, ShieldCheck as ShieldIcon,
  Zap, ArrowRight, Gavel, FileCheck, Award, Target, Briefcase, Globe,
  ShieldAlert, UserCheck, CreditCard, Box, MapPinned, Info as InfoIcon,
  ShoppingBag, Mail as MailIcon, Hash, Package, Trash2, Slash, Filter, UserX, UserMinus, Tag as TagIcon, Star,
  Wallet, Banknote, Landmark, Store, Upload, ArrowRightCircle
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

const { Header, Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography

const AdminDashboard = () => {
  const { token, user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Modal Sub-Tab State
  const [modalActiveTab, setModalActiveTab] = useState('basic')

  // ── Ultra-Reliable Media URL Helper ──
  const getMediaUrl = (pathStr) => {
    if (!pathStr) return null;
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    if (pathStr.startsWith('/uploads')) {
      return `${backendUrl}${pathStr}`;
    }
    const filename = pathStr.split(/[\\/]/).pop();
    return `${backendUrl}/uploads/${filename}`;
  }

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
  
  // Modal States
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Rejection Modal State
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionId, setRejectionId] = useState(null)
  const [rejectionType, setRejectionType] = useState('seller') // 'seller' or 'product'

  // Finance States
  const [financeStats, setFinanceStats] = useState({
    totalPlatformRevenue: 0, totalEscrow: 0, totalPaid: 0, availableToWithdraw: 0, totalSales: 0
  })
  const [withdrawals, setWithdrawals] = useState([])
  const [releaseQueue, setReleaseQueue] = useState([])
  const [refundQueue, setRefundQueue] = useState([])
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

  useEffect(() => {
    if (!token) return
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statRes, sellerRes, allSellersRes, userRes, prodRes, financeRes, withdrawalRes, orderRes, releaseRes, refundRes] = await Promise.all([
        api.get('/api/v1/admin/stats'),
        api.get('/api/v1/admin/sellers/pending'),
        api.get('/api/v1/admin/sellers'),
        api.get('/api/v1/admin/users'),
        api.get('/api/v1/admin/products/pending'),
        api.get('/api/v1/admin/finance/summary'),
        api.get('/api/v1/payments/withdrawals/all?status=pending'),
        api.get('/api/v1/admin/orders'),
        api.get('/api/v1/admin/finance/release-queue'),
        api.get('/api/v1/admin/finance/refund-queue')
      ])
      
      setStats(statRes.data.data || {})
      setSellers(sellerRes.data.data || [])
      setAllSellers(allSellersRes.data.data || [])
      setUsersList(userRes.data.data || [])
      setPendingProducts(prodRes.data.data || [])
      setFinanceStats(financeRes.data.data || {})
      setWithdrawals(withdrawalRes.data.data || [])
      setPendingOrders(orderRes.data.data || [])
      setReleaseQueue(releaseRes.data.data || [])
      setRefundQueue(refundRes.data.data || [])
      console.log('Dashboard Data Refreshed:', {
        sellers: sellerRes.data.data?.length,
        products: prodRes.data.data?.length,
        withdrawals: withdrawalRes.data.data?.length,
        releaseQueue: releaseRes.data.data?.length,
        refundQueue: refundRes.data.data?.length
      })
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
      await api.put(`/api/v1/admin/sellers/${rejectionId}/reject`, { rejectionReason: rejectionReason })
      toast.success('Seller rejected')
      setSellers(prev => prev.filter(s => s._id !== rejectionId))
      fetchData()
      setRejectionModalVisible(false)
      setRejectionReason('')
      if (viewModalVisible) setViewModalVisible(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error rejecting seller')
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

      await api.put(`/api/v1/admin/orders/${id}/release-payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Escrow released and seller wallet updated!')
      setPayoutModalVisible(false)
      setPayoutReference('')
      setPayoutProofFile(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment')
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

      await api.put(`/api/v1/admin/orders/${id}/process-refund`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Refund processed successfully!')
      setRefundModalVisible(false)
      setPayoutReference('')
      setAdminAccount('')
      setRefundProofFile(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund')
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

  const handleDeleteSeller = async (id) => {
    if (!window.confirm('Are you sure you want to delete this seller? This action cannot be undone.')) return
    try {
      await api.delete(`/api/v1/admin/sellers/${id}`)
      toast.success('Seller deleted successfully')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete seller')
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

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/api/v1/admin/users/${id}`)
      toast.success('User deleted successfully')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete user')
    }
  }

  const menuItems = [
    { key: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { 
      key: 'approvals', 
      icon: <UserPlus size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Seller Requests</span>
          {!collapsed && sellers.length > 0 && (
            <span className="bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center leading-none">
              {sellers.length}
            </span>
          )}
        </div>
      ) 
    },
    { key: 'sellers', icon: <Briefcase size={20} />, label: 'Seller Management' },
    { key: 'users', icon: <Users size={20} />, label: 'Customer Management' },
    { 
      key: 'products', 
      icon: <Package size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Product Moderation</span>
          {!collapsed && pendingProducts.length > 0 && (
            <span className="bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center leading-none">
              {pendingProducts.length}
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'orders', 
      icon: <ClipboardList size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Order Monitoring</span>
          {!collapsed && pendingOrders.filter(o => o.paymentStatus === 'pending_verification').length > 0 && (
            <span className="bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center leading-none">
              {pendingOrders.filter(o => o.paymentStatus === 'pending_verification').length}
            </span>
          )}
        </div>
      )
    },
    { key: 'reviews', icon: <Star size={20} />, label: 'Review Moderation' },
    { key: 'categories', icon: <TagIcon size={20} />, label: 'Category Management' },
    { 
      key: 'finance', 
      icon: <Wallet size={20} />, 
      label: (
        <div className="flex justify-between items-center w-full">
          <span>Financial Management</span>
          {!collapsed && (withdrawals.length + releaseQueue.length + refundQueue.length) > 0 && (
            <span className="bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center leading-none">
              {withdrawals.length + releaseQueue.length + refundQueue.length}
            </span>
          )}
        </div>
      )
    },
    { type: 'divider' },
    { key: 'settings', icon: <Settings size={20} />, label: 'System Settings' },
  ]

  const sellerColumns = [
    {
      title: 'Seller Name',
      dataIndex: ['userId', 'name'],
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar className="bg-coral/10 text-coral font-bold">
            {text ? text[0] : 'S'}
          </Avatar>
          <div className="flex flex-col">
            <Text className="font-bold text-gray-900">{text}</Text>
            <Text type="secondary" className="text-[11px]">{record.userId?.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Store Name',
      dataIndex: 'storeName',
      key: 'storeName',
      render: (text) => <Text className="font-medium text-gray-700">{text}</Text>
    },
    {
      title: 'Registered',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Text className="text-gray-500 text-xs">
          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      )
    },
    {
      title: 'AI Score',
      dataIndex: 'faceMatchScore',
      key: 'score',
      render: (score) => (
        <div className="flex items-center gap-3">
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-orange-400' : 'bg-red-500'}`}
              style={{ width: `${score || 0}%` }}
            />
          </div>
          <Text className="text-[10px] font-black uppercase" style={{ color: score >= 70 ? '#10b981' : score >= 40 ? '#fbbf24' : '#ef4444' }}>
            {score || 0}%
          </Text>
        </div>
      )
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Details">
            <Button 
              type="text"
              shape="circle"
              icon={<Eye size={18} className="text-gray-400 group-hover:text-coral transition-colors" />} 
              onClick={() => openViewModal(record)}
              className="group hover:bg-coral/5 h-10 w-10 flex items-center justify-center rounded-xl transition-all"
            />
          </Tooltip>
          <Tooltip title="Approve Seller">
            <Button 
              type="text"
              icon={<CheckCircle2 size={20} className="text-green-500" />} 
              onClick={() => handleApprove(record._id)}
              className="hover:bg-green-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            />
          </Tooltip>
          <Tooltip title="Reject Seller">
            <Button 
              type="text"
              icon={<XCircle size={20} className="text-red-500" />} 
              onClick={() => openRejectionModal(record._id)}
              className="hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const managementColumns = [
    {
      title: 'Shop Name',
      dataIndex: 'shopName',
      key: 'shopName',
      render: (text) => <Text className="font-bold text-gray-800">{text}</Text>
    },
    {
      title: 'Seller Info',
      dataIndex: ['userId', 'name'],
      key: 'sellerInfo',
      render: (name, record) => (
        <div className="flex flex-col">
          <Text className="font-medium text-gray-700">{name}</Text>
          <Text type="secondary" className="text-[11px]">{record.userId?.email}</Text>
        </div>
      )
    },
    {
      title: 'Documents',
      key: 'docs',
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tag color="blue" className="rounded-md border-none font-bold text-[9px] uppercase px-2">ID</Tag>
          <Tag color="cyan" className="rounded-md border-none font-bold text-[9px] uppercase px-2">Tax</Tag>
        </Space>
      )
    },
    {
      title: 'Total Products',
      dataIndex: 'totalProducts',
      key: 'totalProducts',
      align: 'center',
      render: (count) => (
        <Tag color="blue" className="rounded-full px-3 border-none font-bold">
          {count || 0}
        </Tag>
      )
    },
    {
      title: 'Joining Date',
      dataIndex: 'createdAt',
      key: 'joiningDate',
      align: 'center',
      render: (date) => (
        <Text className="text-gray-500 text-xs">
          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'verificationStatus',
      key: 'status',
      align: 'center',
      render: (status) => (
        <Tag 
          color={status === 'approved' ? 'success' : status === 'suspended' ? 'error' : 'warning'} 
          className="rounded-full px-3 border-none font-bold uppercase text-[10px]"
        >
          {status === 'approved' ? 'Verified' : status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Details">
            <Button 
              type="text"
              shape="circle"
              icon={<Eye size={18} className="text-gray-400 group-hover:text-coral transition-colors" />} 
              onClick={() => openViewModal(record)}
              className="group hover:bg-coral/5 h-10 w-10 flex items-center justify-center rounded-xl transition-all"
            />
          </Tooltip>
          <Tooltip title={record.verificationStatus === 'suspended' ? "Unsuspend Seller" : "Suspend Seller"}>
            <Button 
              type="text"
              shape="circle"
              icon={<Slash size={18} className={record.verificationStatus === 'suspended' ? "text-orange-500" : "text-gray-400"} />} 
              onClick={() => handleSuspend(record._id)}
              className="hover:bg-orange-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all"
            />
          </Tooltip>
          <Tooltip title="Delete Seller">
            <Button 
              type="text"
              shape="circle"
              icon={<Trash2 size={18} className="text-[#FF6B6B]" />} 
              onClick={() => handleDeleteSeller(record._id)}
              className="hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const userColumns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex flex-col">
          <Text className="font-bold text-gray-800 leading-none">{text}</Text>
          <Text className="text-[10px] text-gray-400 font-medium">{record.role}</Text>
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <Text className="font-medium text-gray-600">{text}</Text>
    },
    {
      title: 'Join Date',
      dataIndex: 'createdAt',
      key: 'joinDate',
      align: 'center',
      render: (date) => (
        <Text className="text-gray-400 text-xs">
          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      )
    },
    {
      title: 'Total Spent (PKR)',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      align: 'right',
      render: (amount) => (
        <Text className="font-bold text-coral text-base">
          Rs. {(amount || 0).toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Account Status',
      dataIndex: 'isBlocked',
      key: 'status',
      align: 'center',
      render: (isBlocked) => (
        <Tag 
          color={isBlocked ? 'error' : 'success'} 
          className="rounded-full px-3 border-none font-black uppercase text-[9px] tracking-widest"
        >
          {isBlocked ? 'Blocked' : 'Active'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={16}>
          <Tooltip title={record.isBlocked ? "Unblock Account" : "Block Account"}>
            <Switch 
              checked={!record.isBlocked} 
              onChange={() => handleStatusChange(record._id)}
              size="small"
              className={record.isBlocked ? 'bg-gray-200' : 'bg-coral'}
            />
          </Tooltip>
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user? This action is permanent."
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Account">
              <Button 
                type="text" 
                shape="circle" 
                icon={<Trash2 size={18} className="text-[#FF6B6B]" />} 
                className="hover:bg-red-50 flex items-center justify-center transition-all"
              />
            </Tooltip>
          </Popconfirm>
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
      <Layout className="min-h-screen bg-[#FAFAFA]">
        {/* Sidebar */}
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
              display: 'flex',
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

            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
              <div className={`flex items-center gap-3 bg-gray-50 p-3 rounded-2xl transition-all ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-coral overflow-hidden flex items-center justify-center border border-white shadow-sm shrink-0">
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
                    className="w-full h-full flex items-center justify-center text-white font-bold"
                    style={{ display: user?.picture ? 'none' : 'flex' }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate m-0">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 m-0 uppercase tracking-wider font-bold">Administrator</p>
                  </div>
                )}
                {!collapsed && (
                  <Tooltip title="Logout">
                    <Button 
                      type="text" 
                      icon={<LogOut size={16} className="text-gray-400 hover:text-red-500" />} 
                      onClick={logout}
                      className="p-0 flex items-center justify-center"
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </Sider>

        <Layout style={{ 
          marginLeft: collapsed ? 80 : 280, 
          transition: 'all 0.3s',
          minHeight: '100vh',
          width: 'auto'
        }}>
          <Header className="glass-panel sticky top-4 z-40 mx-6 mt-4 rounded-[16px] px-8 flex justify-between items-center border-none h-[74px] shadow-lg shadow-black/5 relative">
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
                Admin <span className="text-coral">Dashboard</span>
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              </Title>
            </div>
            
            <Space size={16} className="z-10">
              <div className="flex items-center gap-2">
                <Tooltip title="Notifications">
                  <Badge 
                    count={sellers.length + pendingProducts.length + pendingOrders.filter(o => o.paymentStatus === 'pending_verification').length + withdrawals.length + releaseQueue.length + refundQueue.length} 
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

          <Content className="p-8">
            <div className="max-w-[1200px] mx-auto">
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col mb-3">
                    <div>
                        <Title level={2} className="m-0 font-black text-gray-900 tracking-[0.05em] uppercase">
                          {activeTab === 'overview' ? <>Dashboard <span className="text-coral">Overview</span></> : 
                           activeTab === 'approvals' ? <>Seller <span className="text-coral">Verification</span></> : 
                           activeTab === 'products' ? <>Product <span className="text-coral">Moderation</span></> : 
                           activeTab === 'sellers' ? <>Seller <span className="text-coral">Management</span></> :
                           activeTab === 'users' ? <>Customer <span className="text-coral">Management</span></> :
                           activeTab === 'orders' ? <>Order <span className="text-coral">Monitoring</span></> :
                           activeTab === 'reviews' ? <>Review <span className="text-coral">Moderation</span></> : 
                           activeTab === 'categories' ? <>Category <span className="text-coral">Management</span></> : 
                           activeTab === 'finance' ? <>Financial <span className="text-coral">Management</span></> :
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
                            <Activity size={24} className="text-coral" />
                          </div>
                          <div>
                            <Text type="secondary" className="text-xs font-bold uppercase tracking-wider text-coral/60">Revenue (PKR)</Text>
                            <Title level={3} className="m-0 font-black text-gray-900 mt-1">{stats.totalRevenue?.toLocaleString()}</Title>
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
                    title={<span className="text-lg font-black text-gray-900">Seller Verification</span>}
                    className="border-none shadow-sm"
                    styles={{ body: { padding: 0 } }}
                  >
                    <Table 
                      columns={sellerColumns} 
                      dataSource={sellers} 
                      loading={loading}
                      rowKey="_id"
                      pagination={false}
                    />
                  </Card>
                </div>
              )}

              {activeTab === 'sellers' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-gray-50">
                      <div className="flex-1 max-w-xl">
                        <Input 
                          placeholder="Search sellers by store name, owner, or email..." 
                          prefix={<SearchIcon size={20} className="text-gray-400 mr-2" />}
                          size="large"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="rounded-2xl border-gray-100 hover:border-coral focus:border-coral transition-all h-14 bg-gray-50/50"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <Select
                            value={sellerFilter}
                            onChange={(value) => setSellerFilter(value)}
                            className="w-full sm:w-[180px]"
                            popupClassName="premium-select-popup"
                          >
                            <Select.Option value="all">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <Building size={14} className="text-gray-400" /> All Sellers
                              </div>
                            </Select.Option>
                            <Select.Option value="active">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <CheckCircle size={14} className="text-green-500" /> Active Only
                              </div>
                            </Select.Option>
                            <Select.Option value="blocked">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <Slash size={14} className="text-red-500" /> Blocked Only
                              </div>
                            </Select.Option>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden" styles={{ body: { padding: 0 } }}>
                      <Table 
                        columns={managementColumns} 
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
                  />
                </div>
              )}

              {activeTab === 'users' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-gray-50">
                      <div className="flex-1 max-w-xl">
                        <Input 
                          placeholder="Search customers by name or email address..." 
                          prefix={<SearchIcon size={20} className="text-gray-400 mr-2" />}
                          size="large"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="rounded-2xl border-gray-100 hover:border-coral focus:border-coral transition-all h-14 bg-gray-50/50"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <Select
                            value={userFilter}
                            onChange={(value) => setUserFilter(value)}
                            className="w-full sm:w-[180px]"
                            popupClassName="premium-select-popup"
                          >
                            <Select.Option value="all">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <Users size={14} className="text-gray-400" /> All Users
                              </div>
                            </Select.Option>
                            <Select.Option value="active">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <CheckCircle size={14} className="text-green-500" /> Active Only
                              </div>
                            </Select.Option>
                            <Select.Option value="blocked">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <Slash size={14} className="text-red-500" /> Blocked Only
                              </div>
                            </Select.Option>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden" styles={{ body: { padding: 0 } }}>
                      <Table 
                        columns={userColumns} 
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
                      />
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <AdminOrderMonitoring />
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <CategoriesAdmin />
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <AdminReviewModeration />
                </div>
              )}

                {activeTab === 'finance' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                     {/* Finance Stats Row */}
                     <Row gutter={[24, 24]} className="mb-8">
                        {[
                          { title: 'Platform Commission (Revenue)', value: financeStats.totalPlatformRevenue, icon: <TrendingUp size={24} />, color: 'text-green-600', bg: 'bg-green-50', sub: 'Total earned from 10% platform fees' },
                          { title: 'Funds in Escrow (Held)', value: financeStats.totalEscrow, icon: <ShieldCheck size={24} />, color: 'text-orange-500', bg: 'bg-orange-50', sub: 'Payments awaiting seller shipment' },
                          { title: 'Total Paid to Sellers', value: financeStats.totalPaid, icon: <Banknote size={24} />, color: 'text-coral', bg: 'bg-red-50', sub: 'Successfully transferred payouts' }
                        ].map((card, i) => (
                          <Col xs={24} md={8} key={i}>
                             <Card className="border-none shadow-sm h-full relative overflow-hidden group transition-all hover:scale-[1.02]">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-all">
                                   {card.icon}
                                </div>
                                <div className="flex flex-col">
                                   <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-4`}>
                                      {card.icon}
                                   </div>
                                   <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{card.title}</Text>
                                   <Title level={3} className="m-0 font-black text-gray-900 tracking-tighter">
                                      <span className="text-sm text-gray-400 font-medium mr-1">PKR</span>
                                      {card.value?.toLocaleString()}
                                   </Title>
                                   <Text className="text-[10px] text-gray-400 mt-2 italic">{card.sub}</Text>
                                </div>
                             </Card>
                          </Col>
                        ))}
                      </Row>

                    {/* High-Fidelity Sub-Navigation */}
                    <div className="mb-8 flex justify-center">
                       <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-50 flex gap-2">
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
                       <Col span={24}>
                          {financeSubTab === 'release' && (
                             <Card 
                               title={<Text className="text-lg font-black text-gray-900 tracking-tight uppercase">Seller Payout Queue</Text>}
                               className="border-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                               styles={{ body: { padding: 0 } }}
                               >
                              <Table 
                                   dataSource={releaseQueue} 
                                   rowKey="_id"
                                   pagination={false}
                                   className="premium-table"
                                   columns={[
                                      {
                                         title: 'Order Date',
                                         key: 'orderDate',
                                         width: 120,
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
                                        title: 'Product', width: 200,
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
                                            <div className="flex flex-col min-w-0">
                                              <span className="font-bold text-gray-800 text-xs truncate max-w-[140px]">
                                                {record.orderItems?.[0]?.productName || 'Handi Craft'}
                                              </span>
                                              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                                <Store size={8} className="text-coral" /> {record.sellerId?.storeName || 'Homedify Artisan'}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      },
                                      { 
                                         title: 'Seller', width: 180, 
                                         render: (_, record) => (
                                            <div className="flex items-center gap-3 text-left">
                                               <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
                                                 <img 
                                                   src={getMediaUrl(record.sellerId?.logo) || 'https://files.catbox.moe/6z7x6v.png'} 
                                                   className="w-full h-full object-cover" 
                                                   alt="S" onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
                                                 />
                                               </div>
                                               <div className="flex flex-col min-w-0">
                                                  <Text className="font-black text-gray-900 text-[10px] uppercase leading-tight whitespace-nowrap truncate">{record.sellerId?.storeName}</Text>
                                                  <Text className="text-[9px] text-gray-400 font-medium lowercase italic leading-none truncate">{record.sellerId?.userId?.email}</Text>
                                               </div>
                                            </div>
                                         ) 
                                      },
                                      { 
                                         title: 'Courier', width: 100, 
                                         dataIndex: 'shippingReceipt', 
                                         align: 'center',
                                         render: (slip) => (
                                            <div className="flex justify-center">
                                               {slip ? (
                                                 <div className="group relative cursor-pointer hover:scale-110 transition-all duration-300 w-10 h-10">
                                                    <div className="absolute inset-0 z-20 opacity-0">
                                                      <AntImage 
                                                        src={getMediaUrl(slip)} 
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
                                                 <div className="w-10 h-10 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-200">
                                                   <FileText size={14} />
                                                 </div>
                                               )}
                                            </div>
                                         ) 
                                                                         { 
                                          title: 'Payout Account', width: 180, 
                                          render: (_, record) => {
                                             const accNum = record.sellerId?.bankDetails?.accountNumber;
                                             const bank = record.sellerId?.bankDetails?.bankName || 'Wallet';
                                             const isEP = bank.toLowerCase() === 'easypaisa';
                                             const isJC = bank.toLowerCase() === 'jazzcash';

                                             return (
                                                <div className="flex flex-col text-left">
                                                   <div className="flex items-center gap-1.5">
                                                      <Text copyable={accNum ? { text: accNum } : false} className={`font-bold text-[11px] leading-tight ${accNum ? 'text-gray-800' : 'text-red-400 italic'}`}>
                                                         {accNum || 'Account Missing'}
                                                      </Text>
                                                      {(isEP || isJC) && (
                                                         <span className={`px-1 rounded-[4px] text-[7px] font-black uppercase tracking-tighter ${isEP ? 'bg-[#00B551] text-white' : 'bg-[#ED1C24] text-white'}`}>
                                                            {bank}
                                                         </span>
                                                      )}
                                                   </div>
                                                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic leading-none mt-0.5">
                                                      {bank} • {record.sellerId?.bankDetails?.accountTitle || record.sellerId?.storeName || 'Artisan Account'}
                                                   </span>
                                                </div>
                                             );
                                          }
                                       },
                                      { 
                                         title: 'Amount', width: 120, 
                                         align: 'right',
                                         render: (_, record) => {
                                           const gross = record.total || 0;
                                           const commission = gross * 0.1;
                                           const net = gross - commission;
                                           return (
                                             <div className="flex flex-col items-end">
                                               <span className="text-[12px] font-black text-coral italic tracking-tighter">Rs. {net.toLocaleString()}</span>
                                               <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none">Net Payout (90%)</span>
                                             </div>
                                           )
                                         }
                                      },
                                      { 
                                         title: 'Actions', width: 100, 
                                         align: 'right',
                                         render: (_, record) => (
                                            <Button 
                                               type="primary"
                                               className="bg-gray-900 hover:bg-black border-none font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-6 shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-95 transition-all"
                                               onClick={() => {
                                                 setSelectedFinanceOrder(record);
                                                 setPayoutModalVisible(true);
                                               }}
                                            >
                                               <ArrowRightCircle size={18} />
                                            </Button>
                                         )
                                      }
                                   ]}
                                />
                             </Card>
                          )}

                          {financeSubTab === 'refund' && (
                             <Card 
                               title={<Text className="text-lg font-black text-gray-900 tracking-tight uppercase">Customer Refund Queue</Text>}
                               className="border-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                               styles={{ body: { padding: 0 } }}
                               >
                                  <Table 
                                   dataSource={refundQueue} 
                                   rowKey="_id"
                                   pagination={false}
                                   className="premium-table"
                                   columns={[
                                       {
                                         title: 'Order Date',
                                         key: 'orderDate',
                                         width: 120,
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
                                         title: 'Product',
                                         width: 200,
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
                                             <div className="flex flex-col min-w-0">
                                               <span className="font-bold text-gray-800 text-xs truncate max-w-[140px]">
                                                 {record.orderItems?.[0]?.productName || 'Handi Craft'}
                                               </span>
                                               <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                                 <Store size={8} className="text-coral" /> {record.sellerId?.storeName || 'Homedify Artisan'}
                                               </span>
                                             </div>
                                           </div>
                                         )
                                       },
                                       {
                                         title: 'Customer',
                                         width: 180,
                                         render: (_, record) => (
                                           <div className="flex flex-col text-left min-w-0">
                                             <span className="font-bold text-gray-800 text-[11px] leading-tight truncate">{record.customerId?.name || 'Guest User'}</span>
                                             <span className="text-[9px] text-gray-400 font-medium lowercase tracking-tight truncate">{record.customerId?.email || 'no-email'}</span>
                                           </div>
                                         )
                                       },
                                       {
                                         title: 'Refund Account',
                                         width: 180,
                                         render: (_, record) => {
                                           const pMethod = record.paymentId?.paymentMethod || 'Wallet';
                                           const isEP = pMethod.toLowerCase() === 'easypaisa';
                                           const isJC = pMethod.toLowerCase() === 'jazzcash';
                                           const refundNum = record.paymentId?.senderNumber || record.senderNumber || record.customerId?.contactNumber;
                                           
                                           return (
                                             <div className="flex flex-col text-left">
                                               <div className="flex items-center gap-1.5">
                                                 <Text copyable={refundNum ? { text: refundNum } : false} className={`font-bold text-[11px] leading-tight ${refundNum ? 'text-gray-800' : 'text-red-400 italic'}`}>
                                                   {refundNum || 'Number Missing'}
                                                 </Text>
                                                 {(isEP || isJC) && (
                                                   <span className={`px-1 rounded-[4px] text-[7px] font-black uppercase tracking-tighter ${isEP ? 'bg-[#00B551] text-white' : 'bg-[#ED1C24] text-white'}`}>
                                                     {pMethod}
                                                   </span>
                                                 )}
                                               </div>
                                               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic leading-none mt-0.5">
                                                 {pMethod === 'cod' ? 'Cash on Delivery' : `${pMethod} Source Number`}
                                               </span>
                                             </div>
                                           );
                                         }
                                       },
                                       {
                                         title: 'Amount',
                                         dataIndex: 'total',
                                         align: 'right',
                                         width: 120,
                                         render: (total) => (
                                           <div className="flex flex-col items-end">
                                             <span className="text-[12px] font-black text-rose-500 italic tracking-tighter">Rs. {total?.toLocaleString()}</span>
                                             <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none">Full Refund</span>
                                           </div>
                                         )
                                       },
                                       {
                                         title: 'Reason',
                                         dataIndex: 'status',
                                         align: 'center',
                                         width: 100,
                                         render: (status) => (
                                           <Tag color={status === 'disputed' ? 'orange' : 'red'} className="font-black text-[9px] uppercase rounded-md border-none px-2 py-0.5 shadow-sm">
                                             {status?.replace(/_/g, ' ')}
                                           </Tag>
                                         )
                                       },
                                       {
                                         title: 'Action',
                                         align: 'right',
                                         width: 80,
                                         render: (_, record) => (
                                           <Tooltip title="Process Refund">
                                             <Button 
                                               type="primary" 
                                               shape="circle"
                                               icon={<RefreshCw size={18} className="animate-spin-slow" />}
                                               className="bg-blue-500 hover:bg-blue-600 border-none flex items-center justify-center h-11 w-11 shadow-lg shadow-blue-100 hover:scale-110 active:scale-95 transition-all"
                                               onClick={() => {
                                                 setSelectedFinanceOrder(record);
                                                 setRefundModalVisible(true);
                                               }}
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
                                className="border-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                                styles={{ body: { padding: 0 } }}
                             >
                                <Table 
                                   dataSource={pendingOrders.filter(o => ['paid_to_seller', 'refunded', 'completed'].includes(o.paymentStatus) || o.status === 'refunded')}
                                   rowKey="_id"
                                   pagination={false}
                                   className="premium-table"
                                   locale={{ emptyText: <Empty description="No transactions recorded yet" /> }}
                                   columns={[
                                      {
                                        title: 'Transaction Date',
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
                                            <div className="flex flex-col min-w-0">
                                              <span className="font-bold text-gray-800 text-xs truncate max-w-[140px]">
                                                {record.orderItems?.[0]?.productName || 'Handi Craft'}
                                              </span>
                                              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                                <Store size={8} className="text-coral" /> {record.sellerId?.storeName || 'Homedify Artisan'}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      },
                                      {
                                         title: 'Financial Details',
                                         width: 200,
                                         render: (_, record) => {
                                           const isRefund = record.paymentStatus === 'refunded' || record.status === 'refunded';
                                           if (isRefund) {
                                              const pMethod = record.paymentId?.paymentMethod || 'Wallet';
                                              const refundNum = record.paymentId?.senderNumber || record.senderNumber || record.customerId?.contactNumber;
                                              return (
                                                <div className="flex flex-col text-left">
                                                  <Text className="text-[10px] font-black text-gray-900 uppercase">Customer Refund</Text>
                                                  <div className="flex items-center gap-1">
                                                    <Text className="text-[11px] font-medium text-gray-400">{refundNum || 'N/A'}</Text>
                                                    <Tag className="bg-gray-100 border-none text-[8px] font-black text-gray-400 uppercase rounded px-1">{pMethod}</Tag>
                                                  </div>
                                                </div>
                                              );
                                           } else {
                                              return (
                                                <div className="flex flex-col text-left">
                                                  <Text className="text-[10px] font-black text-gray-900 uppercase">
                                                    {record.sellerId?.bankDetails?.accountTitle || record.sellerId?.storeName || 'Artisan Payout'}
                                                  </Text>
                                                  <div className="flex items-center gap-1">
                                                    <Text className="text-[11px] font-medium text-gray-400">
                                                      {record.sellerId?.bankDetails?.accountNumber || 'N/A'}
                                                    </Text>
                                                    <Tag className="bg-gray-100 border-none text-[8px] font-black text-gray-400 uppercase rounded px-1">
                                                      {record.sellerId?.bankDetails?.bankName || 'Wallet'}
                                                    </Tag>
                                                  </div>
                                                </div>
                                              );
                                           }
                                         }
                                       },
                                       {
                                         title: 'Recipient',
                                         width: 180,
                                         render: (_, record) => {
                                           const isRefund = record.paymentStatus === 'refunded' || record.status === 'refunded';
                                           return (
                                             <div className="flex items-center gap-3 text-left">
                                               <div className={`w-10 h-10 rounded-xl ${isRefund ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-green-50 text-green-500 border-green-100'} border flex items-center justify-center shrink-0 shadow-sm`}>
                                                 {isRefund ? <User size={16} /> : <Store size={16} />}
                                               </div>
                                               <div className="flex flex-col">
                                                 <Text className="font-black text-gray-900 text-[10px] uppercase leading-tight">
                                                   {isRefund ? record.customerId?.name : record.sellerId?.storeName}
                                                 </Text>
                                                 <Text className="text-[9px] text-gray-400 font-medium italic leading-none">
                                                   {isRefund ? record.customerId?.email : record.sellerId?.userId?.email}
                                                 </Text>
                                               </div>
                                             </div>
                                           );
                                         }
                                       },
                                      {
                                        title: 'Amount',
                                        render: (_, record) => {
                                          const isRefund = record.paymentStatus === 'refunded' || record.status === 'refunded';
                                          const amount = isRefund ? record.total : (record.sellerPayable || record.total * 0.9);
                                          return (
                                            <div className="flex items-center justify-end gap-2">
                                              <div className="flex flex-col items-end">
                                                <span className={`text-[12px] font-black italic tracking-tighter ${isRefund ? 'text-blue-500' : 'text-green-600'}`}>
                                                  Rs. {amount?.toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none">Finalized</span>
                                              </div>
                                              <CheckCircle size={14} className={isRefund ? 'text-blue-500' : 'text-green-500'} />
                                            </div>
                                          );
                                        }
                                      },
                                      {
                                        title: 'Evidence',
                                        align: 'right',
                                        render: (_, record) => {
                                          const proof = record.payoutProof || record.refundProof;
                                          return (
                                            <div className="flex justify-end">
                                              {proof ? (
                                                <div className="group relative cursor-pointer hover:scale-110 transition-all duration-300 w-10 h-10">
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
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-200">
                                                  <FileText size={14} />
                                                </div>
                                              )}
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
                             onCancel={() => setPayoutModalVisible(false)}
                             footer={null}
                             centered
                             width={440}
                             styles={{ content: { borderRadius: 32, padding: 32 } }}
                          >
                             {selectedFinanceOrder && (
                                <div className="space-y-6">
                                   <div className="text-center">
                                      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                         <Banknote size={32} />
                                      </div>
                                      <Title level={4} className="m-0 font-black text-gray-900 tracking-tight uppercase">Manual Escrow Release</Title>
                                      <Paragraph className="text-gray-400 text-xs font-medium mt-2 leading-relaxed">
                                         Confirming this will mark the order as <span className="text-gray-900 font-black">Completed</span>. Ensure the transfer is successful.
                                      </Paragraph>
                                   </div>

                                   <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                                      <div className="flex justify-between items-center">
                                         <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Details</Text>
                                         <div className="text-right">
                                           <Text className="text-gray-900 font-black text-sm block uppercase leading-none">{selectedFinanceOrder.sellerId?.bankDetails?.accountTitle}</Text>
                                           <Text copyable={{ text: selectedFinanceOrder.sellerId?.bankDetails?.accountNumber }} className="text-gray-400 font-bold text-[11px] block mt-1">{selectedFinanceOrder.sellerId?.bankDetails?.accountNumber}</Text>
                                         </div>
                                      </div>
                                      <Divider className="m-0 border-gray-200" />
                                      <div className="flex justify-between items-center">
                                         <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payout (90%)</Text>
                                         <Text className="text-coral font-black text-xl italic">Rs. {(selectedFinanceOrder.total * 0.9).toLocaleString()}</Text>
                                      </div>
                                   </div>

                                   <div className="space-y-4">
                                      <div>
                                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Payout Reference / ID</Text>
                                        <Input 
                                           placeholder="Enter bank reference ID..." 
                                           className="h-12 rounded-xl border-gray-100 bg-gray-50 font-bold"
                                           onChange={e => setPayoutReference(e.target.value)}
                                        />
                                      </div>

                                      <div>
                                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Payment Proof (Screenshot)</Text>
                                        <div 
                                          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-coral/30 transition-all bg-gray-50/50 cursor-pointer"
                                          onClick={() => document.getElementById('payout-proof-upload').click()}
                                        >
                                          {payoutProofFile ? (
                                            <div className="flex flex-col items-center gap-1">
                                              <CheckCircle className="text-green-500" size={24} />
                                              <Text className="text-[10px] font-black text-gray-900 truncate max-w-full">{payoutProofFile.name}</Text>
                                              <Button type="link" size="small" className="text-[10px] h-auto p-0" onClick={(e) => { e.stopPropagation(); setPayoutProofFile(null); }}>Change</Button>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col items-center gap-1">
                                              <Upload size={20} className="text-gray-300" />
                                              <Text className="text-[10px] font-black text-gray-400 uppercase">Upload Receipt</Text>
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
                                      className="h-14 rounded-2xl bg-gray-900 hover:bg-black border-none font-black text-[12px] uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                                      onClick={() => handleReleaseEscrow(selectedFinanceOrder._id, payoutReference, payoutProofFile)}
                                      disabled={!payoutReference || !payoutProofFile}
                                   >
                                      Confirm Payout
                                   </Button>
                                </div>
                             )}
                          </Modal>

                          <Modal
                             title={null}
                             open={refundModalVisible}
                             onCancel={() => setRefundModalVisible(false)}
                             footer={null}
                             centered
                             width={400}
                             styles={{ content: { borderRadius: 32, padding: 28, overflow: 'hidden' } }}
                          >
                             {selectedFinanceOrder && (
                                <div className="space-y-6">
                                   <div className="text-center">
                                      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                         <RefreshCw size={24} className="animate-spin-slow" />
                                      </div>
                                      <Text className="m-0 font-bold text-gray-900 tracking-tight capitalize text-sm block">Confirm Refund</Text>
                                      <Paragraph className="text-gray-400 text-[8.5px] font-bold capitalize tracking-widest mt-1 leading-relaxed opacity-60">
                                         Security Protocol • Escrow Reversal
                                      </Paragraph>
                                   </div>

                                   <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                                      <div className="flex justify-between items-center">
                                         <Text className="text-[8.5px] font-bold text-gray-400 capitalize tracking-widest">Refund Account</Text>
                                         <div className="text-right">
                                           <Text className="text-gray-900 font-bold text-[11px] block capitalize leading-none">{selectedFinanceOrder.customerId?.name}</Text>
                                           <Text className="text-gray-400 font-medium text-[9px] block mt-0.5">{selectedFinanceOrder.customerId?.contactNumber}</Text>
                                         </div>
                                      </div>
                                      <Divider className="m-0 border-gray-200" />
                                      <div className="flex justify-between items-center">
                                         <Text className="text-[8.5px] font-bold text-gray-400 capitalize tracking-widest">Full Refund</Text>
                                         <Text className="text-blue-500 font-bold text-base italic">Rs. {selectedFinanceOrder.total?.toLocaleString()}</Text>
                                      </div>
                                   </div>

                                   <div className="space-y-4">
                                      <div>
                                        <Text className="text-[8.5px] font-bold text-gray-400 capitalize tracking-widest block mb-1.5 ml-1">Admin Source Account</Text>
                                        <Input 
                                           placeholder="Sending account number..." 
                                           className="h-10 rounded-xl border-gray-100 bg-gray-50 font-medium text-[10.5px] px-4"
                                           value={adminAccount}
                                           onChange={e => setAdminAccount(e.target.value)}
                                        />
                                      </div>

                                      <div>
                                        <Text className="text-[8.5px] font-bold text-gray-400 capitalize tracking-widest block mb-1.5 ml-1">Internal Notes</Text>
                                        <Input.TextArea 
                                           rows={2}
                                           placeholder="Reason for refund..." 
                                           className="rounded-xl border-gray-100 bg-gray-50 font-medium text-[10.5px]"
                                           onChange={e => setPayoutReference(e.target.value)}
                                        />
                                      </div>

                                      <div>
                                        <Text className="text-[8.5px] font-bold text-gray-400 capitalize tracking-widest block mb-1.5 ml-1">Transfer Proof</Text>
                                        <div 
                                          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue/30 transition-all bg-gray-50/50 cursor-pointer"
                                          onClick={() => document.getElementById('refund-proof-upload').click()}
                                        >
                                          {refundProofFile ? (
                                            <div className="flex flex-col items-center gap-1">
                                              <CheckCircle className="text-blue-500" size={18} />
                                              <Text className="text-[8.5px] font-bold text-gray-900 truncate max-w-full">{refundProofFile.name}</Text>
                                              <Button type="link" size="small" className="text-[8.5px] h-auto p-0" onClick={(e) => { e.stopPropagation(); setRefundProofFile(null); }}>Change</Button>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col items-center gap-1">
                                              <Upload size={16} className="text-gray-300" />
                                              <Text className="text-[8.5px] font-bold text-gray-400 capitalize">Upload Screenshot</Text>
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
                                      className="h-11 rounded-2xl bg-blue-500 hover:bg-blue-600 border-none font-bold text-[10px] capitalize tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all mt-2"
                                      onClick={() => handleProcessRefund(selectedFinanceOrder._id, payoutReference, refundProofFile, adminAccount)}
                                      disabled={!refundProofFile || !adminAccount}
                                   >
                                      Finalize Refund
                                   </Button>
                                </div>
                             )}
                          </Modal>


                       </Col>
                    </Row>
                 </div>
               )}


              {activeTab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <AdminProfile onCancel={() => setActiveTab('overview')} />
                </div>
              )}
            </div>
          </Content>
        </Layout>

        {/* ── Modal ── */}
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
          closeIcon={null}
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
                               { icon: <ShoppingBag size={10} />, label: 'Store', val: selectedSeller.storeName, color: 'bg-blue-50 text-blue-500' },
                               { icon: <MailIcon size={10} />, label: 'Email', val: selectedSeller.userId?.email, color: 'bg-green-50 text-green-500' },
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
    </ConfigProvider>
  )
}

export default AdminDashboard
