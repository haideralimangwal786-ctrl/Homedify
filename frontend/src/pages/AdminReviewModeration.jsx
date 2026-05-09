import React, { useState, useEffect } from 'react'
import { 
  Table, Tag, Space, Button, Input, Modal, Rate, 
  Avatar, Typography, Card, Badge, Popconfirm, ConfigProvider,
  Select, Tooltip
} from 'antd'
import { 
  Search, Trash2, Eye, Star, MessageSquare, 
  Calendar, User as UserIcon, Store, Image as ImageIcon,
  CheckCircle, XCircle, Filter, X
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const { Title, Text } = Typography

const AdminReviewModeration = ({ windowWidth: propWindowWidth }) => {
  const [windowWidth, setWindowWidth] = useState(propWindowWidth || window.innerWidth);
  
  useEffect(() => {
    if (propWindowWidth !== undefined) {
      setWindowWidth(propWindowWidth);
    }
  }, [propWindowWidth]);
  
  useEffect(() => {
    if (propWindowWidth === undefined) {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [propWindowWidth]);
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)

  useEffect(() => {
    fetchReviews()
    // Periodic refresh every 30 seconds
    const interval = setInterval(fetchReviews, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/admin/reviews')
      // Only show visible reviews
      setReviews(res.data.data.filter(r => r.status !== 'deleted') || [])
    } catch (err) {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/admin/reviews/${id}`)
      toast.success('Review deleted')
      fetchReviews()
    } catch (err) {
      toast.error('Failed to delete review')
    }
  }

  const openDetails = (review) => {
    setSelectedReview(review)
    setIsModalOpen(true)
  }

  const getMediaUrl = (pathStr) => {
    if (!pathStr) return null;
    if (pathStr.startsWith('http')) return pathStr;
    const filename = pathStr.split(/[\\/]/).pop();
    return `http://localhost:5000/uploads/${filename}`;
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      (review.productId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.productId?.sellerId?.storeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.customerId?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter)
    
    return matchesSearch && matchesRating
  })

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
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'user',
      width: 180,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={user?.picture} 
            icon={<UserIcon size={14} />} 
            className="bg-coral/10 text-coral shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-gray-800 font-bold text-[11px] leading-tight truncate">{user?.name || 'Artisan Customer'}</span>
            <span className="text-gray-400 text-[9px] truncate font-medium lowercase">{user?.email || 'no-email'}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Product & Store',
      dataIndex: 'productId',
      key: 'product',
      width: 220,
      render: (product) => (
        <div className="flex flex-col min-w-0">
          <span className="text-gray-800 font-bold text-[11px] truncate mb-0.5">
             {product?.name || 'Homedify Item'}
          </span>
          <div className="flex items-center gap-1.5">
             <Store size={8} className="text-coral" />
             <span className="text-coral font-bold text-[9px] uppercase tracking-wider truncate">
               {product?.sellerId?.storeName || 'Verified Seller'}
             </span>
          </div>
        </div>
      )
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (rating) => (
        <div className="flex flex-col">
           <Rate disabled defaultValue={rating} className="text-[10px] text-amber-400" />
           <span className={`text-[9px] font-black uppercase mt-1 tracking-widest ${rating === 1 ? 'text-red-500' : 'text-gray-300'}`}>
             {rating === 1 ? 'Critical' : rating >= 4 ? 'Exceptional' : 'Standard'}
           </span>
        </div>
      )
    },
    {
      title: 'Artisan Feedback',
      dataIndex: 'reviewText',
      key: 'comment',
      render: (text, record) => (
        <div className="max-w-xs">
           <span className="text-gray-500 text-[11px] italic leading-relaxed line-clamp-2 block font-medium">
             "{text}"
           </span>
           {record.images && record.images.length > 0 && (
             <div className="flex items-center gap-1 mt-1 text-coral font-black text-[8px] uppercase tracking-widest">
               <ImageIcon size={8} />
               <span>{record.images.length} Image Attached</span>
             </div>
           )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<Eye size={18} className="text-gray-300 hover:text-coral transition-colors" />} 
              onClick={() => openDetails(record)}
              className="hover:bg-coral/5 h-10 w-10 flex items-center justify-center rounded-xl transition-all border border-gray-50"
            />
          </Tooltip>
          <Popconfirm
            title="Delete Review"
            description="Permanently remove this review?"
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            cancelText="Keep"
            okButtonProps={{ danger: true, className: "bg-red-500 text-[10px] font-bold h-8" }}
            cancelButtonProps={{ className: "text-[10px] font-bold h-8" }}
          >
            <Button 
              type="text" 
              icon={<Trash2 size={18} className="text-gray-300 hover:text-red-500" />} 
              className="hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all border border-gray-50"
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B6B',
          borderRadius: 16,
        },
      }}
    >
      <div className="p-0 font-sans">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex-1 w-full max-w-xl">
              <Input 
                placeholder="Search reviews by product, seller or customer..." 
                prefix={<Search size={20} className="text-gray-400 mr-2" />}
                size="large"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="rounded-2xl border-none h-14 bg-gray-50/50 hover:bg-gray-100 transition-all font-medium text-sm shadow-inner"
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Text className="font-black text-gray-400 text-[10px] uppercase tracking-widest shrink-0">Filter Rating:</Text>
              <Select 
                defaultValue="all" 
                className="w-full md:w-[180px]"
                size="large"
                onChange={setRatingFilter}
              >
                <Select.Option value="all">All Ratings</Select.Option>
                <Select.Option value="5">5 Stars Only</Select.Option>
                <Select.Option value="4">4 Stars & Above</Select.Option>
                <Select.Option value="3">3 Stars & Above</Select.Option>
                <Select.Option value="2">2 Stars & Above</Select.Option>
                <Select.Option value="1">1 Star Only</Select.Option>
              </Select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             {[
               { label: 'Total Reviews', value: reviews.length, icon: <MessageSquare size={24} className="text-coral" />, bg: '#FFEBEE' },
               { label: 'Critical (1-Star)', value: reviews.filter(r => r.rating === 1).length, icon: <XCircle size={24} className="text-red-500" />, bg: '#FEF2F2' },
               { label: 'Excellent (5-Star)', value: reviews.filter(r => r.rating === 5).length, icon: <Star size={24} className="text-amber-500" />, bg: '#FFFBEB' },
               { label: 'Avg Rating', value: (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1), icon: <CheckCircle size={24} className="text-green-500" />, bg: '#F0FDF4' }
             ].map((stat, i) => (
               <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: stat.bg }}>
                 <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      {stat.icon}
                    </div>
                    <div>
                       <Text className="text-xs font-bold uppercase tracking-wider text-gray-500/60 block">{stat.label}</Text>
                       <Title level={3} className="m-0 font-black text-gray-900 mt-1">{stat.value}</Title>
                    </div>
                 </div>
               </Card>
             ))}
          </div>

          {/* Table Section */}
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-8 duration-700" styles={{ body: { padding: 0 } }}>
            <Table 
              columns={columns} 
              dataSource={filteredReviews} 
              loading={loading}
              rowKey="_id"
              pagination={false}
              className="custom-admin-table"
              scroll={windowWidth < 1200 ? { x: 'max-content' } : undefined}
              rowClassName={(record) => record.rating === 1 ? 'critical-review-row' : ''}
            />
          </Card>
        </div>

        {/* Details Modal */}
        <Modal
          title={
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-coral" size={20} />
              </div>
              <div>
                <Title level={4} className="m-0 font-black text-gray-900">Review Details</Title>
                <Text className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Feedback Verification</Text>
              </div>
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setIsModalOpen(false)} className="h-12 px-8 rounded-xl font-bold border-gray-200">
              Close Window
            </Button>,
            <Popconfirm
              key="delete"
              title="Delete this review?"
              onConfirm={() => {
                handleDelete(selectedReview?._id)
                setIsModalOpen(false)
              }}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button danger type="primary" className="h-12 px-8 rounded-xl font-bold bg-red-500 border-none">
                Delete Review
              </Button>
            </Popconfirm>
          ]}
          width={700}
          centered
          className="premium-modal"
          closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
        >
          {selectedReview && (
            <div className="py-6">
              <div className="flex flex-col md:flex-row gap-8">
                 {/* Images if any */}
                 {selectedReview.images && selectedReview.images.length > 0 && (
                   <div className="w-full md:w-[300px] shrink-0">
                      <Title level={5} className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                        <ImageIcon size={14} />
                        Customer Photos
                      </Title>
                      <div className="grid grid-cols-2 gap-3">
                         {selectedReview.images.map((img, idx) => (
                           <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                             <img src={getMediaUrl(img)} alt="Review" className="w-full h-full object-cover" />
                           </div>
                         ))}
                      </div>
                   </div>
                 )}

                 {/* Content */}
                 <div className="flex-1">
                    <div className="mb-6">
                      <Title level={5} className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Rating</Title>
                      <Rate disabled defaultValue={selectedReview.rating} className="text-coral" />
                    </div>

                    <div className="mb-6">
                      <Title level={5} className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Customer Feedback</Title>
                      <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 italic relative">
                         <Text className="text-gray-700 text-base leading-relaxed">
                            "{selectedReview.reviewText}"
                         </Text>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-2xl border border-gray-100">
                          <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Customer</Text>
                          <Text className="text-sm font-bold text-gray-900">{selectedReview.customerId?.name}</Text>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-gray-100">
                          <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Store</Text>
                          <Text className="text-sm font-bold text-coral">{selectedReview.productId?.sellerId?.storeName}</Text>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </Modal>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-admin-table .ant-table-thead > tr > th { 
            background: #FAFAFA !important; 
            color: #8C8C8C !important;
            font-weight: 800 !important; 
            text-transform: uppercase !important; 
            font-size: 10px !important; 
            letter-spacing: 0.1em !important; 
            padding: 16px 20px !important; 
            border-bottom: 1px solid rgba(0,0,0,0.03) !important;
          }
          .custom-admin-table .ant-table-tbody > tr > td { 
            padding: 16px 20px !important; 
            border-bottom: 1px solid #f9fafb !important;
            background: #fff !important;
          }
          .custom-admin-table .ant-table-row:hover > td {
            background-color: #FFF1F0 !important;
          }
          .critical-review-row > td {
            background-color: #FEF2F2 !important;
          }
          .premium-modal .ant-modal-content {
            padding: 32px !important;
            border-radius: 40px !important;
            box-shadow: 0 30px 60px rgba(0,0,0,0.1) !important;
          }
          .custom-select .ant-select-selector {
            border-radius: 16px !important;
            height: 48px !important;
            display: flex !important;
            align-items: center !important;
            border-color: #F3F4F6 !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
          }
        `}} />
      </div>
    </ConfigProvider>
  )
}

export default AdminReviewModeration
