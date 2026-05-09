import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, Input, Select, Modal, Card,
  Typography, Image as AntImage, Tooltip, Checkbox, Divider, Row, Col
} from 'antd';
import { 
  Search, Eye, CheckCircle2, XCircle, ShieldCheck, Store,
  FileText, X, ArrowRight, Check, Trash2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const AdminProductModeration = ({ products, loading, onRefresh, windowWidth: propWindowWidth }) => {
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

  const [searchText, setSearchText] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Rejection Modal State
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionId, setRejectionId] = useState(null);
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    photoQuality: false,
    categoryCorrect: false,
    descriptionSafe: false
  });

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return '';
    const pathStr = String(pathValue);
    if (pathStr.startsWith('http') || pathStr.startsWith('data:image')) return pathStr;
    const hostname = window.location.hostname;
    // Prepend backend URL if path starts with /uploads
    if (pathStr.startsWith('/uploads')) {
      return `http://${hostname}:5000${pathStr}`;
    }
    return `http://${hostname}:5000/uploads/${pathStr}`;
  }

  const handleSearch = (e) => setSearchText(e.target.value);
  const handleMarketplaceChange = (value) => setMarketplaceFilter(value);

  const filteredProducts = products.filter(item => {
    const matchesSearch = (item.name || "").toLowerCase().includes(searchText.toLowerCase()) || 
                         (item.sellerId?.storeName || "").toLowerCase().includes(searchText.toLowerCase());
    const matchesMarketplace = marketplaceFilter === 'all' || item.marketplace === marketplaceFilter;
    return matchesSearch && matchesMarketplace;
  });

  // View Details State
  const [viewDetails, setViewDetails] = useState(false);

  const openModal = (product) => {
    setSelectedProduct(product);
    setChecklist({ photoQuality: false, categoryCorrect: false, descriptionSafe: false });
    setViewDetails(false); // Reset to card view
    setIsModalOpen(true);
  };

  const handleApprove = async (id) => {
    // If we are in the detailed view, we don't need the checklist for now as per user request (or maybe we do, but user said click approve to approve)
    // Actually, user wants it to be added to shop page when approved.
    
    setActionLoading(true);
    try {
      await api.put(`/api/v1/admin/products/${id}/approve`);
      toast.success('Product approved successfully!');
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error('Failed to approve product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/api/v1/admin/products/${rejectionId}/reject`, { rejectionReason: rejectionReason });
      toast.success('Product rejected');
      setRejectionModalVisible(false);
      setRejectionReason('');
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error('Failed to reject product');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectionModal = (id) => {
    setRejectionId(id);
    setRejectionReason('Product information or images do not meet guidelines');
    setRejectionModalVisible(true);
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'images',
      key: 'product',
      render: (images, record) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
            <img
              src={getMediaUrl(images?.[0])}
              alt="p"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-800 text-xs truncate max-w-[180px]">
              {record.name || 'Unnamed Product'}
            </span>
            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight">
              {record.marketplace === 'craft' ? 'Handmade Craft' : 'Non-Fresh Food'}
            </span>
          </div>
        </div>
      )
    },
    {
      title: 'Seller',
      key: 'seller',
      width: 140,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-[11px] leading-tight flex items-center gap-1">
            <Store size={10} className="text-coral shrink-0" />
            {record.sellerId?.storeName || 'Artisan'}
          </span>
          <span className="text-[9px] text-gray-400 font-medium lowercase tracking-tight">
            {record.sellerId?.userId?.email || ''}
          </span>
        </div>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      width: 100,
      render: (price) => (
        <div className="flex flex-col">
          <span className="font-bold text-coral text-xs">Rs. {(price || 0).toLocaleString()}</span>
          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">PKR</span>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 100,
      render: (status) => {
        const map = {
          active:   { bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500',  label: 'Approved' },
          approved: { bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500',  label: 'Approved' },
          rejected: { bg: 'bg-red-50',    text: 'text-red-500',    dot: 'bg-red-500',    label: 'Rejected' },
          pending:  { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400',  label: 'Pending' },
        };
        const cfg = map[status] || map.pending;
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 110,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<Eye size={20} />}
              onClick={() => openModal(record)}
              className="text-gray-400 hover:text-coral hover:bg-coral/5 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            />
          </Tooltip>
          <Tooltip title="Approve Product">
            <Button
              type="text"
              icon={<CheckCircle2 size={20} />}
              onClick={() => handleApprove(record._id)}
              className="text-green-500 hover:bg-green-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            />
          </Tooltip>
          <Tooltip title="Reject Product">
            <Button
              type="text"
              icon={<XCircle size={20} />}
              onClick={() => openRejectionModal(record._id)}
              className="text-red-500 hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full max-w-md">
          <Input
            placeholder="Search by product or store name..."
            prefix={<Search size={18} className="text-gray-400 mr-2" />}
            onChange={handleSearch}
            className="h-12 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Text className="font-bold text-gray-400 text-[11px] uppercase tracking-widest">Marketplace:</Text>
          <Select
            defaultValue="all"
            onChange={handleMarketplaceChange}
            className="w-full md:w-[180px]"
          >
            <Option value="all">All Items</Option>
            <Option value="craft">Handmade (Craft)</Option>
            <Option value="food">Non-Fresh Food</Option>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          loading={loading}
          rowKey="_id"
          pagination={false}
          className="premium-table"
          scroll={windowWidth < 1024 ? { x: 'max-content' } : undefined}
        />
      </Card>

      {/* Moderation Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={viewDetails ? 600 : 850}
        centered
        styles={{ 
          content: { 
            padding: 0, 
            borderRadius: 32, 
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: 'none'
          } 
        }}
        closeIcon={null}
      >
        {selectedProduct && (
          <div className="relative">
            {/* Close Button */}
            <Button 
              type="text" 
              shape="circle" 
              icon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />} 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', left: 'auto', zIndex: 1000 }}
              className="hover:bg-gray-100 h-10 w-10 flex items-center justify-center transition-all"
            />

            {!viewDetails ? (
              /* State 1: Card View */
              <div className="flex flex-col md:flex-row h-full">
                {/* Left: Product Card Preview (Shop Style) */}
                <div className="md:w-1/2 bg-gray-50 p-10 flex items-center justify-center">
                   <div className="w-[320px] bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-100 flex flex-col group relative">
                      {/* Badge */}
                      <div className="absolute top-4 left-4 z-20">
                         <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg border border-gray-200 uppercase tracking-widest">
                           {selectedProduct.categoryId?.name || 'Handmade'}
                         </div>
                      </div>
                      
                      {/* Image */}
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden p-6">
                        <img 
                          src={getMediaUrl(selectedProduct.images?.[0])} 
                          alt="" 
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" 
                        />
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-3">
                         <div className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            <span>Artisan Verified</span>
                         </div>
                         <h3 className="font-black text-gray-900 text-xl leading-tight line-clamp-1">{selectedProduct.name}</h3>
                         <div className="pt-3 border-t border-gray-50">
                            <span className="text-2xl font-black text-coral">Rs. {(selectedProduct.price || 0).toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right: Actions */}
                <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
                   <div className="mb-10 text-center md:text-left">
                      <Title level={3} className="font-black m-0 tracking-tight">Product Control</Title>
                      <Text type="secondary" className="text-sm font-medium">Verify and manage this listing for the marketplace.</Text>
                   </div>

                   <div className="space-y-4">
                      <Button 
                        type="primary" 
                        className="w-full h-16 rounded-2xl bg-green-500 border-none font-black uppercase tracking-[0.15em] text-[11px] shadow-xl shadow-green-200 hover:bg-green-600 transition-all flex items-center justify-center gap-3"
                        onClick={() => handleApprove(selectedProduct._id)}
                        loading={actionLoading}
                      >
                        <Check size={20} strokeWidth={3} />
                        Approve Product
                      </Button>

                      <Button 
                        className="w-full h-16 rounded-2xl border-2 border-red-100 text-red-500 bg-white font-black uppercase tracking-[0.15em] text-[11px] hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-3"
                        onClick={() => openRejectionModal(selectedProduct._id)}
                      >
                        <Trash2 size={20} />
                        Reject Entry
                      </Button>

                      <Divider className="my-2 border-gray-50" />

                      <Button 
                        type="text"
                        className="w-full h-16 rounded-2xl bg-gray-50 text-gray-500 font-black uppercase tracking-[0.15em] text-[11px] hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
                        onClick={() => setViewDetails(true)}
                      >
                        <FileText size={20} />
                        View Full Details
                      </Button>
                   </div>
                </div>
              </div>
            ) : (
              /* State 2: Full Details View (Simple & Clean) */
              <div className="p-10 animate-in fade-in duration-300">
                 <div className="flex items-center gap-4 mb-8">
                    <Button 
                      type="text" 
                      icon={<ArrowRight size={20} className="rotate-180" />} 
                      onClick={() => setViewDetails(false)}
                      className="text-gray-400 hover:text-coral"
                    />
                    <Title level={4} className="m-0 font-black">Product Information</Title>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                       <div>
                          <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest block mb-1">Product Name</Text>
                          <Text className="font-bold text-gray-800 text-base">{selectedProduct.name}</Text>
                       </div>
                       <div>
                          <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest block mb-1">Price</Text>
                          <Text className="font-black text-coral text-base">Rs. {(selectedProduct.price || 0).toLocaleString()}</Text>
                       </div>
                       <div>
                          <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest block mb-1">Category</Text>
                          <Text className="font-bold text-gray-700">{selectedProduct.categoryId?.name || 'Handmade'}</Text>
                       </div>
                       <div>
                          <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest block mb-1">Marketplace</Text>
                          <Text className="font-bold text-gray-700">{selectedProduct.marketplace === 'craft' ? 'Craft' : 'Food'}</Text>
                       </div>
                    </div>

                    <Divider className="my-2" />

                    <div>
                       <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest block mb-2">Description</Text>
                       <Paragraph className="text-gray-600 leading-relaxed m-0 italic">
                          {selectedProduct.description}
                       </Paragraph>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                       <Button 
                         className="h-12 px-8 rounded-xl bg-gray-100 text-gray-500 border-none font-bold text-xs uppercase tracking-wider hover:bg-red-50 hover:text-red-500 transition-all"
                         onClick={() => openRejectionModal(selectedProduct._id)}
                       >
                         Reject
                       </Button>
                       <Button 
                         type="primary" 
                         className="h-12 px-8 rounded-xl bg-coral border-none font-bold text-xs uppercase tracking-wider shadow-lg shadow-coral/20"
                         onClick={() => handleApprove(selectedProduct._id)}
                         loading={actionLoading}
                       >
                         Approve
                       </Button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title={<span className="text-xl font-black text-gray-900 uppercase tracking-tight">Product Rejection</span>}
        open={rejectionModalVisible}
        onCancel={() => setRejectionModalVisible(false)}
        closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
        footer={[
          <Button key="back" onClick={() => setRejectionModalVisible(false)} className="rounded-xl font-bold">
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger 
            loading={actionLoading} 
            onClick={handleReject}
            className="bg-coral border-none rounded-xl font-bold px-8 shadow-lg shadow-coral/20"
          >
            Reject
          </Button>
        ]}
        centered
        styles={{ 
          content: { borderRadius: 32, padding: 32 }
        }}
      >
        <div className="space-y-4 py-4">
          <Text className="text-gray-400 font-medium">Please specify why this product listing is being rejected. The seller will be notified to make corrections.</Text>
          <Input.TextArea 
            rows={4} 
            placeholder="e.g., Image is low resolution, description contains restricted keywords..." 
            className="rounded-2xl bg-gray-50 border-none p-4 hover:bg-gray-100 transition-all text-gray-800 font-medium"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </Modal>

      <style jsx="true">{`
        .moderation-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #FF6B6B;
          border-color: #FF6B6B;
        }
        .moderation-checkbox .ant-checkbox-wrapper:hover .ant-checkbox-inner {
          border-color: #FF6B6B;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 10px; }
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
    </div>
  );
};

export default AdminProductModeration;
