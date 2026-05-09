import React, { useState, useEffect, useContext } from 'react'
import UserLayout from '../shared/UserLayout'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import { 
    Card, Table, Rate, Typography, Space, 
    Button, Empty, Tag, Avatar, Tooltip, Divider 
} from 'antd'
import { 
    MessageSquare, Star, Clock, ShoppingBag, 
    Trash2, Edit3, ArrowRight, ExternalLink, ThumbsUp
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

const UserReviews = () => {
    const { token } = useContext(AuthContext)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) fetchReviews()
    }, [token])

    const fetchReviews = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/v1/reviews/my', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setReviews(res.data.data || [])
        } catch (err) {
            console.error('Fetch reviews error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/v1/reviews/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Review removed')
            fetchReviews()
        } catch (err) {
            toast.error('Failed to remove review')
        }
    }

    const columns = [
        {
            title: 'Review Date',
            key: 'date',
            width: 140,
            render: (_, record) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                        #{record._id.slice(-6)}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            )
        },
        {
            title: 'Product Information',
            key: 'product',
            width: 280,
            render: (_, record) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-sm transition-transform hover:scale-105">
                        <img 
                            src={getMediaUrl(record.productId?.images?.[0])} 
                            alt="product" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
                        />
                    </div>
                    <Tooltip title={record.productId?.name} placement="right">
                        <div className="flex flex-col min-w-0 cursor-pointer">
                            <span className="font-bold text-gray-800 text-xs truncate max-w-[150px]">
                                {record.productId?.name || 'Homedify Artisan Item'}
                            </span>
                            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                <ShoppingBag size={8} className="text-coral" /> Verified Purchase
                            </span>
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            title: 'Your Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 140,
            render: (val) => (
                <div className="flex flex-col">
                    <Rate disabled defaultValue={val} className="text-[10px] text-coral" />
                    <span className="text-[9px] font-black text-coral uppercase tracking-widest mt-1">
                        {val === 5 ? 'Exceptional' : val >= 4 ? 'Great' : val >= 3 ? 'Good' : 'Fair'}
                    </span>
                </div>
            )
        },
        {
            title: 'Artisan Feedback',
            dataIndex: 'reviewText',
            key: 'feedback',
            render: (text) => (
                <div className="max-w-[300px]">
                    <span className="text-xs font-medium text-gray-500 leading-relaxed italic line-clamp-2">
                        "{text || 'No feedback shared'}"
                    </span>
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="View Product">
                        <Button 
                            type="text" 
                            icon={<ExternalLink size={18} />} 
                            className="text-gray-300 hover:text-coral transition-all hover:bg-coral/5 rounded-xl w-10 h-10 flex items-center justify-center border border-gray-50"
                            onClick={() => window.open(`/product/${record.productId?._id}`, '_blank')}
                        />
                    </Tooltip>
                    <Tooltip title="Remove Review">
                        <Button 
                            type="text" 
                            icon={<Trash2 size={18} />} 
                            className="text-gray-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl w-10 h-10 flex items-center justify-center border border-gray-50"
                            onClick={() => handleDelete(record._id)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <UserLayout>
            <div className="p-0 sm:p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Main Table Card */}
                <Card className="border-none shadow-sm rounded-[24px] overflow-hidden" styles={{ body: { padding: 0 } }}>
                    <Table 
                        columns={columns} 
                        dataSource={reviews.map(r => ({ ...r, key: r._id }))} 
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        className="premium-table"
                        locale={{
                            emptyText: (
                                <div className="py-24 text-center">
                                    <Empty 
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <div className="mt-4 max-w-xs mx-auto">
                                                <Text className="text-gray-400 font-bold block uppercase tracking-widest text-[10px]">Your voice matters</Text>
                                                <Text className="text-gray-300 text-[10px] block mt-1">Confirm your deliveries and share your artisan experience to see your reviews here.</Text>
                                                <Button 
                                                    type="link" 
                                                    onClick={() => window.location.href = '/customer/orders'}
                                                    className="text-coral font-black uppercase text-[10px] mt-4"
                                                >
                                                    View Recent Orders <ArrowRight size={12} className="inline ml-1" />
                                                </Button>
                                            </div>
                                        }
                                    />
                                </div>
                            )
                        }}
                    />
                </Card>
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
            `}</style>
        </UserLayout>
    )
}

export default UserReviews
