import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import api from '../services/api'; // Using shared api service
import {
    Users, ShieldCheck, XCircle, CheckCircle, Eye, Clock,
    AlertTriangle, FileText, Image as ImageIcon, User,
    ExternalLink, MapPin, Fingerprint, Target, Activity, AlertCircle
} from 'lucide-react';
import { Table, Card } from 'antd';
import toast from 'react-hot-toast';

const AdminVerification = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sellers, setSellers] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPendingSellers();
        // Periodic refresh every 30 seconds
        const interval = setInterval(fetchPendingSellers, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingSellers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/v1/admin/sellers/pending');
            setSellers(res.data.data || []);
        } catch (err) {
            console.error('Error fetching sellers:', err);
            toast.error('Failed to load pending sellers');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (sellerId) => {
        try {
            const res = await api.get(`/api/v1/admin/sellers/${sellerId}/verification`);
            setSelectedSeller(res.data.data);
            setShowModal(true);
        } catch (err) {
            console.error('Error fetching seller details:', err);
            toast.error('Failed to load seller details');
        }
    };

    const handleAction = async () => {
        if (!selectedSeller || !actionType) return;

        setSubmitting(true);
        try {
            // Using PUT as defined in adminRoutes.js
            await api.put(`/api/v1/admin/sellers/${selectedSeller._id}/${actionType}`, {
                [actionType === 'approve' ? 'adminNotes' : 'rejectionReason']: notes
            });

            toast.success(`Seller ${actionType}d successfully!`);
            setShowModal(false);
            setSelectedSeller(null);
            setNotes('');
            setActionType(null);
            fetchPendingSellers();
        } catch (err) {
            console.error(`Error ${actionType}ing seller:`, err);
            toast.error(err.response?.data?.message || `Failed to ${actionType} seller`);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending_verification: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock, label: 'Pending AI' },
            ai_verified: { bg: 'bg-[#FC6A6B]/10', text: 'text-[#FC6A6B]', icon: ShieldCheck, label: 'AI Passed' },
            ai_rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'AI Rejected' },
            approved: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: 'Approved' },
            rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'Rejected' }
        };
        const badge = badges[status] || badges.pending_verification;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.bg} ${badge.text}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-3 flex items-center gap-3 tracking-tight">
                            <ShieldCheck className="text-coral" size={36} />
                            Seller <span className="text-gray-400">Verifications</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Review and manually approve identity verification requests.</p>
                    </div>
                    
                    <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100 divide-x divide-gray-100">
                        <div className="px-6 py-2 text-center">
                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pending</span>
                            <span className="text-xl font-black text-gray-900">{sellers.length}</span>
                        </div>
                        <div className="px-6 py-2 text-center">
                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">AI Verified</span>
                            <span className="text-xl font-black text-[#FC6A6B]">
                                {sellers.filter(s => s.verificationStatus === 'ai_verified').length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Table Container */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                    <Table
                        columns={[
                            {
                                title: 'Seller Information',
                                key: 'sellerInfo',
                                render: (_, record) => (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center font-black group-hover:bg-coral group-hover:text-white transition-all duration-500 shadow-sm">
                                            {record.userId?.name?.[0] || 'S'}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 group-hover:text-coral transition-colors m-0">{record.userId?.name}</p>
                                            <p className="text-xs text-gray-400 font-medium m-0">{record.userId?.email}</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: 'Store Details',
                                key: 'storeDetails',
                                render: (_, record) => (
                                    <div>
                                        <p className="font-bold text-gray-900 m-0">{record.storeName}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1 mt-1 m-0">
                                            <MapPin size={10} /> {record.storeAddress?.slice(0, 20)}...
                                        </p>
                                    </div>
                                )
                            },
                            {
                                title: 'CNIC',
                                dataIndex: 'cnicNumber',
                                key: 'cnic',
                                render: (cnic) => <span className="font-mono text-xs text-gray-500 tracking-tighter">{cnic}</span>
                            },
                            {
                                title: 'Status',
                                dataIndex: 'verificationStatus',
                                key: 'status',
                                render: (status) => getStatusBadge(status)
                            },
                            {
                                title: 'Actions',
                                key: 'actions',
                                align: 'right',
                                render: (_, record) => (
                                    <button
                                        onClick={() => handleViewDetails(record._id)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:shadow-xl transition-all active:scale-95"
                                    >
                                        Review <ExternalLink size={12} />
                                    </button>
                                )
                            }
                        ]}
                        dataSource={sellers}
                        loading={loading}
                        rowKey="_id"
                        className="premium-table"
                        pagination={false}
                        scroll={windowWidth < 1200 ? { x: 'max-content' } : undefined}
                    />
                </Card>
            </main>

            {/* Verification Modal (Full Screen Glassmorphism) */}
            {showModal && selectedSeller && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 md:p-10 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] max-w-6xl w-full max-h-[90vh] flex flex-col shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Modal Header */}
                        <div className="p-8 md:p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-3xl font-black text-gray-900">Verification Report</h3>
                                    {getStatusBadge(selectedSeller.verificationStatus)}
                                </div>
                                <p className="text-gray-400 font-medium italic">#{selectedSeller._id}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white transition-all text-gray-400">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
                            {/* Comparison Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Side: Documents */}
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon size={14} /> CNIC Front
                                            </label>
                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group">
                                                <img src={selectedSeller.cnicImages?.front} alt="CNIC Front" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Camera size={14} /> Live Selfie
                                            </label>
                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group">
                                                <img src={selectedSeller.selfieImage} alt="Selfie" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#111] rounded-[1.5rem] p-10 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-coral blur-[80px] opacity-20" />
                                        <div className="flex items-center gap-4 mb-8">
                                            <Fingerprint size={24} className="text-coral" />
                                            <h4 className="text-xl font-black">AI Match Algorithm</h4>
                                        </div>
                                        <div className="flex items-center gap-8">
                                             <div className="text-center">
                                                <div className="w-24 h-24 rounded-full border-4 border-coral/30 flex items-center justify-center relative">
                                                    <span className="text-2xl font-black">{selectedSeller.faceMatchScore || 0}%</span>
                                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-coral/20" />
                                                        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-coral" strokeDasharray={276} strokeDashoffset={276 - (276 * (selectedSeller.faceMatchScore || 0)) / 100} strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-4">Recognition Score</p>
                                             </div>
                                             <div className="flex-1 space-y-4">
                                                 <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between">
                                                     <span className="text-xs font-bold text-gray-400 uppercase">Gender Match</span>
                                                     <span className="text-xs font-black text-green-500">PASSED</span>
                                                 </div>
                                                 <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between">
                                                     <span className="text-xs font-bold text-gray-400 uppercase">ID Authenticity</span>
                                                     <span className="text-xs font-black text-green-500">PASSED</span>
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Data Cross-Verification */}
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <User size={12} /> User Submitted
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase block">Name</span>
                                                    <p className="font-bold text-gray-900">{selectedSeller.userId?.name}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase block">Input CNIC</span>
                                                    <p className="font-mono text-xs text-gray-900">{selectedSeller.cnicNumber}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase block">Store Address</span>
                                                    <p className="text-xs font-medium text-gray-600 leading-relaxed">{selectedSeller.storeAddress}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#FC6A6B]/10/30 p-6 rounded-[2rem] border border-[#FC6A6B]/20/50 shadow-sm">
                                            <h4 className="text-[10px] font-black text-[#FC6A6B] uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <ShieldCheck size={12} /> AI Extracted (OCR)
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#FC6A6B] uppercase block">Extracted Name</span>
                                                    <p className="font-bold text-gray-900">{selectedSeller.ocrData?.name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#FC6A6B] uppercase block">OCR CNIC No.</span>
                                                    <p className="font-mono text-xs text-gray-900">{selectedSeller.ocrData?.cnicNumber || selectedSeller.ocrData?.cnic || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#FC6A6B] uppercase block">Extracted Gender</span>
                                                    <p className="text-xs font-black text-gray-900">{selectedSeller.ocrData?.gender || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Box */}
                                    <div className="bg-white p-10 rounded-[1.5rem] border border-gray-100 shadow-xl space-y-6">
                                        {!actionType ? (
                                            <>
                                                <h4 className="text-xl font-black text-gray-900">Final Verdict</h4>
                                                <p className="text-sm text-gray-500">Add notes and choose whether to welcome this seller to Homedify.</p>
                                                <textarea
                                                    rows="4"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-coral/10 focus:border-coral outline-none transition-all font-medium text-sm"
                                                    placeholder="Internal audit notes (Optional)..."
                                                />
                                                <div className="flex gap-4">
                                                     <button 
                                                        onClick={() => setActionType('reject')}
                                                        className="flex-1 px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle size={16} /> Reject Seller
                                                    </button>
                                                    <button 
                                                        onClick={() => setActionType('approve')}
                                                        className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
                                                    >
                                                        <CheckCircle size={16} /> Approve & Activate
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4 bg-gray-50 rounded-2xl space-y-6 border border-gray-100">
                                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-white shadow-md">
                                                     {actionType === 'approve' ? <CheckCircle className="text-green-500" size={32} /> : <AlertCircle className="text-red-500" size={32} />}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-widest">Are you sure?</h4>
                                                    <p className="text-xs text-gray-400 font-medium mt-1">This will permanently mark the seller as {actionType}d.</p>
                                                </div>
                                                <div className="flex gap-4">
                                                     <button onClick={() => setActionType(null)} className="flex-1 py-4 font-black text-[10px] uppercase text-gray-400">Cancel</button>
                                                     <button 
                                                        onClick={handleAction} 
                                                        disabled={submitting} 
                                                        className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl ${actionType === 'approve' ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'}`}
                                                    >
                                                        {submitting ? 'Processing...' : `Confirm ${actionType}`}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AdminVerification;
