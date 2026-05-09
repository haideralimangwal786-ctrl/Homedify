import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import axios from 'axios'
import { CartContext } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import useAuthGuard from '../hooks/useAuthGuard'
import { 
  ShoppingBag, ArrowLeft, Heart, ShieldCheck, 
  Truck, RotateCcw, CheckCircle2, Store, MessageSquare,
  Share2, Info, Star, ArrowRight
} from 'lucide-react'
import { 
  Card, Row, Col, Rate, Tag, Typography, Space, 
  InputNumber, Tabs, Progress, Empty, Image, Avatar, 
  Button, Divider, Form, Input, ConfigProvider, message as antdMessage
} from 'antd'
import toast from 'react-hot-toast'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const DUMMY_PRODUCTS = [
  {
    _id: '65af1234567890abcdef0101',
    name: 'Handwoven Jute Basket Set',
    price: 3500,
    category: { name: 'Craft' },
    subCategory: 'Handmade Baskets',
    images: [
      'https://images.unsplash.com/photo-1616401784845-180886ba9ca2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Set of 3 nesting baskets. Natural eco-friendly jute. Perfect for organizing your living space.',
    quantity: 3,
    rating: 4.8,
    reviewCount: 48,
    sellerId: { shopName: 'Saira Arts', verificationStatus: 'approved' }
  }
]

const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    
    const uploadsIndex = pathStr.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
        const cleanPath = pathStr.substring(uploadsIndex);
        return `${backendUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    }
    
    const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    return `${backendUrl}/uploads${normalizedPath}`;
};

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewForm] = Form.useForm()

  const { add } = useContext(CartContext)
  const { isWishlisted, toggle: wishlistToggle } = useWishlist()
  const guard = useAuthGuard('Please log in to continue')

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false)
      setProduct(null)
      return
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const [prodRes, revRes] = await Promise.all([
          axios.get(`/api/v1/products/${id}`),
          axios.get(`/api/v1/reviews/product/${id}`).catch(() => ({ data: { data: [] } }))
        ])
        
        if (prodRes.data?.success && prodRes.data?.data) {
          setProduct(prodRes.data.data)
        } else {
          setProduct(DUMMY_PRODUCTS.find(p => p._id === id) || null)
        }
        setReviews(Array.isArray(revRes.data.data) ? revRes.data.data : [])
      } catch (err) {
        console.error('Fetch error:', err)
        setProduct(DUMMY_PRODUCTS.find(p => p._id === id) || null)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchInitialData()
  }, [id])

  const handleAddToCart = () => {
    if (!guard()) return
    add(product, quantity)
    toast.success(`Added ${quantity} item(s) to cart!`)
  }

  const handleAddToWishlist = () => {
    if (!guard()) return
    const added = wishlistToggle(product)
    toast.success(added ? 'Added to wishlist!' : 'Removed from wishlist')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!product) return <div className="text-center py-20 font-bold">Product not found</div>

  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/800']
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : (product.rating || 4.5).toFixed(1)
  const reviewCount = reviews.length || product.reviewCount || 0

  const ratingStats = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.floor(r.rating) === star).length,
    percent: reviews.length > 0 ? (reviews.filter(r => Math.floor(r.rating) === star).length / reviews.length) * 100 : 0
  }))

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#FF6B6B', borderRadius: 16 } }}>
      <div className="bg-white min-h-screen font-sans overflow-x-hidden">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {/* Back Link */}
          <button onClick={() => navigate('/shop')} className="mb-6 md:mb-8 flex items-center gap-2 text-gray-400 hover:text-coral transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
          </button>

          <Row gutter={[48, 48]}>
            {/* LEFT: IMAGES SECTION */}
            <Col xs={24} lg={11} xl={10}>
              <div className="lg:sticky lg:top-28">
                <div className="rounded-[24px] md:rounded-[32px] overflow-hidden bg-white shadow-xl relative group border border-gray-50 w-full h-[320px] sm:h-[450px] md:h-[500px]">
                  <Image
                    src={getMediaUrl(images[activeImage])}
                    alt={product.name}
                    width="100%"
                    height="100%"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    preview={{ cover: <div className="text-white font-bold flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm"><Info size={20} /> View Large</div> }}
                  />
                  <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
                     <Tag color="green" className="border-none px-3 py-1 font-black rounded-full shadow-lg flex items-center gap-1 uppercase tracking-tighter text-[10px] md:text-xs">
                        <CheckCircle2 size={12} /> Verified
                     </Tag>
                  </div>
                </div>

                {/* Thumbnail Row */}
                {images.length > 1 && (
                  <div className="flex gap-3 md:gap-4 mt-4 md:mt-6 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 transition-all border-2 ${activeImage === idx ? 'border-coral shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={getMediaUrl(img)} className="w-full h-full object-cover" alt="thumb" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            {/* RIGHT: INFO SECTION */}
            <Col xs={24} lg={12}>
              <div className="space-y-6">
                <div>
                   <Title level={1} className="m-0 font-black text-gray-900 tracking-tighter leading-tight mb-4" style={{ fontSize: 'clamp(24px, 6vw, 38px)', letterSpacing: '-0.03em' }}>{product.name}</Title>
                   <div className="flex items-center flex-wrap gap-3 md:gap-4 text-gray-400">
                      <div className="flex items-center gap-2">
                        <Rate disabled defaultValue={parseFloat(avgRating)} style={{ color: '#FFD700', fontSize: 14 }} className="md:text-[16px]" />
                        <span className="font-bold text-[11px] md:text-sm text-gray-500 whitespace-nowrap">({reviewCount} Verified Reviews)</span>
                      </div>
                      <span className="hidden md:inline text-gray-200">|</span>
                      <button className="text-coral font-bold text-xs md:text-sm hover:opacity-80 flex items-center gap-1.5 transition-all">
                        <Share2 size={16} /> Share
                      </button>
                   </div>
                </div>

                {/* Price Display */}
                <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[28px] space-y-3">
                   <div className="flex items-center gap-4 flex-wrap">
                      <Text className="text-4xl font-black text-coral">PKR {product.price?.toLocaleString()}</Text>
                      <Text delete className="text-gray-400 text-lg font-bold">PKR {(product.price * 1.2).toLocaleString()}</Text>
                      <Tag color="#FF6B6B" className="border-none font-black rounded-lg px-2 text-white">20% OFF</Tag>
                   </div>
                   <Text className="text-xs text-gray-400 font-black uppercase tracking-widest block">LIMITED TIME OFFER • INCLUSIVE OF ALL TAXES</Text>
                </div>

                {/* Trust Badges - Improved Spacing */}
                <Row gutter={[12, 12]} className="md:gutter-[16, 16]">
                  {[
                    { icon: <Truck size={20} className="md:w-[22px]" />, label: "Fast Shipping", bg: "bg-[#FC6A6B]/10", text: "text-[#FC6A6B]" },
                    { icon: <ShieldCheck size={20} className="md:w-[22px]" />, label: "Authentic", bg: "bg-green-50", text: "text-green-600" },
                    { icon: <RotateCcw size={20} className="md:w-[22px]" />, label: "Returns", bg: "bg-purple-50", text: "text-purple-600" }
                  ].map((badge, i) => (
                    <Col key={i} span={8}>
                      <div className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-3 md:p-4 rounded-[16px] md:rounded-[20px] ${badge.bg} ${badge.text} hover:shadow-md transition-all h-full`}>
                         {badge.icon}
                         <Text className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-inherit text-center">{badge.label}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Action Section - Better Alignment */}
                <div className="pt-4 space-y-6">
                   <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Select Quantity</Text>
                        <div className="flex flex-col sm:flex-row items-stretch gap-4">
                           {/* Custom Quantity Selector */}
                           <div className="flex items-center justify-between sm:justify-start border border-gray-200 rounded-[20px] overflow-hidden bg-white shadow-sm h-[56px] sm:w-44 group shrink-0">
                              <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-14 h-full flex items-center justify-center text-gray-400 hover:text-coral hover:bg-coral/5 transition-all font-bold text-xl active:scale-95 leading-none"
                              >
                                −
                              </button>
                              <div className="flex-1 sm:flex-none sm:w-16 h-full flex items-center justify-center border-x border-gray-100 font-black text-lg text-gray-800 leading-none bg-gray-50/30">
                                {quantity}
                              </div>
                              <button 
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-14 h-full flex items-center justify-center text-gray-400 hover:text-coral hover:bg-coral/5 transition-all font-bold text-xl active:scale-95 leading-none"
                              >
                                +
                              </button>
                           </div>

                           <div className="flex items-center gap-3 flex-1">
                                <button 
                                    onClick={handleAddToCart}
                                    className="flex-1 h-[56px] rounded-[20px] font-black uppercase tracking-[0.1em] text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-coral/20 hover:shadow-coral/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white border-none group px-8 leading-none"
                                >
                                    <ShoppingBag size={20} className="group-hover:animate-bounce shrink-0" />
                                    <span className="mt-[1px]">Add to Cart</span>
                                </button>

                                <button 
                                    onClick={handleAddToWishlist}
                                    className={`w-14 h-[56px] flex items-center justify-center rounded-[20px] border transition-all active:scale-95 shadow-sm shrink-0 ${
                                        isWishlisted(product._id) 
                                        ? 'bg-coral border-coral text-white shadow-coral/20' 
                                        : 'bg-white border-gray-200 text-gray-400 hover:border-coral hover:text-coral'
                                    }`}
                                >
                                    <Heart 
                                        size={22} 
                                        fill={isWishlisted(product._id) ? 'currentColor' : 'none'} 
                                        className="transition-transform"
                                    />
                                </button>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Seller Profile - Fixed Visuals */}
                   <div className="space-y-4">
                      <Text className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest block">Artisan Details</Text>
                      <div className="p-4 md:p-5 border border-gray-100 rounded-[24px] bg-white hover:shadow-xl hover:shadow-gray-50 transition-all flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                          <Avatar size={48} className="bg-coral/5 text-coral font-black shrink-0 shadow-sm border border-white" icon={<Store size={24} />} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Title level={4} className="m-0 font-black text-gray-900 text-sm md:text-base">{product.sellerId?.shopName || 'Homedify Artisan'}</Title>
                              {product.sellerId?.verificationStatus === 'approved' && <CheckCircle2 size={16} className="text-green-500" />}
                            </div>
                            <div className="flex items-center gap-1.5 py-0.5 px-2 bg-green-50 rounded-full w-fit">
                              <ShieldCheck size={10} className="text-green-600" />
                              <Text className="text-[8px] md:text-[10px] font-black text-green-700 uppercase tracking-wider">Verified Seller</Text>
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="w-full sm:w-auto rounded-xl border-coral text-coral font-bold h-11 px-8 hover:bg-coral hover:text-white transition-all flex items-center justify-center"
                          icon={<Store size={18} />}
                          onClick={() => navigate(`/shop?seller=${product.sellerId?._id}`)}
                        >
                          Visit Store
                        </Button>
                      </div>
                   </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* TABS SECTION */}
          <div className="mt-12 md:mt-20">
             <Tabs 
               defaultActiveKey="1" 
               centered 
               className="premium-tabs"
               items={[
                 {
                   key: '1',
                   label: <span className="px-6 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">Description</span>,
                   children: (
                    <div className="max-w-4xl mx-auto py-12 px-4">
                      <Paragraph className="text-lg text-gray-600 leading-relaxed text-center font-medium">
                        {product.description}
                      </Paragraph>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                         <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                            <Title level={4} className="font-black mb-4">Materials & Care</Title>
                            <Text className="text-gray-500 leading-relaxed">Each item is handcrafted using traditional techniques. To ensure longevity, keep away from direct moisture and handle with care.</Text>
                         </div>
                         <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                            <Title level={4} className="font-black mb-4">Shipping Info</Title>
                            <Text className="text-gray-500 leading-relaxed">Ships within 2-3 business days. Securely packaged in eco-friendly materials to ensure it reaches you in perfect condition.</Text>
                         </div>
                      </div>
                    </div>
                   )
                 },
                 {
                   key: '2',
                   label: <span className="px-6 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">Reviews ({reviewCount})</span>,
                   children: (
                    <div className="py-12 max-w-4xl mx-auto">
                        <div className="space-y-6">
                                  <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 mb-10 text-center">
                                    <ShieldCheck size={32} className="text-coral mx-auto mb-4" />
                                    <Text className="text-sm font-bold text-gray-900 block mb-2 uppercase tracking-widest">Verified Reviews Only</Text>
                                    <Text className="text-xs text-gray-500 font-medium leading-relaxed block max-w-md mx-auto">
                                      To ensure authenticity, only customers who have purchased this product can leave a review. 
                                      If you've bought this item, please visit your <span className="text-coral cursor-pointer hover:underline font-bold" onClick={() => navigate('/customer/orders')}>Order History</span> to share your feedback.
                                    </Text>
                                  </div>

                                  {reviews.length === 0 ? (
                             <Empty 
                                className="py-10"
                                description={
                                  <div className="text-center">
                                    <Text className="text-xl font-black text-gray-900 block mb-2">No reviews yet</Text>
                                    <Text className="text-gray-400 font-medium">Be the first to share your thoughts!</Text>
                                  </div>
                                } 
                             />
                          ) : (
                              reviews.map(rev => (
                                 <div key={rev._id} className="py-8 border-b border-gray-100 last:border-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-start gap-4 mb-3">
                                       <Avatar size={40} className="bg-gray-100 text-coral font-black shrink-0 shadow-sm border border-white" src={getMediaUrl(rev.customerId?.picture)}>
                                          {(rev.customerId?.name || 'U')[0].toUpperCase()}
                                       </Avatar>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2 mb-0.5">
                                             <Text className="font-bold text-gray-900 text-sm">{rev.customerId?.name || 'Artisan Enthusiast'}</Text>
                                             <Text className="text-[10px] text-gray-400 font-medium">{new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                          </div>
                                          <div className="flex items-center gap-2">
                                             <Rate disabled defaultValue={rev.rating} className="text-[10px]" style={{ color: '#FFD700' }} />
                                          </div>
                                       </div>
                                    </div>
                                    <div className="pl-14">
                                       <Text className="text-gray-600 text-sm leading-relaxed block font-medium">
                                          {rev.reviewText || 'No detailed feedback provided.'}
                                       </Text>
                                       
                                       <div className="flex items-center gap-4 mt-4">
                                          <button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-coral transition-colors">
                                             Was this helpful?
                                          </button>
                                          <div className="flex items-center gap-2">
                                             <button className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-500 hover:bg-gray-100">Yes</button>
                                             <button className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-500 hover:bg-gray-100">No</button>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ))
                          )}
                        </div>
                    </div>
                   )
                 }
               ]}
             />
          </div>
        </div>

        <Footer />

        <style>{`
          .premium-tabs .ant-tabs-nav::before { border: none !important; }
          .premium-tabs .ant-tabs-tab { padding: 12px 0 !important; margin: 0 10px !important; }
          @media (min-width: 768px) {
            .premium-tabs .ant-tabs-tab { margin: 0 20px !important; }
          }
          .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #FF6B6B !important; }
          .premium-tabs .ant-tabs-ink-bar { height: 4px !important; border-radius: 4px !important; background: #FF6B6B !important; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .ant-input-number-handler-wrap { border-radius: 0 16px 16px 0 !important; }
          .ant-rate { color: #FFD700 !important; }
          @media (max-width: 640px) {
            .ant-tabs-nav-list { width: 100% !important; justify-content: center !important; }
            .ant-tabs-tab { margin: 0 5px !important; }
          }
        `}</style>
      </div>
    </ConfigProvider>
  )
}

export default ProductDetails
