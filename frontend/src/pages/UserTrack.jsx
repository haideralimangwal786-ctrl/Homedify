import React from 'react'
import UserLayout from '../shared/UserLayout'
import { useParams, Link } from 'react-router-dom'
import { Truck, CheckCircle, Package, MapPin, Search, ArrowLeft, Clock, ShieldCheck } from 'lucide-react'

const TrackingStep = ({ status, time, location, active, done }) => (
    <div className="flex gap-8 relative pb-12 last:pb-0">
        {!done && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-100" />}
        {done && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-emerald-500" />}

        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-500 ${active ? 'bg-coral border-coral text-white scale-110 shadow-lg shadow-coral/30' :
                done ? 'bg-emerald-500 border-emerald-500 text-white' :
                    'bg-white border-slate-100 text-slate-200'
            }`}>
            {done ? <CheckCircle size={16} /> : active ? <Package size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
        </div>

        <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
                <h4 className={`text-sm font-black tracking-tight ${active ? 'text-slate-900 scale-105 origin-left transition-all' : done ? 'text-slate-900' : 'text-slate-300'}`}>{status}</h4>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{time}</p>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-1">{location}</p>
            {active && (
                <div className="mt-3 p-3 bg-coral/5 rounded-xl border border-coral/10 inline-flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                    <span className="text-[10px] font-black text-coral uppercase tracking-widest">Live Updates Available</span>
                </div>
            )}
        </div>
    </div>
)

const UserTrack = () => {
    const { id } = useParams()
    const orderId = id || '81726-PK'

    return (
        <UserLayout>
            <div className="max-w-6xl mx-auto py-12 px-6 lg:px-12 space-y-12">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <Link to="/customer/orders" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-coral transition-colors mb-4">
                            <ArrowLeft size={14} /> Back to Orders
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Track Shipment</h1>
                        <p className="text-slate-400 text-sm font-medium mt-1">Shipping Details • Homedify Express</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                id="track-order-id"
                                name="track-order-id"
                                aria-label="Track another ID"
                                type="text"
                                placeholder="Track another ID..."
                                className="w-full pl-11 pr-4 py-4 bg-white border border-[#EEEEEE] rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-coral/30"
                            />
                        </div>
                        <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Track</button>
                    </div>
                </div>

                {/* TRACKING CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">

                    {/* TIMELINE */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white border border-[#EEEEEE] rounded-[2rem] p-10 lg:p-16 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-12 flex items-center gap-3 italic">
                                <Truck size={24} className="text-coral" />
                                Journey Progress
                            </h3>

                            <div className="space-y-0">
                                <TrackingStep
                                    status="Delivered to Buyer"
                                    time="EXPECTED FEB 20"
                                    location="Registered Address, Lahore"
                                    active={false}
                                    done={false}
                                />
                                <TrackingStep
                                    status="Arrived at Sorting Hub"
                                    time="TODAY, 10:24 AM"
                                    location="Logistics Hub, Lahore Central"
                                    active={true}
                                    done={false}
                                />
                                <TrackingStep
                                    status="In Transit"
                                    time="YESTERDAY, 04:15 PM"
                                    location="Ferozepur Road Terminal"
                                    active={false}
                                    done={true}
                                />
                                <TrackingStep
                                    status="Picked up from Artisan"
                                    time="FEB 15, 11:30 AM"
                                    location="Artisan Workshop, Studio B"
                                    active={false}
                                    done={true}
                                />
                                <TrackingStep
                                    status="Order Confirmed"
                                    time="FEB 14, 08:45 PM"
                                    location="Homedify Platform"
                                    active={false}
                                    done={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* DETAILS SIDEBAR */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* CURRENT STATUS CARD */}
                        <div className="bg-coral/5 border border-coral/10 rounded-[1.5rem] p-8">
                            <h4 className="text-[10px] font-black text-coral uppercase tracking-widest mb-4">Estimated Delivery</h4>
                            <div className="flex items-center gap-4 mb-2">
                                <Clock size={20} className="text-slate-900" />
                                <span className="text-2xl font-black text-slate-900 tracking-tighter">Feb 20, 2026</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">By 06:00 PM Local Time</p>
                        </div>

                        {/* DELIVERY DETAILS */}
                        <div className="bg-white border border-[#EEEEEE] rounded-[1.5rem] p-8 space-y-8 shadow-sm">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Shipping Destination</h4>
                                <div className="flex gap-4">
                                    <MapPin size={18} className="text-slate-300 mt-1" />
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Registered Address</p>
                                        <p className="text-[10px] text-slate-400 font-medium leading-loose mt-1">12-A Block, Gulberg III, Lahore, Punjab, 54000</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Package Security</h4>
                                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3">
                                    <ShieldCheck size={20} className="text-emerald-500" />
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Insured Shipment</p>
                                </div>
                            </div>
                        </div>

                        {/* SUPPORT CTA */}
                        <div className="p-8 bg-slate-900 rounded-[1.5rem] text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-all duration-700">
                                <Truck size={100} />
                            </div>
                            <h4 className="text-lg font-black italic tracking-tight mb-2 z-10 relative">Need Help?</h4>
                            <p className="text-[11px] text-slate-400 font-medium mb-6 z-10 relative">Contact our concierge for delivery issues.</p>
                            <Link to="/customer/support" className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-coral hover:text-white transition-all z-10 relative inline-block">
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    )
}

export default UserTrack
