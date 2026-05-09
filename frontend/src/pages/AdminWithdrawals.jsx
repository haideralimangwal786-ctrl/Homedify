import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import axios from 'axios';
import {
    DollarSign, Clock, CheckCircle, XCircle, Eye,
    Building, User, AlertCircle, Download
} from 'lucide-react';
import { Table, Card } from 'antd';
import toast from 'react-hot-toast';

const AdminWithdrawals = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [withdrawals, setWithdrawals] = useState([]);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchWithdrawals();
        // Periodic refresh every 30 seconds
        const interval = setInterval(fetchWithdrawals, 30000);
        return () => clearInterval(interval);
    }, [filter]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/v1/payments/withdrawals/all?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWithdrawals(res.data.data || []);
        } catch (err) {
            console.error('Error fetching withdrawals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedWithdrawal || !actionType) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = `/api/v1/payments/withdrawals/${selectedWithdrawal._id}/${actionType}`;

            await axios.put(endpoint, {
                [actionType === 'approve' ? 'adminNotes' : 'rejectionReason']: notes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Withdrawal ${actionType}d successfully!`);
            setShowModal(false);
            setSelectedWithdrawal(null);
            setNotes('');
            setActionType(null);
            fetchWithdrawals();
        } catch (err) {
            console.error(`Error ${actionType}ing withdrawal:`, err);
            toast.error(err.response?.data?.message || `Failed to ${actionType} withdrawal`);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
            approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
            completed: { bg: 'bg-[#FC6A6B]/20', text: 'text-[#FC6A6B]', icon: CheckCircle }
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <Icon size={12} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                        <DollarSign className="text-coral" size={32} />
                        Withdrawal Requests
                    </h1>
                    <p className="text-gray-500">Review and approve seller withdrawal requests</p>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex gap-2 bg-white p-2 rounded-xl border border-gray-100 inline-flex">
                    {['pending', 'approved', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition ${filter === status
                                ? 'bg-coral text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Pending</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {withdrawals.filter(w => w.status === 'pending').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Approved</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {withdrawals.filter(w => w.status === 'approved').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Rejected</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {withdrawals.filter(w => w.status === 'rejected').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-coral/10 text-coral rounded-xl">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                                <p className="text-xl font-black text-gray-900">
                                    PKR {withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Withdrawals Table */}
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                    <Table
                        columns={[
                            {
                                title: 'Seller',
                                key: 'seller',
                                render: (_, record) => (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold">
                                            {record.sellerId?.userId?.name?.[0] || 'S'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 m-0">{record.sellerId?.storeName}</p>
                                            <p className="text-xs text-gray-500 m-0">{record.sellerId?.userId?.name}</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: 'Amount',
                                dataIndex: 'amount',
                                key: 'amount',
                                render: (amount) => <span className="font-black text-lg text-gray-900">PKR {amount.toLocaleString()}</span>
                            },
                            {
                                title: 'Bank',
                                dataIndex: ['bankDetails', 'bankName'],
                                key: 'bank',
                                render: (bank) => <span className="text-sm text-gray-600">{bank}</span>
                            },
                            {
                                title: 'Account',
                                key: 'account',
                                render: (_, record) => (
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900 m-0">{record.bankDetails.accountTitle}</p>
                                        <p className="text-xs text-gray-500 font-mono m-0">{record.bankDetails.accountNumber}</p>
                                    </div>
                                )
                            },
                            {
                                title: 'Requested',
                                dataIndex: 'requestedAt',
                                key: 'requestedAt',
                                render: (date) => <span className="text-sm text-gray-600">{new Date(date).toLocaleDateString()}</span>
                            },
                            {
                                title: 'Status',
                                dataIndex: 'status',
                                key: 'status',
                                render: (status) => getStatusBadge(status)
                            },
                            {
                                title: 'Actions',
                                key: 'actions',
                                align: 'right',
                                render: (_, record) => (
                                    <button
                                        onClick={() => {
                                            setSelectedWithdrawal(record);
                                            setShowModal(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white rounded-lg font-bold text-sm hover:bg-coral-dark transition"
                                    >
                                        <Eye size={16} />
                                        Review
                                    </button>
                                )
                            }
                        ]}
                        dataSource={withdrawals}
                        loading={loading}
                        rowKey="_id"
                        className="premium-table"
                        pagination={false}
                        scroll={windowWidth < 1200 ? { x: 'max-content' } : undefined}
                        locale={{
                            emptyText: (
                                <div className="p-12 text-center">
                                    <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium">No {filter} withdrawals</p>
                                </div>
                            )
                        }}
                    />
                </Card>
            </main>

            {/* Withdrawal Details Modal */}
            {showModal && selectedWithdrawal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">Withdrawal Request Details</h3>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Seller</label>
                                <p className="text-lg font-bold text-gray-900">{selectedWithdrawal.sellerId?.storeName}</p>
                                <p className="text-sm text-gray-600">{selectedWithdrawal.sellerId?.userId?.name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Amount</label>
                                <p className="text-2xl font-black text-coral">PKR {selectedWithdrawal.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Bank Name</label>
                                <p className="text-sm font-medium text-gray-900">{selectedWithdrawal.bankDetails.bankName}</p>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Account Title</label>
                                <p className="text-sm font-medium text-gray-900">{selectedWithdrawal.bankDetails.accountTitle}</p>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Account Number</label>
                                <p className="text-sm font-mono text-gray-900">{selectedWithdrawal.bankDetails.accountNumber}</p>
                            </div>
                            {selectedWithdrawal.bankDetails.iban && (
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase block mb-1">IBAN</label>
                                    <p className="text-sm font-mono text-gray-900">{selectedWithdrawal.bankDetails.iban}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Requested Date</label>
                                <p className="text-sm text-gray-600">{new Date(selectedWithdrawal.requestedAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Status</label>
                                {getStatusBadge(selectedWithdrawal.status)}
                            </div>
                        </div>

                        {selectedWithdrawal.status === 'pending' && !actionType && (
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Admin Notes (Optional)</label>
                                <textarea
                                    rows="3"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none"
                                    placeholder="Add any notes..."
                                />
                            </div>
                        )}

                        {selectedWithdrawal.rejectionReason && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-xs font-black text-red-900 uppercase mb-1">Rejection Reason</p>
                                <p className="text-sm text-red-700">{selectedWithdrawal.rejectionReason}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {selectedWithdrawal.status === 'pending' ? (
                                !actionType ? (
                                    <>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={() => setActionType('reject')}
                                            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={20} />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => setActionType('approve')}
                                            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            Approve
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setActionType(null)}
                                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAction}
                                            disabled={submitting}
                                            className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition disabled:opacity-50 ${actionType === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                                }`}
                                        >
                                            {submitting ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
                                        </button>
                                    </>
                                )
                            ) : (
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full px-6 py-3 bg-coral text-white rounded-xl font-bold hover:bg-coral-dark transition"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AdminWithdrawals;
