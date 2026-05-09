import React, { useState, useEffect, useContext } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  Layout, Menu, Card, Table, Tag, Badge, Button, Row, Col, Space,
  Typography, ConfigProvider, theme, Avatar, Tooltip, Modal, Empty,
  Image as AntImage, Divider
} from 'antd'
import {
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Wallet, Store,
  Clock, LogOut, Menu as MenuIcon, Eye, CheckCircle, History, Bell, ArrowUpRight,
  Image as ImageIcon, FileText, Search, User, X
} from 'lucide-react'
import { toast } from 'react-hot-toast';
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'
import SellerSidebarProfile from '../components/SellerSidebarProfile'

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const SellerEarnings = () => {
    const { token, user, logout } = useContext(AuthContext);
    const { unreadCount: globalUnread } = useContext(NotificationContext);
    const { commissionRate } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [seller, setSeller] = useState(null);
    const [collapsed, setCollapsed] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [orderRes, sellerRes, prodRes] = await Promise.all([
                axios.get('/api/v1/orders/seller', { headers }),
                axios.get('/api/v1/sellers/me', { headers }),
                axios.get('/api/v1/products/seller', { headers })
            ]);

            setOrders(orderRes.data.data || []);
            setSeller(sellerRes.data.data);
            setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || []));
        } catch (err) {
            console.error("Wallet data fetch error:", err);
            toast.error("Failed to sync wallet data");
        } finally {
            setLoading(false);
        }
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

    useEffect(() => {
        // Auto collapse sidebar on mobile
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            if (window.innerWidth < 1024) {
                setCollapsed(true);
            } else {
                setCollapsed(false);
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);

        if (token) {
            loadData();
            // Periodic refresh every 30 seconds
            const interval = setInterval(loadData, 30000);
            return () => {
                window.removeEventListener('resize', handleResize);
                clearInterval(interval);
            };
        }

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [token]);

    const heldAmount = orders
        .filter(o => o.paymentStatus === 'held_in_escrow')
        .reduce((sum, o) => sum + (o.total * ((100 - (commissionRate || 10)) / 100)), 0);

    const totalPayout = orders
        .filter(o => o.paymentStatus === 'paid_to_seller' || o.paymentStatus === 'released')
        .reduce((sum, o) => sum + (o.sellerPayable || (o.total * ((100 - (commissionRate || 10)) / 100))), 0);

    const payoutHistory = orders.filter(o => o.paymentStatus === 'paid_to_seller' || o.paymentStatus === 'released');

    const columns = [
        {
            title: 'Order Date',
            key: 'orderDate',
            width: 140,
            render: (_, record) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">
                        #{record.orderId?.split('-').pop() || record._id.substring(18)}
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
            title: 'Platform Fee',
            key: 'fee',
            align: 'center',
            width: 120,
            render: (_, record) => (
                <div className="flex flex-col items-center">
                    <Tag color="default" className="m-0 rounded-full px-2 py-0.5 border-none font-bold text-[9px] bg-gray-50 text-gray-400">
                        -{commissionRate || 10}% FEE
                    </Tag>
                    <span className="text-[10px] font-bold text-gray-300 mt-1">Rs. {(record.total * ((commissionRate || 10) / 100)).toLocaleString()}</span>
                </div>
            )
        },
        {
            title: 'Net Amount',
            key: 'net',
            align: 'right',
            width: 120,
            render: (_, record) => (
                <div className="flex flex-col items-end">
                    <span className="font-black text-emerald-500 text-sm">Rs. {(record.sellerPayable || (record.total * ((100 - (commissionRate || 10)) / 100))).toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Payout</span>
                </div>
            )
        },
        {
            title: 'Payment Proof',
            dataIndex: 'payoutProof',
            key: 'proof',
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
        }
    ];

    const menuItems = [
      { key: '/seller/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard Overview' },
      { 
        key: '/seller/products', 
        icon: <Package size={20} />, 
        label: (
          <div className="flex justify-between items-center w-full">
            <span>Product Management</span>
            {!collapsed && products.length > 0 && (
              <Badge count={products.length} size="small" style={{ backgroundColor: '#94A3B8' }} />
            )}
          </div>
        )
      },
      { key: '/seller/add-product', icon: <PlusCircle size={20} />, label: 'Add New Product' },
      { 
        key: '/seller/orders', 
        icon: <ShoppingCart size={20} />, 
        label: (
          <div className="flex justify-between items-center w-full">
            <span>Orders & Tracking</span>
            {!collapsed && orders.filter(o => ['confirmed', 'seller_accepted', 'preparing'].includes(o.status)).length > 0 && (
              <Badge count={orders.filter(o => ['confirmed', 'seller_accepted', 'preparing'].includes(o.status)).length} size="small" />
            )}
          </div>
        )
      },
      { 
        key: '/seller/notifications', 
        icon: <Bell size={20} />, 
        label: (
          <div className="flex justify-between items-center w-full">
            <span>Notifications</span>
            {!collapsed && globalUnread > 0 && (
              <Badge count={globalUnread} size="small" />
            )}
          </div>
        )
      },
      { key: '/seller/earnings', icon: <Wallet size={20} />, label: 'Wallet & Earnings' },
      { key: '/seller/profile', icon: <Store size={20} />, label: 'Shop Profile' },
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#FF6B6B',
                    borderRadius: 12,
                    fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                },
                components: {
                    Menu: {
                        itemSelectedBg: '#FFEBEE',
                        itemSelectedColor: '#FF6B6B',
                        itemHoverBg: '#FAFAFA',
                        itemBorderRadius: 8,
                    },
                    Card: {
                        borderRadiusLG: 16,
                        boxShadowTertiary: '0 10px 40px rgba(0,0,0,0.03)',
                    },
                    Table: {
                        headerBg: '#FAFAFA',
                        headerColor: '#8C8C8C',
                        headerBorderRadius: 10,
                    }
                },
            }}
        >
            <Layout className="min-h-screen bg-[#FAFAFA]">
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    width={280}
                    collapsedWidth={windowWidth < 1024 ? 0 : 80}
                    theme="light"
                    style={{
                        overflow: 'hidden',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s',
                        boxShadow: collapsed && windowWidth < 1024 ? 'none' : '10px 0 30px rgba(0,0,0,0.02)'
                    }}
                    className="border-none"
                >
                    <div className="flex flex-col h-full">
                        <div className="p-6 flex items-center justify-center mb-4 shrink-0 transition-all duration-300">
                            <Link to="/">
                                {collapsed ? (
                                    <img src={favicon} alt="H" className="h-8 w-8 object-contain animate-in zoom-in-95" />
                                ) : (
                                    <img src={logo} alt="Homedify" className="h-12 transition-all duration-300 animate-in fade-in" />
                                )}
                            </Link>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <Menu
                                mode="inline"
                                selectedKeys={[location.pathname]}
                                items={menuItems}
                                onClick={({ key }) => navigate(key)}
                                className="border-none px-3"
                            />
                        </div>

                            <SellerSidebarProfile collapsed={collapsed} seller={seller} />
                    </div>
                </Sider>

                <Layout style={{
                    marginLeft: collapsed ? (windowWidth < 1024 ? 0 : 80) : (windowWidth < 1024 ? 0 : 280),
                    transition: 'all 0.3s',
                    minHeight: '100vh',
                    width: '100%',
                    overflow: 'hidden'
                }}>
                    <Header className="glass-panel sticky top-2 md:top-4 z-40 mx-2 md:mx-6 mt-2 md:mt-4 rounded-2xl md:rounded-[24px] px-4 md:px-8 flex justify-between items-center border-none h-[64px] md:h-[74px] shadow-lg shadow-black/5 relative">
                        <Button
                            type="text"
                            icon={<MenuIcon size={20} />}
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center transition-all"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 hidden xl:block pointer-events-none">
                            <Title level={4} className="m-0 font-black text-gray-900 tracking-[0.1em] uppercase text-sm md:text-base flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                                Seller <span className="text-coral">Dashboard</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                            </Title>
                        </div>
                        <Space size={16} className="z-10">
                          <div className="flex items-center gap-2">
                            <Tooltip title="Notifications">
                              <Badge count={globalUnread} size="small" offset={[-2, 2]} color="#FF6B6B">
                                <Button
                                  type="text"
                                  icon={<Bell size={20} className="text-gray-400" />}
                                  className="h-11 w-11 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-all"
                                  onClick={() => navigate('/seller/notifications')}
                                />
                              </Badge>
                            </Tooltip>

                            <div className="w-px h-8 bg-gray-100 mx-2 self-center opacity-50" />

                            <Tooltip title="Profile Settings">
                              <div 
                                onClick={() => navigate('/seller/profile')}
                                className="p-1 rounded-xl bg-gray-50/50 hover:bg-coral/5 transition-all cursor-pointer group"
                              >
                                <Avatar 
                                  src={getMediaUrl(user?.picture)} 
                                  icon={<User size={18} />} 
                                  className="bg-coral text-white border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                                  size={40}
                                />
                              </div>
                            </Tooltip>
                          </div>
                        </Space>
                    </Header>

                    <Content className="p-4 md:p-8">
                        <div className="max-w-[1200px] mx-auto">
                            <div className="mb-10 flex flex-wrap lg:flex-nowrap gap-6">
                                <div className="w-full lg:w-1/2">
                                    <Card className="border-none shadow-xl shadow-orange-100/50 bg-gradient-to-br from-orange-50 to-white rounded-[2.5rem] p-4 border-l-8 border-orange-400">
                                        <div className="flex gap-6 items-start">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                                <Clock size={28} className="text-orange-400" />
                                            </div>
                                            <div>
                                                <Text type="secondary" className="text-[10px] font-black tracking-[0.15em] text-orange-400/80">Held Payment (Escrow)</Text>
                                                <Title level={1} className="m-0 font-black text-gray-900 tracking-tighter text-4xl">
                                                    <span className="text-xl font-medium text-gray-400 mr-2">Rs.</span>
                                                    {heldAmount.toLocaleString()}
                                                </Title>
                                                <Text className="text-[10px] text-orange-400 font-bold mt-2 block italic tracking-wider">Awaiting 3-Day Verification</Text>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="w-full lg:w-1/2">
                                    <Card className="border-none shadow-xl shadow-green-100/50 bg-gradient-to-br from-green-50 to-white rounded-[2.5rem] p-4 border-l-8 border-[#52c41a]">
                                        <div className="flex gap-6 items-start">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                                <CheckCircle size={28} className="text-[#52c41a]" />
                                            </div>
                                            <div>
                                                <Text type="secondary" className="text-[10px] font-black tracking-[0.15em] text-[#52c41a]/80">Total Payout Received</Text>
                                                <Title level={1} className="m-0 font-black text-gray-900 tracking-tighter text-4xl">
                                                    <span className="text-xl font-medium text-gray-400 mr-2">Rs.</span>
                                                    {totalPayout.toLocaleString()}
                                                </Title>
                                                <Text className="text-[10px] text-[#52c41a] font-bold mt-2 block italic tracking-wider">Finalized & Transferred</Text>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            <Card 
                                title={<div className="flex items-center gap-3"><History size={20} className="text-coral" /><span className="text-lg font-black text-gray-900">Payout History</span></div>}
                                className="border-none shadow-sm rounded-[2rem] overflow-hidden"
                                styles={{ body: { padding: 0 } }}
                            >
                                <Table 
                                    columns={columns} 
                                    dataSource={payoutHistory}
                                    loading={loading}
                                    rowKey="_id"
                                    pagination={false}
                                    locale={{
                                        emptyText: <Empty description="Your earnings will appear here once orders are placed." />
                                    }}
                                    className="premium-table"
                                    scroll={{ x: windowWidth < 1200 ? 800 : undefined }}
                                />
                            </Card>
                        </div>
                    </Content>

                    <Modal
                        title={<Title level={4} className="m-0 font-black tracking-tight text-gray-900">Payment <span className="text-coral">Proof</span></Title>}
                        open={isReceiptModalVisible}
                        onCancel={() => setIsReceiptModalVisible(false)}
                        footer={null}
                        centered
                        width={600}
                        closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
                    >
                        <div className="p-4 flex flex-col items-center">
                            {selectedReceipt ? (
                                <img src={getMediaUrl(selectedReceipt)} alt="Payout Receipt" className="max-w-full rounded-2xl shadow-lg border border-gray-100" />
                            ) : (
                                <Empty description="No proof uploaded by Admin" />
                            )}
                            <Button type="primary" block className="h-12 rounded-xl mt-8 font-bold" onClick={() => setIsReceiptModalVisible(false)}>
                                Close Preview
                            </Button>
                        </div>
                    </Modal>

                    <style jsx="true">{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
                        .glass-panel {
                            background: rgba(255, 255, 255, 0.8) !important;
                            backdrop-filter: blur(12px) !important;
                            border: 1px solid rgba(255, 255, 255, 0.3) !important;
                        }
                    `}</style>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

export default SellerEarnings;
