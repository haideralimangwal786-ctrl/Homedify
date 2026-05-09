import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import { CheckCircle, Package, ArrowRight, ShieldCheck } from 'lucide-react'

const OrderSuccess = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { orders = [], paymentMethod = 'cod' } = location.state || {}
    const isCOD = paymentMethod === 'cod'
    const mainOrderId = orders.length > 0 ? orders[0].orderId : 'HMD-XXXX'

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />

            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 text-center animate-in fade-in zoom-in duration-700">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg ${isCOD ? 'bg-green-100 shadow-green-100/50' : 'bg-yellow-100 shadow-yellow-100/50'}`}>
                        {isCOD ? (
                            <CheckCircle size={48} className="text-green-600 animate-bounce" />
                        ) : (
                            <ShieldCheck size={48} className="text-yellow-600 animate-pulse" />
                        )}
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        {isCOD ? 'Order Confirmed!' : 'Order Placed!'}
                    </h1>
                    <p className="text-gray-500 font-medium mb-8 text-lg">
                        {isCOD
                            ? 'Your order has been placed successfully. You will pay upon delivery.'
                            : 'Your order is pending payment. Please complete the transfer to your selected method.'}
                    </p>

                    <div className="bg-gray-50 rounded-[2rem] p-6 mb-10 border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Order Transaction ID(s)</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <span key={order._id} className="bg-white px-4 py-2 rounded-xl font-mono font-bold text-gray-900 border border-gray-200 shadow-sm">
                                        {order.orderId}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xl font-bold text-gray-900 font-mono tracking-tighter">{mainOrderId}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-coral text-white h-16 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#ff5252] transition shadow-xl shadow-coral/20 hover:-translate-y-1 active:translate-y-0"
                        >
                            OK
                        </button>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 border-t pt-8 border-gray-50">
                        <div className="flex flex-col items-center gap-1">
                            <Package size={20} className="text-gray-300" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quality Checked</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <ShieldCheck size={20} className="text-gray-300" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Homedify Verified</span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default OrderSuccess
