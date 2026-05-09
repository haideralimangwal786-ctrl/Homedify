import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import UserLayout from '../shared/UserLayout'
import { 
    Table, Tag, Empty, Button, Spin, Space, Tooltip, Card, Typography, Row, Col,
    Modal, Form, Input, Rate
} from 'antd'
import {
    Heart, ShoppingBag, ShoppingCart, Package,
    ArrowRight, Clock, CheckCircle, Truck, TrendingUp, Star, Sparkles, Store,
    MapPin, UserCircle, Settings, ChevronRight, Zap, Headphones, X
} from 'lucide-react'
import faviconWhite from '../assets/favicon_white.png'
import toast from 'react-hot-toast'

const { Title, Text } = Typography
const INACTIVE = ['delivered', 'completed', 'cancelled_by_customer', 'cancelled_by_seller', 'payment_failed', 'returned', 'refunded']

// ─── Premium Stat Card ────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, to, className = "bg-[#FFEBEE]" }) => (
    <Link to={to}>
        <Card className={`border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl ${className}`}>
            <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-coral">
                    {React.cloneElement(icon, { size: 24, className: className.includes('green') ? 'text-green-500' : 'text-coral' })}
                </div>
                <div>
                    <Text type="secondary" className="text-xs font-bold uppercase tracking-wider text-coral/60">{label}</Text>
                    <Title level={3} className="m-0 font-black text-gray-900 mt-1">{value}</Title>
                </div>
            </div>
        </Card>
    </Link>
)

const UserDashboard = () => {
    const { user } = useContext(AuthContext)
    const [orders, setOrders] = useState([])
    const [wishlist, setWishlist] = useState([])
    const [loading, setLoading] = useState(true)

    // Review Modal States
    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false)
    const [selectedOrderForReview, setSelectedOrderForReview] = useState(null)
    const [submittingReview, setSubmittingReview] = useState(false)
    const [reviewForm] = Form.useForm()

    const handleReviewSubmit = async (values) => {
        if (!selectedOrderForReview || !selectedOrderForReview.orderItems || selectedOrderForReview.orderItems.length === 0) {
            toast.error('Invalid order for review')
            return
        }
        
        const token = localStorage.getItem('token')
        const productId = selectedOrderForReview.orderItems[0].productId || selectedOrderForReview.orderItems[0].product

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

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('token')
                const oRes = await axios.get('/api/v1/orders/user', { headers: { Authorization: `Bearer ${token}` } })
                let data = oRes.data.data || oRes.data.orders || []
                
                setOrders(data)
                setWishlist(JSON.parse(localStorage.getItem('homedify_wishlist') || '[]'))
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        
        loadData()
        // Periodic refresh every 30 seconds
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [])

    const activeOrdersCount = orders.filter(o => !INACTIVE.includes(o.status)).length
    const completedOrdersCount = orders.filter(o => ['delivered', 'completed'].includes(o.status)).length

    const columns = [
        {
            title: 'Order Date',
            key: 'orderDate',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                        {new Date(record.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Order ID: #{record._id.slice(-6)}</span>
                </div>
            )
        },
        {
            title: 'Product Details',
            dataIndex: 'orderItems',
            key: 'product',
            render: (items, record) => (
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
                        <img 
                            src={items?.[0]?.productImage || 'https://via.placeholder.com/48'} 
                            alt="p" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-800 text-xs truncate max-w-[140px]">
                            {items?.[0]?.productName || 'Handmade Item'}
                        </span>
                        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1">
                            <Store size={8} className="text-coral" /> {record.sellerId?.storeName || 'Homedify Artisan'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'total',
            key: 'amount',
            align: 'right',
            render: (val) => (
                <div className="flex flex-col">
                    <span className="font-bold text-coral text-xs">Rs. {val?.toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Paid</span>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
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
        }
    ]

    return (
        <UserLayout>
            <div className="p-0 sm:p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                

                {/* ── STAT CARDS — Admin Parity ── */}
                <Row gutter={[24, 24]} className="mb-8">
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard icon={<Package />} label="Total Orders" value={orders.length} to="/customer/orders" />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard icon={<Truck />} label="In Transit" value={activeOrdersCount} to="/customer/orders" />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard icon={<CheckCircle />} label="Delivered" value={completedOrdersCount} to="/customer/orders" />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard 
                            icon={<Heart />} 
                            label="Wishlist" 
                            value={wishlist.length} 
                            to="/customer/wishlist" 
                            className={wishlist.length > 0 ? 'animate-border-red' : 'animate-border-green'}
                        />
                    </Col>
                </Row>

                {/* ── ACTIVITY TABLE ── */}
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card 
                            title={<span className="text-lg font-black text-gray-900 tracking-[0.05em] uppercase">Recent <span className="text-coral">Activity</span></span>}
                            extra={<Link to="/customer/orders" className="text-coral font-bold text-[10px] uppercase tracking-widest">View All</Link>}
                            className="border-none shadow-sm rounded-2xl overflow-hidden"
                            styles={{ body: { padding: 0 } }}
                        >
                            {loading ? (
                                <div className="py-24 text-center"><Spin size="large" /></div>
                            ) : orders.length > 0 ? (
                                <Table 
                                    columns={columns} 
                                    dataSource={orders.slice(0, 5).map(o => ({ ...o, key: o._id }))} 
                                    pagination={false}
                                    className="premium-table"
                                    scroll={{ x: 'max-content' }}
                                />
                            ) : (
                                <Empty 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={<span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No artisan treasures found</span>}
                                    className="py-16"
                                />
                            )}
                        </Card>
                    </Col>
                </Row>

            </div>

            {/* REVIEW MODAL */}
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
                                    src={selectedOrderForReview.orderItems?.[0]?.productImage || 'https://via.placeholder.com/48'} 
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
                    border-radius: 16px !important;
                }
                .premium-table .ant-table {
                    background: transparent !important;
                }
            `}</style>
        </UserLayout>
    )
}

export default UserDashboard
