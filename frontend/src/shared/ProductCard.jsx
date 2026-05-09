import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Rate, Tag, Typography, Button, ConfigProvider } from 'antd';
import { HeartOutlined, HeartFilled, ShoppingCartOutlined, CheckCircleFilled, AlertOutlined } from '@ant-design/icons';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import useAuthGuard from '../hooks/useAuthGuard';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';

const { Text } = Typography;

const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    const uploadsIndex = pathStr.indexOf('/uploads/');
    const cleanPath = uploadsIndex !== -1 ? pathStr.substring(uploadsIndex) : `/uploads/${pathStr.split('/').pop()}`;
    return `${backendUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const navigate = useNavigate();
  const { add } = useContext(CartContext);
  const { isWishlisted, toggle: wishlistToggle } = useWishlist();
  const guard = useAuthGuard('Please log in to continue');

  const wishlisted = isWishlisted(product._id || product.id);
  const isDisabled = product.isActive === false;

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (!guard()) return;
    const added = wishlistToggle(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (!guard()) return;
    add(product, 1);
    toast.success('Added to cart!');
  };

  const handleDetails = () => {
    if (isDisabled) {
      toast.error('This product is temporarily disabled by the seller');
      return;
    }
    navigate(`/product/${product._id || product.id}`);
  };

  const img = getMediaUrl((product.images && product.images[0]) || (product.image) || (product.productImage));
  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 12;

  // List View Adaptation
  if (viewMode === 'list') {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#FF6B6B', borderRadius: 12 } }}>
        <Card
          hoverable
          className={`mb-4 overflow-hidden transition-all duration-300 ${isDisabled ? 'opacity-70 grayscale' : ''}`}
          styles={{ body: { padding: '0' } }}
          onClick={handleDetails}
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-44 aspect-square relative overflow-hidden bg-gray-50 flex-shrink-0">
              <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-2 left-2 scale-75 origin-top-left">
                <Tag color="green" icon={<CheckCircleFilled />}>VERIFIED</Tag>
              </div>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1 text-gray-400">
                  <Store size={10} strokeWidth={2.5} />
                  <span className="text-[9px] uppercase tracking-widest font-medium block truncate text-inherit leading-none">
                    {product.sellerId?.storeName || product.seller?.storeName || product.storeName || 'Homedify'}
                  </span>
                </div>
                <Text strong className="text-base block mb-1 truncate">{product.name}</Text>
                <div className="flex items-center gap-2 mb-2">
                  <Rate disabled allowHalf defaultValue={rating} style={{ fontSize: 10 }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>({reviewCount} Reviews)</Text>
                </div>
                <Text className="text-lg font-black text-gray-900 block mb-3">PKR {product.price?.toLocaleString()}</Text>
              </div>
              <div className="flex gap-2">
                <Button 
                    type="primary" 
                    icon={<ShoppingCartOutlined style={{fontSize: 12}} />} 
                    onClick={handleAdd} 
                    disabled={isDisabled}
                    className="h-9 flex-1 font-black uppercase tracking-wider text-[10px] flex items-center justify-center"
                >
                  Add to Cart
                </Button>
                <Button 
                    icon={wishlisted ? <HeartFilled style={{color: '#FF6B6B'}} /> : <HeartOutlined />} 
                    onClick={handleWishlist}
                    className="h-9 w-9 flex items-center justify-center"
                />
              </div>
            </div>
          </div>
        </Card>
      </ConfigProvider>
    );
  }

  // Premium AntD Card Design (Grid View) - SHRUNK for 4 per row
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B6B',
          borderRadius: 12,
        },
      }}
    >
      <Card
        hoverable
        className={`group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${isDisabled ? 'opacity-70 grayscale-[0.6]' : ''}`}
        styles={{ body: { padding: '8px' } }}
        cover={
          <div className="relative aspect-square overflow-hidden bg-gray-50" onClick={handleDetails}>
            <img
              src={img}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Top Left: Verified Badge */}
            <div className="absolute top-2 left-2 z-10 pointer-events-none scale-75 origin-top-left">
              <Tag 
                color="green" 
                className="flex items-center gap-1 border-none font-bold px-2 py-1 m-0 shadow-sm backdrop-blur-md bg-green-500/90 text-white rounded-lg"
              >
                <CheckCircleFilled className="text-[12px]" />
                VERIFIED
              </Tag>
            </div>

            {/* Top Right: Wishlist Icon */}
            <div className="absolute top-2 right-2 z-10 scale-90">
              <div 
                onClick={handleWishlist}
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all"
              >
                {wishlisted ? (
                  <HeartFilled style={{ color: '#FF6B6B', fontSize: '15px' }} />
                ) : (
                  <HeartOutlined style={{ color: '#FF6B6B', fontSize: '15px' }} />
                )}
              </div>
            </div>

            {/* Disabled Overlay */}
            {isDisabled && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                <Tag color="volcano" icon={<AlertOutlined />} className="font-black px-2 py-1 rounded-full border-none shadow-xl scale-75">
                  DISABLED
                </Tag>
              </div>
            )}
          </div>
        }
      >
        <div onClick={handleDetails} className="cursor-pointer">
          {/* Store Name */}
          <div className="flex items-center gap-1 mb-1 text-gray-400">
            <Store size={8} sm={9} strokeWidth={2.5} />
            <span className="text-[7px] sm:text-[8px] uppercase tracking-widest font-medium block truncate text-inherit leading-none">
              {product.sellerId?.storeName || product.seller?.storeName || product.storeName || 'Homedify'}
            </span>
          </div>

          {/* Title */}
          <div className="mb-1">
            <Text strong className="text-[11px] sm:text-[13px] text-gray-900 block truncate group-hover:text-[#FF6B6B] transition-colors leading-tight">
              {product.name}
            </Text>
          </div>

          {/* Reviews Row */}
          <div className="flex items-center gap-1 mb-1">
            <Rate disabled allowHalf defaultValue={rating} style={{ fontSize: 7, sm: 8, color: '#fadb14' }} />
            <Text type="secondary" style={{ fontSize: 8, sm: 9 }} className="font-medium">
              ({reviewCount})
            </Text>
          </div>

          {/* Price */}
          <div className="mb-2 sm:mb-3">
            <Text className="text-[12px] sm:text-[14px] font-black text-gray-900">
              PKR {product.price?.toLocaleString()}
            </Text>
          </div>
        </div>

        {/* Action: Add to Cart */}
        <Button 
          type="primary" 
          block 
          icon={<ShoppingCartOutlined className="text-[10px] sm:text-[12px]" />}
          onClick={handleAdd}
          disabled={isDisabled}
          className="h-7 sm:h-8 font-black uppercase tracking-wider text-[8px] sm:text-[9px] rounded-lg shadow-lg shadow-[#FF6B6B]/20 hover:shadow-xl hover:shadow-[#FF6B6B]/30 transition-all border-none flex items-center justify-center"
        >
          {isDisabled ? 'N/A' : 'Add to Cart'}
        </Button>
      </Card>
    </ConfigProvider>
  );
};

export default ProductCard;
