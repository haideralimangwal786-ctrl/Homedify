import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Tag, 
    Space, 
    Button, 
    Typography, 
    Card, 
    Modal, 
    Empty,
    Tooltip,
    Input,
    Select
} from 'antd';
import { 
    Mail, 
    User, 
    MessageSquare, 
    Clock, 
    Eye, 
    CheckCircle, 
    AlertCircle,
    Calendar,
    Search,
    Send,
    X
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const AdminInquiries = ({ windowWidth: propWindowWidth }) => {
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
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [replyModalVisible, setReplyModalVisible] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchInquiries();
        // Periodic refresh every 30 seconds for dynamic updates
        const interval = setInterval(fetchInquiries, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/v1/admin/inquiries');
            if (res.data.success) {
                setInquiries(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            toast.error('Failed to fetch inquiries');
            setInquiries([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await api.put(`/api/v1/admin/inquiries/${id}`, { status });
            if (res.data.success) {
                toast.success('Status updated');
                fetchInquiries();
                if (selectedInquiry && selectedInquiry._id === id) {
                    setSelectedInquiry({ ...selectedInquiry, status });
                }
            }
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim()) {
            return toast.error('Please enter a message');
        }

        try {
            setSendingReply(true);
            const res = await api.post(`/api/v1/admin/inquiries/${selectedInquiry._id}/reply`, {
                message: replyMessage
            });

            if (res.data.success) {
                toast.success('Reply sent successfully via Email and System Notification');
                setReplyModalVisible(false);
                setReplyMessage('');
                fetchInquiries();
                setIsModalVisible(false);
            }
        } catch (err) {
            toast.error('Failed to send reply');
        } finally {
            setSendingReply(false);
        }
    };

    const filteredInquiries = inquiries.filter(i => {
        const matchesSearch = 
            i.name.toLowerCase().includes(searchText.toLowerCase()) ||
            i.email.toLowerCase().includes(searchText.toLowerCase()) ||
            i.subject.toLowerCase().includes(searchText.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            title: 'DATE',
            key: 'date',
            width: 140,
            render: (_, record) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                        {new Date(record.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                        {new Date(record.createdAt).getFullYear()} • {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            title: 'CUSTOMER DETAILS',
            key: 'customer',
            width: 250,
            render: (_, record) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center font-black text-sm shrink-0">
                        {record.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-800 text-xs truncate max-w-[160px]">
                            {record.name}
                        </span>
                        <span className="text-[9px] font-medium text-gray-400 lowercase tracking-tight flex items-center gap-1 mt-0.5">
                            <Mail size={8} className="text-coral" /> {record.email}
                        </span>
                    </div>
                </div>
            )
        },
        {
            title: 'SUBJECT & MESSAGE',
            key: 'subject',
            width: 300,
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-[11px] leading-tight truncate max-w-[250px]">
                        {record.subject}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium truncate max-w-[280px] mt-0.5 italic">
                        "{record.message}"
                    </span>
                </div>
            )
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: 120,
            render: (status) => {
                const colors = {
                    pending: '#F97316', // Orange
                    replied: '#3B82F6', // Blue
                    resolved: '#22C55E' // Green
                };
                return (
                    <div className="flex justify-center">
                        <span 
                            style={{ 
                                backgroundColor: `${colors[status]}15`, 
                                color: colors[status],
                                border: `1px solid ${colors[status]}30`
                            }}
                            className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                        >
                            {status}
                        </span>
                    </div>
                );
            }
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            align: 'right',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="View Details">
                        <Button 
                            type="text" 
                            icon={<Eye size={20} />} 
                            onClick={() => {
                                setSelectedInquiry(record);
                                setIsModalVisible(true);
                            }}
                            className="text-gray-400 hover:text-coral hover:bg-coral/5 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
                        />
                    </Tooltip>
                    {record.status !== 'resolved' && (
                        <Tooltip title="Mark as Resolved">
                            <Button 
                                type="text" 
                                icon={<CheckCircle size={20} />} 
                                onClick={() => updateStatus(record._id, 'resolved')}
                                className="text-green-500 hover:bg-green-50 transition-all h-10 w-10 flex items-center justify-center rounded-xl hover:scale-110"
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Box 1: Search & Filter Header */}
            <div className="bg-white p-6 rounded-[1.25rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 w-full max-w-md">
                    <Input 
                        placeholder="Search by Name, Email or Subject..." 
                        prefix={<Search size={18} className="text-gray-400 mr-2" />}
                        size="large"
                        className="h-12 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 transition-all text-sm"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Text className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">Filter Status:</Text>
                    <Select
                        defaultValue="all"
                        onChange={(value) => setStatusFilter(value)}
                        className="w-full md:w-[150px]"
                    >
                        <Select.Option value="all">All Messages</Select.Option>
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="replied">Replied</Select.Option>
                        <Select.Option value="resolved">Resolved</Select.Option>
                    </Select>
                </div>
            </div>

            {/* Box 2: Table Section */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                <Table 
                    columns={columns} 
                    dataSource={filteredInquiries} 
                    loading={loading}
                    rowKey="_id"
                    pagination={false}
                    className="premium-table"
                    scroll={windowWidth < 1200 ? { x: 'max-content' } : undefined}
                    locale={{ emptyText: <Empty description="No messages yet" /> }}
                />
            </Card>

            <Modal
                title={null}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={500}
                centered
                styles={{ content: { borderRadius: 24, padding: 0, overflow: 'hidden' } }}
                closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
            >
                {selectedInquiry && (
                    <div className="p-8 bg-white">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                            <span className="font-black uppercase tracking-widest text-[11px] text-gray-400">Message Details</span>
                            <span className="font-bold text-coral text-[11px] uppercase tracking-tighter">ID: {selectedInquiry._id.slice(-6)}</span>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1">
                                    <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Name</Text>
                                    <Text className="text-sm font-bold text-gray-900">{selectedInquiry.name}</Text>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</Text>
                                    <Text className="text-sm font-bold text-gray-900">{selectedInquiry.email}</Text>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject Line</Text>
                                <Text className="text-base font-black text-gray-900 italic leading-tight">"{selectedInquiry.subject}"</Text>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative">
                                <div className="absolute -top-3 left-6 bg-white px-2 py-1 rounded-md border border-gray-100">
                                    <Text className="text-[9px] font-black uppercase tracking-widest text-coral">User Message</Text>
                                </div>
                                <Text className="text-[13px] font-medium text-gray-600 leading-relaxed block mt-1">
                                    {selectedInquiry.message}
                                </Text>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-300" />
                                    <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                                        Received {new Date(selectedInquiry.createdAt).toLocaleDateString()} at {new Date(selectedInquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </div>
                                <div 
                                    style={{ 
                                        backgroundColor: selectedInquiry.status === 'resolved' ? '#22C55E15' : selectedInquiry.status === 'replied' ? '#3B82F615' : '#F9731615',
                                        color: selectedInquiry.status === 'resolved' ? '#22C55E' : selectedInquiry.status === 'replied' ? '#3B82F6' : '#F97316'
                                    }}
                                    className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                                >
                                    {selectedInquiry.status}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end gap-3">
                            <Button 
                                onClick={() => setIsModalVisible(false)}
                                className="rounded-xl font-bold text-[11px] h-10 px-6 border-gray-100 text-gray-400 hover:text-gray-600"
                            >
                                Close
                            </Button>
                            {selectedInquiry.status !== 'resolved' && (
                                <Button 
                                    type="primary"
                                    className="bg-green-500 border-none rounded-xl px-6 font-black uppercase text-[10px] h-10 shadow-md shadow-green-100"
                                    onClick={() => {
                                        updateStatus(selectedInquiry._id, 'resolved');
                                        setIsModalVisible(false);
                                    }}
                                >
                                    Mark Resolved
                                </Button>
                            )}
                            <Button 
                                type="primary"
                                style={{ backgroundColor: '#FF6B6B' }}
                                className="border-none rounded-xl px-8 font-black uppercase text-[10px] h-10 shadow-md shadow-coral/20"
                                onClick={() => setReplyModalVisible(true)}
                            >
                                Compose Reply
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reply Modal */}
            <Modal
                title={null}
                open={replyModalVisible}
                onCancel={() => setReplyModalVisible(false)}
                footer={null}
                width={500}
                centered
                styles={{ content: { borderRadius: 28, padding: 32 } }}
                closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-coral/5 rounded-full flex items-center justify-center mb-4">
                        <Send size={32} className="text-coral" />
                    </div>
                    <Title level={3} className="m-0 font-black tracking-tight mb-2">Compose Response</Title>
                    <Text className="text-gray-400 text-xs mb-8 max-w-xs">
                        This message will be sent via email and system notification to <span className="font-bold text-gray-900">{selectedInquiry?.email}</span>
                    </Text>

                    <div className="w-full text-left space-y-4 mb-8">
                        <div className="flex flex-col gap-1.5">
                            <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Reply Message</Text>
                            <textarea 
                                className="w-full p-5 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:border-coral/30 transition-all outline-none text-sm font-medium resize-none min-h-[180px] border"
                                placeholder="Type your professional response here..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                            />
                        </div>
                        
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
                            <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                            <Text className="text-[10px] text-blue-600/80 font-bold leading-relaxed uppercase tracking-tight">
                                Notification will be sent to the user's dashboard automatically.
                            </Text>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <Button 
                            type="text" 
                            className="h-14 font-black uppercase tracking-widest text-gray-400"
                            onClick={() => setReplyModalVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="primary"
                            style={{ backgroundColor: '#FF6B6B' }}
                            className="h-14 border-none rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-coral/20 hover:scale-[1.02] transition-transform"
                            loading={sendingReply}
                            onClick={handleSendReply}
                        >
                            Send Reply
                        </Button>
                    </div>
                </div>
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

export default AdminInquiries;
