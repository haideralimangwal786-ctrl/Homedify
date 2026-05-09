import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, Input, Modal, Card, Select,
  Typography, Image as AntImage, Tooltip, Divider, Row, Col, Badge, Tabs
} from 'antd';
import { 
  Search, Eye, CheckCircle2, XCircle, CreditCard, 
  Truck, Info, AlertTriangle, FileText, Image as ImageIcon,
  User, DollarSign, Package, X, ArrowRight, Store,
  ExternalLink, ShoppingBag, Clock, History, ShieldCheck, Check,
  Landmark, Zap, Phone, Hash
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { calculatePayout } from '../utils/financialUtils';
const { Title, Text, Paragraph } = Typography;

const AdminOrderMonitoring = ({ windowWidth: propWindowWidth }) => {
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
  const { commissionRate } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('escrow');
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    // Periodic refresh every 30 seconds for dynamic monitoring
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/admin/orders');
      // Only show orders that need payment verification (To-Do List style)
      const pendingVerification = (res.data.data || []).filter(o => o.paymentStatus === 'pending_verification');
      setOrders(pendingVerification);
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await api.put(`/api/v1/admin/orders/${selectedOrder._id}/release-payment`);
      toast.success('Payment released to seller manually!');
      fetchOrders();
      setIsReleaseModalOpen(false);
      if (isModalOpen) setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId) => {
    setActionLoading(true);
    try {
      await api.put(`/api/v1/admin/orders/${orderId}/verify-payment`);
      toast.success('Payment verified successfully!');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectReason) return toast.error('Please provide a reason');
    setActionLoading(true);
    try {
      await api.put(`/api/v1/admin/orders/${selectedOrder._id}/reject-payment`, { rejectionReason: rejectReason });
      toast.success('Payment rejected');
      setIsRejectModalOpen(false);
      setRejectReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const openReleaseModal = (record) => {
    setSelectedOrder(record);
    setIsReleaseModalOpen(true);
  };

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

  const isThreeDaysPassed = (shippedAt) => {
    if (!shippedAt) return false;
    const today = new Date();
    const shippedDate = new Date(shippedAt);
    const diffTime = today - shippedDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 3;
  };

  const escrowTotal = orders
    .filter(o => o.paymentStatus === 'held_in_escrow')
    .reduce((sum, o) => sum + (o.total || 0), 0);
    
  const readyToReleaseCount = orders
    .filter(o => o.paymentStatus === 'held_in_escrow' && (o.status === 'delivered' || isThreeDaysPassed(o.shippedAt)))
    .length;

  const pendingVerificationCount = orders
    .filter(o => o.paymentStatus === 'pending_verification')
    .length;

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
      (o.sellerId?.storeName || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (o.customerId?.name || "").toLowerCase().includes(searchText.toLowerCase());
    
    const matchesMarketplace = marketplaceFilter === 'all' || o.orderItems?.[0]?.marketplace === marketplaceFilter;
    
    // Show all orders for monitoring, but default search/filter applies
    return matchesSearch && matchesMarketplace;
  });

  const totalPendingAmount = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const columns = [
    {
      title: 'Order Date',
      key: 'orderDate',
      width: 140,
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">
            #{record.orderId.split('-').pop()}
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
            <img 
              src={getMediaUrl(items?.[0]?.productImage) || 'https://files.catbox.moe/6z7x6v.png'} 
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
            <div className="flex flex-col min-w-0 cursor-pointer hover:bg-gray-50 p-1 -ml-1 rounded-md transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-800 text-xs truncate max-w-[110px]">
                  {items?.[0]?.productName || 'Handi Craft'}
                </span>
                {items?.length > 1 && (
                  <span className="px-1.5 py-0.5 bg-coral/10 text-coral rounded-[4px] text-[8px] font-black whitespace-nowrap">
                    +{items.length - 1}
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
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col">
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
      render: (val) => (
        <div className="flex flex-col">
          <span className="font-bold text-coral text-xs">Rs. {val?.toLocaleString()}</span>
          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Paid</span>
        </div>
      )
    },
    {
      title: 'Payment Proof',
      dataIndex: 'paymentScreenshot',
      key: 'paymentSlip',
      align: 'center',
      width: 110,
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
                    preview={{
                      mask: null
                    }}
                  />
                </div>
                <div className="absolute inset-0 z-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-coral group-hover:text-white group-hover:border-coral group-hover:shadow-md group-hover:shadow-coral/20 transition-all duration-300 shadow-sm">
                  <ImageIcon size={16} className="group-hover:scale-125 transition-transform duration-300" />
                </div>
             </div>
           ) : (
             <div className="w-10 h-10 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-200">
               <FileText size={16} />
             </div>
           )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 160,
      render: (_, record) => {
        const canRelease = record.status === 'delivered' || (record.status === 'shipped' && isThreeDaysPassed(record.shippedAt));
        const isPaid = record.paymentStatus === 'released' || record.paymentStatus === 'paid_to_seller';
        const isPendingVerification = record.paymentStatus === 'pending_verification';
        
        return (
          <Space size="middle">
            {isPendingVerification ? (
               <Tooltip title="Verify Payment">
                 <Button 
                   type="text"
                   onClick={() => handleVerifyPayment(record._id)}
                   loading={actionLoading && selectedOrder?._id === record._id}
                   className="text-green-500 hover:bg-green-50 rounded-xl h-10 w-10 flex items-center justify-center transition-all hover:scale-110"
                   icon={<CheckCircle2 size={20} />}
                 />
               </Tooltip>
            ) : (
               <Tooltip title={isPaid ? "Settled" : "Approve & Release Payment"}>
                 <Button 
                   type="text"
                   disabled={!canRelease || isPaid}
                   loading={actionLoading && selectedOrder?._id === record._id}
                   onClick={() => openReleaseModal(record)}
                   className={`rounded-xl flex items-center justify-center h-10 w-10 transition-all ${
                     isPaid ? 'text-gray-200' : 
                     !canRelease ? 'text-gray-200' : 
                     'text-green-500 hover:bg-green-50 hover:scale-110'
                   }`}
                   icon={<CheckCircle2 size={20} />}
                 />
               </Tooltip>
            )}
            
            <Tooltip title="Reject Payment">
              <Button 
                type="text"
                disabled={isPaid}
                onClick={() => { setSelectedOrder(record); setIsRejectModalOpen(true); }}
                className={`rounded-xl flex items-center justify-center h-10 w-10 transition-all ${
                  isPaid ? 'text-gray-200' : 'text-red-500 hover:bg-red-50 hover:scale-110'
                }`}
                icon={<XCircle size={20} />}
              />
            </Tooltip>

            <Tooltip title="View Receipt">
              <Button 
                type="text"
                icon={<Eye size={20} />}
                onClick={() => { setSelectedOrder(record); setIsModalOpen(true); }}
                className="text-gray-400 hover:text-coral hover:bg-coral/5 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];



  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Box 1: Search & Filter Header */}
      <div className="bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
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
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Text className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">Marketplace:</Text>
          <Select
            defaultValue="all"
            onChange={(value) => setMarketplaceFilter(value)}
            className="w-full md:w-[180px]"
          >
            <Select.Option value="all">All Items</Select.Option>
            <Select.Option value="craft">Handmade (Craft)</Select.Option>
            <Select.Option value="food">Non-Fresh Food</Select.Option>
          </Select>
        </div>
      </div>

      {/* Box 2: Table Section */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          rowKey="_id"
          className="premium-table"
          pagination={false}
          scroll={windowWidth < 1200 ? { x: 'max-content' } : undefined}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={450}
        centered
        styles={{ content: { borderRadius: 24, padding: 0, overflow: 'hidden' } }}
        closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
      >
        {selectedOrder && (
          <div className="p-6 bg-white">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50">
              <span className="font-black uppercase tracking-widest text-[11px] text-gray-400">Order Information</span>
              <span className="font-bold text-coral text-[11px]">#{selectedOrder.orderId}</span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</span>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                  {selectedOrder.orderItems?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2 text-[11px]">
                      <div className="flex gap-2">
                        <span className="font-black text-coral">{item.quantity}x</span>
                        <span className="font-bold text-gray-700">{item.productName}</span>
                      </div>
                      <span className="font-black text-gray-900 whitespace-nowrap">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <Divider className="my-2 border-gray-100" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Subtotal</span>
                    <span className="font-black text-gray-900">Rs. {selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-bold text-gray-400 shrink-0">User Name:</span>
                <span className="text-xs font-black text-gray-900 text-right">{selectedOrder.customerId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-bold text-gray-400 shrink-0">Email:</span>
                <span className="text-xs font-black text-gray-900 text-right truncate max-w-[200px]">{selectedOrder.customerId?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-bold text-gray-400 shrink-0">Account Number:</span>
                <span className="text-xs font-black text-gray-900 text-right">
                  {selectedOrder.paymentId?.senderNumber || selectedOrder.senderNumber || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-bold text-gray-400 shrink-0">Payment Method:</span>
                <span className="text-xs font-black text-coral text-right uppercase tracking-tighter">
                  {selectedOrder.paymentId?.paymentMethod ? 
                    (selectedOrder.paymentId.paymentMethod.charAt(0).toUpperCase() + selectedOrder.paymentId.paymentMethod.slice(1)) : 
                    'EasyPaisa/JazzCash'}
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs font-bold text-gray-400 shrink-0">Address:</span>
                <span className="text-xs font-black text-gray-900 text-right">{selectedOrder.deliveryAddress?.street || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-bold text-gray-400 shrink-0">City:</span>
                <span className="text-xs font-black text-gray-900 text-right">{selectedOrder.deliveryAddress?.city || 'N/A'}</span>
              </div>
            </div>

            {/* Compact Screenshot */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Screenshot</span>
              <div className="w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center p-2">
                 {selectedOrder.paymentScreenshot ? (
                   <AntImage 
                     src={getMediaUrl(selectedOrder.paymentScreenshot)} 
                     className="max-w-full h-auto max-h-[180px] object-contain rounded-lg"
                     fallback="https://files.catbox.moe/6z7x6v.png"
                   />
                 ) : (
                   <div className="py-8 flex flex-col items-center text-gray-300">
                      <FileText size={24} className="mb-2" />
                      <span className="text-[9px] font-black uppercase">No Slip Found</span>
                   </div>
                 )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end gap-3">
              <Button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg font-bold text-[11px] h-9 px-6 border-gray-100 text-gray-400"
              >
                Close
              </Button>
              {selectedOrder.paymentStatus === 'pending_verification' && (
                <Button 
                  type="primary"
                  className="bg-green-500 border-none rounded-lg px-8 font-black uppercase text-[10px] h-9 shadow-md shadow-green-100"
                  onClick={() => handleVerifyPayment(selectedOrder._id)}
                  loading={actionLoading}
                >
                  Verify
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Payment Modal */}
      <Modal
        title={<span className="font-black text-lg text-gray-900">Reject Payment</span>}
        open={isRejectModalOpen}
        onCancel={() => { setIsRejectModalOpen(false); setRejectReason(''); }}
        closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
        onOk={handleRejectPayment}
        okButtonProps={{ danger: true, className: "font-bold shadow-md rounded-lg" }}
        cancelButtonProps={{ className: "font-bold rounded-lg border-gray-200" }}
        okText="Confirm Rejection"
        confirmLoading={actionLoading}
        centered
        styles={{ content: { borderRadius: 24 } }}
      >
        <div className="mt-4">
          <Text className="font-bold text-gray-600 mb-2 block">Reason for Rejection:</Text>
          <Input.TextArea 
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Invalid screenshot, insufficient amount, wrong transaction ID..."
            className="rounded-xl font-medium p-3 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </Modal>

      {/* Manual Release Payment Modal */}
      <Modal
        title={null}
        open={isReleaseModalOpen}
        onCancel={() => setIsReleaseModalOpen(false)}
        closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
        footer={null}
        width={500}
        centered
        styles={{ content: { borderRadius: 24, padding: 32 } }}
      >
        {selectedOrder && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <DollarSign size={32} className="text-orange-500" />
            </div>
            <Title level={3} className="m-0 font-black tracking-tight mb-2">Manual Payout Required</Title>
            <Text className="text-gray-500 mb-6 max-w-sm">
              Please transfer the funds directly to the Seller's bank account before confirming.
            </Text>

            <div className="bg-gray-50 w-full rounded-2xl p-5 mb-6 text-left border border-gray-100">
              <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Payout Details</Text>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Text className="text-xs text-gray-500">Order ID</Text>
                  <Text className="font-bold text-gray-900">#{selectedOrder.orderId}</Text>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <Text className="text-xs text-gray-500">Net Payout</Text>
                  <Text className="font-black text-coral text-lg">{`Rs. ${calculatePayout(selectedOrder.total, commissionRate).net.toLocaleString()}`}</Text>
                </div>

                <div>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-coral mb-2 block">Seller Bank Account</Text>
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                       <CreditCard size={14} className="text-gray-400" />
                       <Text className="text-xs font-black text-gray-800 uppercase tracking-wide">
                         {selectedOrder.sellerId?.bankDetails?.bankName || 'N/A'}
                       </Text>
                    </div>
                    <Text className="block text-[13px] font-bold text-gray-900">{selectedOrder.sellerId?.bankDetails?.accountTitle || 'N/A'}</Text>
                    <Text className="block text-xs font-mono text-gray-500 tracking-tighter mt-0.5">{selectedOrder.sellerId?.bankDetails?.accountNumber || 'N/A'}</Text>
                    {selectedOrder.sellerId?.bankDetails?.iban && (
                      <Text className="block text-[10px] font-mono text-gray-400 mt-1">{selectedOrder.sellerId?.bankDetails?.iban}</Text>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="primary" 
              size="large"
              className="w-full bg-coral hover:bg-coral border-none rounded-xl h-14 font-black uppercase tracking-widest shadow-xl shadow-coral/20 hover:scale-[1.02] transition-transform"
              onClick={handleReleasePayment}
              loading={actionLoading}
            >
              I have manually transferred the amount
            </Button>
            <Button 
              type="text" 
              className="w-full mt-3 font-bold text-gray-400 hover:text-gray-600"
              onClick={() => setIsReleaseModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        )}
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
            border-radius: 24px !important;
        }
        .premium-table .ant-table {
            background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default AdminOrderMonitoring;
