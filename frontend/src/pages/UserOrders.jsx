import React, { useEffect, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import UserLayout from '../shared/UserLayout'
import { useSettings } from '../context/SettingsContext'
import { calculatePayout } from '../utils/financialUtils'
import { AuthContext } from '../context/AuthContext'
import { 
    Table, Tag, Button, Space, Input, Modal, 
    Typography, Tooltip, Empty, Tabs, Spin, Badge, Avatar, Card,
    Form, Rate
} from 'antd'
import { 
    Search, ShoppingBag, Truck, CheckCircle, 
    XCircle, Clock, ChevronRight, Download, Package, 
    MessageSquare, Star, ArrowRight, Eye, ExternalLink, X
} from 'lucide-react'
import toast from 'react-hot-toast'

const { Title, Text } = Typography

const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    const uploadsIndex = pathStr.indexOf('/uploads/');
    const cleanPath = uploadsIndex !== -1 ? pathStr.substring(uploadsIndex) : `/uploads/${pathStr.split('/').pop()}`;
    return `${backendUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

const UserOrders = () => {
    const { commissionRate } = useSettings()
    const { token, user } = useContext(AuthContext)
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [searchText, setSearchText] = useState('')
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [selectedOrderId, setSelectedOrderId] = useState(null)
    const [cancelling, setCancelling] = useState(false)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)

    // Review Modal States
    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
    const [selectedOrderForReview, setSelectedOrderForReview] = useState(null)
    const [submittingReview, setSubmittingReview] = useState(false)
    const [reviewForm] = Form.useForm()

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        if (token) {
            fetchOrders()
            // Periodic refresh every 30 seconds
            const interval = setInterval(fetchOrders, 30000)
            return () => {
                window.removeEventListener('resize', handleResize)
                clearInterval(interval)
            }
        }
        return () => window.removeEventListener('resize', handleResize)
    }, [token])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/v1/orders/user', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setOrders(res.data.data || [])
        } catch (err) {
            console.error('Fetch orders error:', err)
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = orders.filter(order => {
        const matchesTab = activeTab === 'all' || order.status === activeTab
        const matchesSearch = 
            (order.orderId || order._id).toLowerCase().includes(searchText.toLowerCase()) || 
            (order.orderItems?.[0]?.productName || "").toLowerCase().includes(searchText.toLowerCase())
        return matchesTab && matchesSearch
    })

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) return toast.error('Please provide a reason')
        
        try {
            setCancelling(true)
            await axios.put(`/api/v1/orders/${selectedOrderId}/cancel`, { reason: cancelReason }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Order cancelled successfully')
            setIsCancelModalOpen(false)
            setCancelReason('')
            fetchOrders()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order.')
        } finally {
            setCancelling(false)
        }
    }

    const handleReviewSubmit = async (values) => {
        if (!selectedOrderForReview || !selectedOrderForReview.orderItems || selectedOrderForReview.orderItems.length === 0) {
            toast.error('Invalid order for review')
            return
        }
        
        const productId = selectedOrderForReview.orderItems[0].productId

        setSubmittingReview(true)
        try {
            await axios.post('/api/v1/reviews', {
                productId: productId,
                orderId: selectedOrderForReview._id,
                rating: values.rating,
                reviewText: values.comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            toast.success('Review submitted successfully!')
            setIsReviewModalVisible(false)
            reviewForm.resetFields()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review')
        } finally {
            setSubmittingReview(false)
        }
    }

    const openCancelModal = (orderId) => {
        setSelectedOrderId(orderId)
        setIsCancelModalOpen(true)
    }

    const columns = [
        {
            title: 'Order Date',
            key: 'orderDate',
            width: 140,
            render: (_, record) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                        #{record.orderId?.split('-').pop()}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            )
        },
        {
            title: 'Product Details',
            key: 'product',
            width: 250,
            render: (_, record) => {
                const item = record.orderItems?.[0] || {};
                return (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
                            <img 
                                src={getMediaUrl(item.productImage)} 
                                alt="p" 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
                            />
                        </div>
                        <Tooltip 
                            title={
                                record.orderItems?.length > 1 
                                    ? <div className="flex flex-col gap-1">{record.orderItems.map((i, idx) => <span key={idx} className="text-xs">{i.quantity}x {i.productName}</span>)}</div>
                                    : item.productName
                            }
                            color="#1f2937"
                            placement="right"
                        >
                            <div className="flex flex-col min-w-0 cursor-pointer hover:bg-gray-50 p-1 -ml-1 rounded-md transition-colors">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-800 text-xs truncate max-w-[110px]">
                                        {item.productName || 'Homedify Item'}
                                    </span>
                                    {record.orderItems?.length > 1 && (
                                        <span className="px-1.5 py-0.5 bg-coral/10 text-coral rounded-[4px] text-[8px] font-black whitespace-nowrap">
                                            +{record.orderItems.length - 1}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                    <ShoppingBag size={8} className="text-coral" /> {item.shopName || 'Verified Seller'}
                                </span>
                            </div>
                        </Tooltip>
                    </div>
                )
            }
        },
        {
            title: 'Amount',
            dataIndex: 'total',
            key: 'total',
            width: 110,
            render: (val) => (
                <div className="flex flex-col">
                    <span className="font-bold text-coral text-xs">Rs. {val?.toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Secured</span>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status, record) => {
                let color = 'default'
                if (['delivered', 'completed'].includes(status)) color = 'success'
                if (status === 'shipped') color = 'processing'
                if (['cancelled_by_customer', 'cancelled_by_seller', 'payment_failed'].includes(status)) color = 'error'
                if (['pending_payment', 'confirmed', 'preparing'].includes(status)) color = 'warning'
                
                const isPendingVerification = record.paymentStatus === 'pending_verification';

                return (
                    <Space orientation="vertical" size={1}>
                        <Tag color={color} className="font-bold capitalize text-[8px] px-2.5 py-0.5 rounded-full border-none tracking-wide">
                            {status.replace(/_/g, ' ')}
                        </Tag>
                        {isPendingVerification && (
                            <Tag color="orange" className="mt-1 font-bold capitalize text-[7.5px] px-2 py-0.5 rounded-full border-none tracking-wide">
                                Verifying Payment
                            </Tag>
                        )}
                    </Space>
                )
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            width: 200,
            render: (_, record) => {
                const canCancel = !['shipped', 'delivered', 'completed', 'cancelled_by_customer', 'cancelled_by_seller', 'returned', 'refunded'].includes(record.status)
                
                return (
                    <Space size="middle">
                        {canCancel && (
                            <Tooltip title="Cancel Order">
                                <Button 
                                    type="text" 
                                    icon={<XCircle size={20} />} 
                                    onClick={() => openCancelModal(record._id)}
                                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
                                />
                            </Tooltip>
                        )}
                        {['delivered', 'completed'].includes(record.status) && (
                            <Tooltip title="Write a Review">
                                <Button 
                                    type="text" 
                                    icon={<Star size={20} />} 
                                    onClick={() => {
                                        setSelectedOrderForReview(record)
                                        reviewForm.resetFields()
                                        setIsReviewModalVisible(true)
                                    }}
                                    className="text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
                                />
                            </Tooltip>
                        )}
                        <Tooltip title="View Order">
                            <Button 
                                type="text" 
                                icon={<Eye size={20} />} 
                                onClick={() => navigate(`/customer/orders/${record._id}`)}
                                className="text-gray-400 hover:text-coral hover:bg-coral/5 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
                            />
                        </Tooltip>
                        <Tooltip title="Track Logistics">
                            <Button 
                                type="text" 
                                icon={<Truck size={20} />} 
                                onClick={() => navigate(`/customer/orders/${record._id}`)}
                                className="text-gray-400 hover:text-[#FC6A6B] hover:bg-[#FC6A6B]/10 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
                            />
                        </Tooltip>
                    </Space>
                )
            }
        }
    ]

    return (
        <UserLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                
                {/* Box 1: Search & Tabs Header */}
                <div className="bg-white p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col gap-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="w-full max-w-md">
                            <Input 
                                placeholder="Search Order ID or Product..." 
                                prefix={<Search size={18} className="text-gray-300 group-focus-within:text-coral transition-colors mr-2" />}
                                size="large"
                                className="h-12 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 transition-all text-xs font-bold"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>

                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        className="premium-status-tabs border-none"
                        items={[
                            { 
                                key: 'all', 
                                label: (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">All Orders</span>
                                        <Badge count={orders.length} size="small" style={{ backgroundColor: activeTab === 'all' ? '#ff4d4f' : '#94a3b8' }} />
                                    </div>
                                ) 
                            },
                            { 
                                key: 'confirmed', 
                                label: (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Processing</span>
                                        <Badge count={orders.filter(o => o.status === 'confirmed').length} size="small" style={{ backgroundColor: activeTab === 'confirmed' ? '#ff4d4f' : '#94a3b8' }} />
                                    </div>
                                ) 
                            },
                            { 
                                key: 'shipped', 
                                label: (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">In Transit</span>
                                        <Badge count={orders.filter(o => o.status === 'shipped').length} size="small" style={{ backgroundColor: activeTab === 'shipped' ? '#ff4d4f' : '#94a3b8' }} />
                                    </div>
                                ) 
                            },
                            { 
                                key: 'delivered', 
                                label: (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Delivered</span>
                                        <Badge count={orders.filter(o => ['delivered', 'completed'].includes(o.status)).length} size="small" style={{ backgroundColor: activeTab === 'delivered' ? '#ff4d4f' : '#94a3b8' }} />
                                    </div>
                                ) 
                            },
                            { 
                                key: 'cancelled_by_customer', 
                                label: (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Cancelled</span>
                                        <Badge count={orders.filter(o => o.status === 'cancelled_by_customer').length} size="small" style={{ backgroundColor: activeTab === 'cancelled_by_customer' ? '#ff4d4f' : '#94a3b8' }} />
                                    </div>
                                ) 
                            },
                        ]}
                    />
                </div>

                {/* Box 2: Table Section */}
                <Card className="border-none shadow-sm rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden" styles={{ body: { padding: 0 } }}>
                    <Table 
                        columns={columns} 
                        dataSource={filteredOrders.map(o => ({ ...o, key: o._id }))} 
                        loading={loading}
                        pagination={false}
                        className="premium-table"
                        scroll={{ x: windowWidth < 1200 ? 800 : undefined }}
                        size="small"
                        locale={{
                            emptyText: (
                                <div className="py-24 text-center">
                                    <Empty 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <div className="mt-4">
                                                <Text className="text-gray-400 font-bold block uppercase tracking-widest text-[10px]">No artisan orders found</Text>
                                                <Button 
                                                    type="link" 
                                                    onClick={() => navigate('/shop')}
                                                    className="text-coral font-black uppercase text-[10px] mt-2 p-0"
                                                >
                                                    Continue Shopping <ArrowRight size={12} className="inline ml-1" />
                                                </Button>
                                            </div>
                                        }
                                    />
                                </div>
                            )
                        }}
                    />
                </Card>

                {/* Cancel Order Modal */}
                <Modal
                    title={<span className="font-black text-gray-900 uppercase tracking-widest text-sm">Cancel Order</span>}
                    open={isCancelModalOpen}
                    onCancel={() => { setIsCancelModalOpen(false); setCancelReason(''); }}
                    footer={[
                        <Button key="back" onClick={() => setIsCancelModalOpen(false)} className="rounded-xl font-bold">
                            Dismiss
                        </Button>,
                        <Button 
                            key="submit" 
                            type="primary" 
                            danger 
                            loading={cancelling} 
                            onClick={handleCancelOrder}
                            className="bg-red-500 border-none rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-8"
                        >
                            Confirm Cancellation
                        </Button>
                    ]}
                    centered
                    className="premium-modal"
                    closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
                >
                    <div className="py-4">
                        <Text className="text-gray-500 font-medium mb-4 block">Please tell us why you'd like to cancel this artisan order. This helps our sellers improve their craft.</Text>
                        <Input.TextArea 
                            rows={4} 
                            placeholder="Reason for cancellation..." 
                            className="rounded-2xl border-gray-100 bg-gray-50 p-4 focus:bg-white transition-all font-medium"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                </Modal>

                {/* Review Modal */}
                <Modal
                    title={<span className="text-lg font-black text-gray-900 tracking-[0.05em] uppercase">Write a <span className="text-coral">Review</span></span>}
                    open={isReviewModalVisible}
                    onCancel={() => setIsReviewModalVisible(false)}
                    footer={null}
                    centered
                    width={500}
                    className="premium-modal"
                    closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
                >
                    <div className="pt-4">
                        {selectedOrderForReview && (
                            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                                    <img 
                                        src={getMediaUrl(selectedOrderForReview.orderItems?.[0]?.productImage)} 
                                        alt="Product" 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-gray-900 text-sm truncate">
                                        {selectedOrderForReview.orderItems?.[0]?.productName || 'Handmade Item'}
                                    </span>
                                    <span className="text-[10px] font-bold text-coral uppercase tracking-widest mt-0.5">
                                        Order #{selectedOrderForReview._id.slice(-6)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
                            <Form.Item 
                                name="rating" 
                                label={<Text className="font-black text-[10px] uppercase tracking-widest text-gray-400">Your Rating</Text>} 
                                rules={[{ required: true, message: 'Please select a rating' }]}
                            >
                                <Rate className="text-3xl text-coral" />
                            </Form.Item>
                            <Form.Item 
                                name="comment" 
                                label={<Text className="font-black text-[10px] uppercase tracking-widest text-gray-400">Your Feedback</Text>} 
                                rules={[{ required: true, message: 'Please share your thoughts!' }]}
                            >
                                <Input.TextArea 
                                    rows={4} 
                                    placeholder="What did you love about this product?" 
                                    className="rounded-2xl bg-gray-50 border-none p-5 text-sm focus:bg-white transition-all shadow-inner"
                                />
                            </Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={submittingReview}
                                className="h-14 mt-2 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-coral border-none shadow-xl shadow-coral/20 hover:scale-[1.02] active:scale-95 transition-all w-full"
                            >
                                Submit Review
                            </Button>
                        </Form>
                    </div>
                </Modal>

            </div>

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
                .premium-status-tabs .ant-tabs-nav::before {
                    display: none;
                }
                .premium-status-tabs .ant-tabs-tab {
                    padding: 12px 0 !important;
                    margin: 0 20px 0 0 !important;
                }
                @media (min-width: 768px) {
                    .premium-status-tabs .ant-tabs-tab {
                        margin: 0 32px 0 0 !important;
                    }
                }
                .premium-status-tabs .ant-tabs-tab-btn {
                    color: #94a3b8 !important;
                    transition: all 0.3s !important;
                }
                .premium-status-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #ff4d4f !important;
                }
                .premium-status-tabs .ant-tabs-ink-bar {
                    background: #ff4d4f !important;
                    height: 3px !important;
                    border-radius: 3px 3px 0 0 !important;
                }
                .premium-table .ant-table-content {
                    scrollbar-width: thin;
                    scrollbar-color: #ff4d4f20 transparent;
                }
                .premium-table .ant-table-content::-webkit-scrollbar {
                    height: 4px;
                }
                .premium-table .ant-table-content::-webkit-scrollbar-thumb {
                    background: #ff4d4f20;
                    border-radius: 10px;
                }
            `}</style>
        </UserLayout>
    )
}

export default UserOrders
