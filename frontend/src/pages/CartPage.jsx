import React, { useContext, useState, useEffect } from 'react'
import { CartContext } from '../context/CartContext'
import { AuthContext } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ChevronLeft,
  Truck,
  Package,
  MapPin,
  Lock,
  CreditCard,
  User,
  Mail,
  Phone,
  ShieldCheck,
  UploadCloud,
  ShoppingCart
} from 'lucide-react'
import { Modal, Form, Input, Radio, Result, Button as AntButton, Upload, ConfigProvider } from 'antd'
import axios from 'axios'
import toast from 'react-hot-toast'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import Button from '../shared/Button'
import EasyPaisaLogo from '../assets/easypasia.png'
import JazzCashLogo from '../assets/jazzcash.png'

const CartPage = () => {
  const { items, remove, updateQty, total, clear } = useContext(CartContext)
  const { user } = useContext(AuthContext)
  const { deliveryCharge, taxRate } = useSettings()
  const navigate = useNavigate()

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    const uploadsIndex = pathStr.indexOf('/uploads/');
    const cleanPath = uploadsIndex !== -1 ? pathStr.substring(uploadsIndex) : `/uploads/${pathStr.split('/').pop()}`;
    return `${backendUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };
  
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [form] = Form.useForm()
  
  useEffect(() => {
    if (isSuccess) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
  }, [isSuccess]);

  const selectedPaymentMethod = Form.useWatch('paymentMethod', form)

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const tax = total * ((taxRate || 0) / 100)
  const deliveryCharges = deliveryCharge || 0
  const grandTotal = total + tax + deliveryCharges

  const handleCheckoutClick = () => {
    if (!user) {
      toast.error('Please log in to checkout', { icon: '🔒' })
      navigate('/login', { state: { from: '/cart' } })
      return
    }
    // Set user defaults if available
    form.setFieldsValue({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      paymentMethod: 'cod'
    })
    setIsCheckoutModalVisible(true)
  }

  const placeOrder = async (values) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      const payload = {
        items: items.map(i => {
          let sellerId = i.sellerId
          if (sellerId && typeof sellerId === 'object') sellerId = sellerId._id || null
          if (sellerId === '[object Object]') sellerId = null
          return {
            productId: i.productId,
            sellerId: sellerId ? String(sellerId) : null,
            productName: i.name,
            productImage: i.image,
            quantity: i.qty,
            price: i.price
          }
        }),
        paymentMethod: values.paymentMethod === 'safepay' ? 'safepay' : values.paymentMethod,
        deliveryAddress: {
          name: values.name,
          contactNumber: values.phone,
          street: values.address,
          city: values.city,
          province: '',
          postalCode: ''
        },
        deliveryCharges: deliveryCharges
      }

      const formData = new FormData();
      formData.append('items', JSON.stringify(payload.items));
      formData.append('paymentMethod', payload.paymentMethod);
      formData.append('deliveryAddress', JSON.stringify(payload.deliveryAddress));
      formData.append('deliveryCharges', payload.deliveryCharges);

      if (values.paymentMethod !== 'cod') {
        if (!values.paymentScreenshot || values.paymentScreenshot.length === 0) {
          toast.error("Please upload payment screenshot");
          setLoading(false);
          return;
        }
        formData.append('paymentScreenshot', values.paymentScreenshot[0].originFileObj);
        formData.append('transactionId', values.transactionId || '');
        formData.append('senderNumber', values.senderNumber || '');
      }

      const res = await axios.post('/api/v1/orders', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      const createdOrders = res.data.orders || []
      const orderIds = createdOrders.map(o => o._id)

      if (values.paymentMethod !== 'cod') {
        clear()
        setIsCheckoutModalVisible(false)
        setIsSuccess(true)
        return
      }

      // COD Success
      clear()
      setIsCheckoutModalVisible(false)
      navigate('/order-success', {
        state: {
          orders: createdOrders,
          paymentMethod: values.paymentMethod
        }
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  // Success state moved to a popup modal at the bottom

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-4">

        {items.length === 0 ? (
          /* EMPTY CART */
          <div className="bg-white rounded-2xl p-20 text-center shadow-sm">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={48} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Start adding products</p>
            <Button to="/shop" variant="primary" size="lg">
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-1">Shopping Cart</h1>
                <p className="text-gray-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="flex items-center gap-2 text-coral font-semibold hover:underline"
              >
                <ChevronLeft size={20} />
                Continue Shopping
              </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* LEFT: PRODUCTS */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-6 items-start">

                      {/* PRODUCT IMAGE */}
                      <div className="flex-shrink-0">
                        <img
                          src={getMediaUrl(item.image)}
                          alt={item.name}
                          className="w-32 h-32 object-cover rounded-xl border border-gray-100"
                        />
                      </div>

                      {/* PRODUCT INFO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                              {item.name}
                            </h3>
                            <p className="text-2xl font-black text-coral">
                              PKR {item.price.toLocaleString()}
                            </p>
                          </div>

                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => remove(item.productId)}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            title="Remove"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* BOTTOM ROW: QUANTITY & SUBTOTAL */}
                        <div className="flex items-center justify-between">
                          {/* QUANTITY */}
                          <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => updateQty(item.productId, item.qty - 1)}
                              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <div className="w-16 h-10 flex items-center justify-center border-x-2 border-gray-200">
                              <span className="font-bold text-gray-900">{item.qty}</span>
                            </div>
                            <button
                              onClick={() => updateQty(item.productId, item.qty + 1)}
                              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* SUBTOTAL */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                            <p className="text-xl font-black text-gray-900">
                              PKR {(item.price * item.qty).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT: ORDER SUMMARY */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-8 shadow-sm sticky top-24">

                  {/* HEADER */}
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="w-10 h-10 bg-coral/10 rounded-lg flex items-center justify-center">
                      <Package size={20} className="text-coral" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">Order Summary</h2>
                  </div>

                  {/* PRICE BREAKDOWN */}
                  <div className="space-y-4 mb-6 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Subtotal</span>
                      <span className="font-black text-gray-900">
                        PKR {total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600">
                      <div className="flex items-center gap-2">
                        <Truck size={16} />
                        <span className="font-medium">Delivery Charges</span>
                      </div>
                      <span className="font-black text-coral italic">
                        {deliveryCharges > 0 ? `PKR ${deliveryCharges.toLocaleString()}` : 'Free'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-bold text-gray-900">
                        PKR {Math.round(tax).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* TOTAL */}
                  <div className="pt-6 border-t border-gray-100 mb-8">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-500 uppercase">Total</span>
                      <div className="text-right">
                        <p className="text-3xl font-black text-coral">
                          PKR {Math.round(grandTotal).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Incl. all taxes</p>
                      </div>
                    </div>
                  </div>

                  {/* CHECKOUT BUTTON */}
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full bg-coral hover:bg-coral/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-coral/30"
                  >
                    Proceed to Checkout
                  </button>

                  {/* FOOTER TEXT */}
                  <p className="text-center text-xs text-gray-500 mt-4">
                    Secure payment • Fast delivery
                  </p>
                </div>
              </div>
            </div>

            {/* CHECKOUT MODAL */}
            <Modal
              title={
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mt-2">
                  <div className="w-10 h-10 bg-coral/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag size={20} className="text-coral" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 m-0">Complete Your Order</h2>
                </div>
              }
              open={isCheckoutModalVisible}
              onCancel={() => setIsCheckoutModalVisible(false)}
              footer={null}
              width={700}
              centered
              className="checkout-modal"
            >
              <Form 
                form={form} 
                layout="vertical" 
                onFinish={placeOrder}
                initialValues={{ paymentMethod: 'cod' }}
                className="mt-6"
              >
                {/* Delivery Information */}
                <div className="mb-8">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin size={16} /> Delivery Address
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Form.Item name="name" rules={[{ required: true, message: 'Please enter your full name' }, { min: 3, message: 'Name must be at least 3 characters' }]}>
                      <Input prefix={<User size={16} className="text-gray-400 mr-2" />} placeholder="Full Name" size="large" className="rounded-xl font-medium" />
                    </Form.Item>
                    <Form.Item name="phone" rules={[
                        { required: true, message: 'Please enter your phone number' },
                        { pattern: /^(\+92|0)?3[0-9]{2}[0-9]{7}$/, message: 'Please enter a valid Pakistani mobile number (e.g. 03001234567)' }
                    ]}>
                      <Input prefix={<Phone size={16} className="text-gray-400 mr-2" />} placeholder="Phone Number" size="large" className="rounded-xl font-medium" />
                    </Form.Item>
                    <Form.Item name="email" className="md:col-span-2" rules={[
                        { required: true, message: 'Please enter your email address' },
                        { type: 'email', message: 'Please enter a valid email address' }
                    ]}>
                      <Input prefix={<Mail size={16} className="text-gray-400 mr-2" />} placeholder="Email Address" size="large" className="rounded-xl font-medium" />
                    </Form.Item>
                    <Form.Item name="address" className="md:col-span-2" rules={[{ required: true, message: 'Please enter your detailed delivery address' }]}>
                      <Input placeholder="House #, Street, Area" size="large" className="rounded-xl font-medium" />
                    </Form.Item>
                    <Form.Item name="city" className="md:col-span-2 mb-0" rules={[{ required: true, message: 'Please enter your city' }]}>
                      <Input placeholder="City" size="large" className="rounded-xl font-medium" />
                    </Form.Item>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-8">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Lock size={16} /> Payment Method
                  </h3>
                  <Form.Item name="paymentMethod" className="m-0">
                    <Radio.Group className="w-full">
                      <div className="flex flex-row gap-4">
                        <Radio value="easypaisa" className={`custom-radio-card flex-1 m-0 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${selectedPaymentMethod === 'easypaisa' ? 'border-[#00B551] bg-[#00B551]/5 shadow-sm shadow-[#00B551]/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'}`}>
                          <div className="flex items-center justify-center w-full h-16 py-2 px-4">
                            <img src={EasyPaisaLogo} alt="EasyPaisa" className="h-full object-contain mix-blend-multiply" />
                          </div>
                        </Radio>
                        <Radio value="jazzcash" className={`custom-radio-card flex-1 m-0 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${selectedPaymentMethod === 'jazzcash' ? 'border-[#ED1C24] bg-[#ED1C24]/5 shadow-sm shadow-[#ED1C24]/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'}`}>
                          <div className="flex items-center justify-center w-full h-16 py-2 px-4">
                            <img src={JazzCashLogo} alt="JazzCash" className="h-full object-contain mix-blend-multiply" />
                          </div>
                        </Radio>
                      </div>
                    </Radio.Group>
                  </Form.Item>
                </div>

                {/* Manual Payment Verification Fields */}
                {selectedPaymentMethod && selectedPaymentMethod !== 'cod' && (
                  <div className="mb-8 p-6 bg-orange-50 border border-orange-100 rounded-3xl shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-orange-500" /> Payment Verification
                    </h3>
                    
                    <div className="bg-white p-5 rounded-2xl border border-orange-100 mb-6 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Transfer Details</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                <span className="text-sm font-medium text-gray-500">Account Title</span>
                                <span className="text-sm font-black text-gray-900">Homedify Admin</span>
                            </div>
                            
                            {selectedPaymentMethod === 'easypaisa' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">EasyPaisa No.</span>
                                    <span className="text-lg font-black text-coral tracking-wider">0311 5809634</span>
                                </div>
                            )}
                            {selectedPaymentMethod === 'jazzcash' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">JazzCash No.</span>
                                    <span className="text-lg font-black text-coral tracking-wider">0300 7654321</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Form.Item 
                      name="paymentScreenshot" 
                      label={<span className="font-bold text-xs uppercase tracking-widest text-gray-500">Upload Receipt Screenshot</span>}
                      valuePropName="fileList" 
                      getValueFromEvent={normFile}
                      rules={[{ required: true, message: 'Please upload the payment screenshot' }]}
                    >
                      <Upload name="paymentScreenshot" listType="picture-card" maxCount={1} beforeUpload={() => false} className="checkout-upload">
                        <div className="flex flex-col items-center justify-center p-4 group">
                          <UploadCloud size={24} className="text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                          <div style={{ marginTop: 4, fontSize: '11px', fontWeight: 'bold', color: '#8C8C8C' }}>Upload Receipt</div>
                        </div>
                      </Upload>
                    </Form.Item>

                    <Form.Item 
                      name="transactionId" 
                      label={<span className="font-bold text-xs uppercase tracking-widest text-gray-500">Transaction ID / TID</span>}
                      rules={[{ required: true, message: 'Required for verification' }]}
                    >
                      <Input placeholder="Enter 11-digit TID or Ref Number" size="large" className="rounded-xl font-medium h-12 bg-white" />
                    </Form.Item>

                    <Form.Item 
                      name="senderNumber" 
                      label={<span className="font-bold text-xs uppercase tracking-widest text-gray-500">Sender Account Number (EasyPaisa/JazzCash)</span>}
                      className="mb-0"
                      rules={[
                        { required: true, message: 'Please enter the number you paid from' },
                        { pattern: /^(\+92|0)?3[0-9]{2}[0-9]{7}$/, message: 'Valid mobile number required' }
                      ]}
                    >
                      <Input placeholder="e.g. 03001234567" size="large" className="rounded-xl font-medium h-12 bg-white" />
                    </Form.Item>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-xl mb-6 flex justify-between items-center border border-gray-100">
                  <span className="font-bold text-gray-600 uppercase tracking-widest text-xs">Total Amount</span>
                  <span className="font-black text-coral text-xl">PKR {Math.round(grandTotal).toLocaleString()}</span>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full h-14 rounded-xl font-black uppercase tracking-widest text-sm text-white flex items-center justify-center transition-all duration-300 ${loading ? 'bg-coral/50 cursor-not-allowed' : 'bg-coral hover:bg-[#ff5252] shadow-lg shadow-coral/30 hover:shadow-xl hover:shadow-coral/40 hover:-translate-y-1 active:translate-y-0'}`}
                >
                  {loading ? 'Processing...' : 'Confirm Order'}
                </button>
              </Form>
            </Modal>
          </>
        )}
      </div>

      {/* SUCCESS MODAL */}
      <Modal
        open={isSuccess}
        footer={null}
        closable={false}
        centered
        width={400}
        mask={{ closable: false }}
        className="success-animation-modal"
      >
        <div className="text-center py-8">
          {/* Custom Animation Container */}
          <div className="relative w-full h-32 flex items-center justify-center overflow-hidden mb-6 bg-gray-50 rounded-2xl">
            <div className="absolute text-coral animate-wallet z-10 flex flex-col items-center">
              <ShoppingCart size={56} strokeWidth={1.5} />
            </div>
            <div className="absolute text-orange-500 animate-package z-0">
              <Package size={32} strokeWidth={2} />
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-green-600 mb-2 animate-in fade-in zoom-in duration-500 delay-300">Congratulations!</h2>
          <p className="text-gray-500 font-medium mb-6">
            Your order has been successfully placed. Your payment details are <span className="text-coral font-bold italic">Pending Verification</span>.
          </p>
          
          <div className="bg-orange-50 p-4 rounded-2xl text-xs text-orange-700 text-left border border-orange-100 leading-relaxed mb-8">
            <p className="font-bold mb-1 flex items-center gap-2">
              <ShieldCheck size={14} /> Trust & Safety Protocol
            </p>
            Funds will be released to the seller only after they provide valid shipping proof and 3 days have passed since delivery.
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate('/')}
              className="w-full h-14 bg-coral hover:bg-[#ff5252] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] transition-all duration-300 shadow-xl shadow-coral/30 hover:-translate-y-1 active:translate-y-0"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .checkout-radio.ant-radio-button-wrapper-checked {
          border-color: #FF6B6B !important;
          background-color: #fffaf9 !important;
        }
        .checkout-radio.ant-radio-button-wrapper-checked::before {
          background-color: transparent !important;
        }
        .checkout-radio .ant-radio-button {
          display: none !important;
        }
        
        /* Completely Hide Radio Circle for Custom Logo Cards */
        .custom-radio-card .ant-radio {
          display: none !important;
        }
        .custom-radio-card span.ant-radio + * {
          padding-inline-start: 0 !important;
          padding-inline-end: 0 !important;
          width: 100%;
        }

        /* Success Custom Animations */
        @keyframes walletSlideIn {
          0% { transform: translateX(-150px); opacity: 0; }
          15% { transform: translateX(0); opacity: 1; }
          65% { transform: translateX(0); opacity: 1; }
          85% { transform: translateX(150px); opacity: 0; }
          100% { transform: translateX(150px); opacity: 0; }
        }

        @keyframes packageDrop {
          0% { transform: translateY(-80px) scale(0.5); opacity: 0; }
          15% { transform: translateY(-80px) scale(0.5); opacity: 0; }
          30% { transform: translateY(-15px) scale(1); opacity: 1; }
          50% { transform: translateY(10px) scale(0.5); opacity: 0; } 
          100% { transform: translateY(10px) scale(0.5); opacity: 0; }
        }

        .animate-wallet {
          animation: walletSlideIn 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-package {
          animation: packageDrop 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  )
}

export default CartPage
