import React, { useEffect, useState, useContext, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import UserLayout from '../shared/UserLayout'
import { AuthContext } from '../context/AuthContext'
import {
    ChevronLeft, Package,
    ShoppingBag,
    Truck, CheckCircle,
    Clock, CheckSquare, XCircle, X
} from 'lucide-react'
import { Modal, Input, Typography, Button } from 'antd'
import toast from 'react-hot-toast'

const { Text } = Typography

// ─── Status timeline config ─────────────────────────────────────────────────
const ORDERED_STATUSES = [
    'placed', 'processing', 'shipped', 'out_for_delivery', 'delivered'
]

const STATUS_MAPPING = {
    pending_payment: 'placed',
    confirmed: 'placed',
    seller_accepted: 'processing',
    preparing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    completed: 'delivered',
}

const STAGE_LABELS = {
    placed: { label: 'Order Placed', icon: <ShoppingBag size={18} />, desc: 'Order received and confirmed' },
    processing: { label: 'Processing', icon: <Clock size={18} />, desc: 'Seller is preparing your item' },
    shipped: { label: 'Shipped', icon: <Truck size={18} />, desc: 'Item has left seller warehouse' },
    out_for_delivery: { label: 'Out for Delivery', icon: <Package size={18} />, desc: 'Your order is near you' },
    delivered: { label: 'Delivered', icon: <CheckCircle size={18} />, desc: 'Your order has been delivered!' },
}

// ─── Timeline Step Component (Vertical Bar Design) ──────────────────────────
const TimelineStep = ({ label, desc, date, state, isLast, currentIdx, idx, totalStages }) => (
    <div className="flex gap-4 sm:gap-8 relative group">
        {!isLast && (
            <div className="absolute left-4 top-8 bottom-[-8px] w-1 bg-gray-100 rounded-full z-0 overflow-hidden">
                <div 
                    className="w-full bg-emerald-500 transition-all duration-1000 origin-top"
                    style={{ height: state === 'done' ? '100%' : state === 'current' ? '50%' : '0%' }}
                />
            </div>
        )}
        <div className="flex flex-col items-center relative z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                state === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' :
                state === 'current' ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 shadow-lg' :
                'bg-white border-gray-200 text-gray-300'
            }`}>
                {state === 'done' ? <CheckCircle size={16} /> : STAGE_LABELS[label.toLowerCase().replace(/ /g, '_')]?.icon || <Clock size={16} />}
            </div>
        </div>
        <div className="pb-12 flex-1 pt-1">
            <h4 className={`text-base font-black tracking-tight ${state !== 'pending' ? 'text-gray-900' : 'text-gray-300'}`}>
                {label}
            </h4>
            <p className="text-xs text-gray-400 font-bold mt-1 tracking-wide">
                {state !== 'pending' ? desc : 'Scheduled Stage'}
            </p>
            {date && (
                <p className="text-[10px] text-emerald-600/70 font-black mt-2 bg-emerald-50 inline-block px-2 py-0.5 rounded italic">
                    {new Date(date).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
            )}
        </div>
    </div>
)

// ─── Main minimal tracking page ─────────────────────────────────────────────
const UserOrderDetails = () => {
    const { id } = useParams()
    const { user } = useContext(AuthContext)

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [confirmLoading, setConfirmLoading] = useState(false)
    const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false)
    const [newScreenshot, setNewScreenshot] = useState(null)

    const token = localStorage.getItem('token')
    const authHeader = { headers: { Authorization: `Bearer ${token}` } }

    const fetchOrder = useCallback(async () => {
        try {
            const res = await axios.get(`/api/v1/orders/${id}`, authHeader)
            setOrder(res.data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => { fetchOrder() }, [fetchOrder])

    const handleReupload = async () => {
        if (!newScreenshot) return toast.error('Please select a screenshot first')
        
        const formData = new FormData()
        formData.append('paymentScreenshot', newScreenshot)

        setConfirmLoading(true)
        try {
            await axios.put(`/api/v1/orders/${id}/re-upload-payment`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
            toast.success('Payment proof updated successfully!')
            setIsReuploadModalOpen(false)
            setNewScreenshot(null)
            await fetchOrder()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update payment proof.')
        } finally {
            setConfirmLoading(false)
        }
    }

    const handleConfirmDelivery = async () => {
        Modal.confirm({
            title: 'Confirm Delivery',
            content: 'Are you sure you have received this order? Once confirmed, this action cannot be undone.',
            okText: 'Yes, Received',
            cancelText: 'Not Yet',
            centered: true,
            okButtonProps: { className: 'bg-emerald-500 hover:bg-emerald-600 border-none' },
            onOk: async () => {
                setConfirmLoading(true)
                try {
                    await axios.put(`/api/v1/orders/${id}/confirm-delivery`, {}, authHeader)
                    toast.success('Order receipt confirmed!')
                    await fetchOrder()
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to confirm delivery.')
                } finally {
                    setConfirmLoading(true) // Setting to true here to let fetchOrder finish then it sets to false in fetchOrder? No, fetchOrder sets loading=false.
                    // Actually, let's just keep it simple.
                    setConfirmLoading(false)
                }
            }
        })
    }


    const handleCancelOrder = async () => {
        let reason = ""
        Modal.confirm({
            title: 'Cancel Order',
            content: (
                <div className="mt-4">
                    <p className="text-gray-500 text-xs mb-4 font-bold uppercase tracking-tight">Are you sure you want to cancel this order? This action cannot be undone.</p>
                    <Input.TextArea 
                        placeholder="Why are you cancelling? (Optional)" 
                        rows={3} 
                        className="rounded-xl border-gray-100 focus:border-coral transition-all"
                        onChange={(e) => reason = e.target.value}
                    />
                </div>
            ),
            okText: 'Cancel Order',
            cancelText: 'Keep Order',
            okType: 'danger',
            centered: true,
            okButtonProps: { className: 'bg-red-500 hover:bg-red-600 border-none rounded-xl font-bold' },
            cancelButtonProps: { className: 'rounded-xl font-bold' },
            onOk: async () => {
                setConfirmLoading(true)
                try {
                    await axios.put(`/api/v1/orders/${id}/cancel`, { reason }, authHeader)
                    toast.success('Order cancelled successfully')
                    await fetchOrder()
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to cancel order.')
                } finally {
                    setConfirmLoading(false)
                }
            }
        })
    }


    if (loading) return (
        <UserLayout>
            <div className="py-40 flex flex-col items-center justify-center bg-gray-50/50 min-h-screen">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-coral rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Gathering tracking details...</p>
            </div>
        </UserLayout>
    )

    if (!order) return (
        <UserLayout>
            <div className="py-40 text-center bg-gray-50/50 min-h-screen">
                <Package className="mx-auto text-gray-200 mb-4" size={64} />
                <h3 className="text-xl font-black text-gray-900 mb-2 italic">Tracking not found</h3>
                <Link to="/customer/orders" className="text-sm text-coral font-black uppercase tracking-widest hover:underline px-6 py-2">← Back to Orders</Link>
            </div>
        </UserLayout>
    )

    const mappedStatus = STATUS_MAPPING[order.status] || 'placed'
    const currentIdx = ORDERED_STATUSES.indexOf(mappedStatus)
    const isCancelled = order.status.startsWith('cancelled')

    const timeline = isCancelled ? [
        { label: 'Order Placed', desc: 'Order was received', state: 'done', date: order.createdAt },
        { label: 'Cancelled', desc: order.cancellationReason || 'Order was cancelled', state: 'current', date: order.updatedAt }
    ] : ORDERED_STATUSES.map((s, i) => {
        const stage = STAGE_LABELS[s]
        const historyEntry = order.statusHistory?.find(h => STATUS_MAPPING[h.status] === s)
        return {
            label: stage.label,
            desc: stage.desc,
            date: historyEntry?.timestamp || (i === 0 ? order.createdAt : null),
            state: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'pending'
        }
    })

    const canConfirm = order.status === 'shipped'
    const canCancel = !['shipped', 'delivered', 'completed', 'cancelled_by_customer', 'cancelled_by_seller', 'returned', 'refunded'].includes(order.status)
    const firstItem = order.orderItems?.[0] || {}

    return (
        <UserLayout>
            <div className="bg-gray-50/50 min-h-screen pb-10 sm:pb-20">
                <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 sm:px-10">

                    {/* Minimalist Top Header */}
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 sm:mb-8">
                        <Link to="/customer/orders" className="hover:text-coral transition-colors flex items-center gap-1">
                            <ChevronLeft size={12} />
                            Orders
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-900 tracking-tighter">Order Summary</span>
                    </div>

                    {/* Single Main Box strictly for Tracking info */}
                    <section className="bg-white border border-gray-100 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-14 shadow-sm relative overflow-hidden">
                        
                        {/* Summary of the item on top instead of huge lists */}
                        <div className="flex items-center gap-4 sm:gap-6 pb-8 sm:pb-12 mb-8 sm:mb-12 border-b border-gray-50">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                <img
                                    src={firstItem.productImage || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=200'}
                                    alt={firstItem.productName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                                    {firstItem.productName || 'Homedify Product'}
                                </h2>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                    {order.orderItems?.length > 1 ? `+ ${order.orderItems.length - 1} more items` : 'Single Item'}
                                </p>
                            </div>
                        </div>

                        {/* Title strictly for Tracking */}
                        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-[0.05em] uppercase mb-8 sm:mb-10 flex items-center gap-3">
                            Track <span className="text-coral">Order</span>
                        </h3>
                        
                        {/* The pure vertical tracking timeline */}
                        <div className="pl-2">
                            {timeline.map((step, idx) => (
                                <TimelineStep 
                                    key={idx} 
                                    {...step} 
                                    isLast={idx === timeline.length - 1} 
                                    currentIdx={currentIdx}
                                    idx={idx}
                                    totalStages={timeline.length}
                                />
                            ))}
                        </div>

                        {/* Action Buttons (Confirm Delivery) */}
                        <div className="mt-8 flex flex-col gap-3">
                            {canConfirm && (
                                <button 
                                    onClick={handleConfirmDelivery} 
                                    disabled={confirmLoading} 
                                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
                                >
                                    {confirmLoading ? 'Processing...' : <><CheckSquare size={16} /> Confirm Delivery</>}
                                </button>
                            )}

                            {order.status === 'payment_failed' && (
                                <div className="space-y-4">
                                    <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 mb-2">
                                        <Text className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Admin Feedback</Text>
                                        <Text className="text-sm font-bold text-gray-800 italic">"{order.rejectionReason || 'Your payment proof was rejected. Please upload a clear screenshot of the transaction.'}"</Text>
                                    </div>
                                    <button 
                                        onClick={() => setIsReuploadModalOpen(true)}
                                        disabled={confirmLoading}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                                    >
                                        {confirmLoading ? 'Processing...' : <><CheckSquare size={16} /> Re-upload Payment Proof</>}
                                    </button>
                                </div>
                            )}

                            {canCancel && (
                                <button 
                                    onClick={handleCancelOrder} 
                                    disabled={confirmLoading} 
                                    className="w-full py-4 bg-white text-red-500 border border-red-100 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <XCircle size={16} /> Cancel Order
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Re-upload Modal */}
                    <Modal
                        title={<span className="font-black text-gray-900 uppercase tracking-widest text-sm">Update Payment Proof</span>}
                        open={isReuploadModalOpen}
                        onCancel={() => { setIsReuploadModalOpen(false); setNewScreenshot(null); }}
                        footer={[
                            <Button key="back" onClick={() => setIsReuploadModalOpen(false)} className="rounded-xl font-bold">
                                Dismiss
                            </Button>,
                            <Button 
                                key="submit" 
                                type="primary" 
                                loading={confirmLoading} 
                                onClick={handleReupload}
                                className="bg-coral border-none rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-8"
                            >
                                Submit New Proof
                            </Button>
                        ]}
                        centered
                        className="premium-modal"
                        closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
                    >
                        <div className="py-4 space-y-6">
                            <Text className="text-gray-500 font-medium block">
                                Please select a new screenshot of your payment transfer. Ensure the Transaction ID is clearly visible.
                            </Text>
                            
                            <div 
                                className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-coral transition-all cursor-pointer bg-gray-50/50"
                                onClick={() => document.getElementById('new-screenshot-input').click()}
                            >
                                <input 
                                    id="new-screenshot-input"
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => setNewScreenshot(e.target.files[0])}
                                />
                                {newScreenshot ? (
                                    <div className="text-center">
                                        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                                        <Text className="text-sm font-bold text-gray-800 block">{newScreenshot.name}</Text>
                                        <Text className="text-[10px] text-gray-400 uppercase font-black">Click to change</Text>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Package size={32} className="text-gray-300 mx-auto mb-2" />
                                        <Text className="text-sm font-bold text-gray-400 block tracking-tight">Select Screenshot</Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>

                </div>
            </div>
        </UserLayout>
    )
}

export default UserOrderDetails
