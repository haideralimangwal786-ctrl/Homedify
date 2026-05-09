import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { NotificationContext } from '../context/NotificationContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout, Menu, Card, Row, Col, Space, Typography, ConfigProvider, 
  Avatar, Tooltip, Input, Button, Form, Badge, Divider, Select, Tag, Upload
} from 'antd'
import {
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Wallet, Store,
  LogOut, Menu as MenuIcon, Edit, User, Mail, Phone, MapPin, 
  CreditCard, Banknote, ShieldCheck, Save, Bell
} from 'lucide-react'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'
import toast from 'react-hot-toast'
import SellerSidebarProfile from '../components/SellerSidebarProfile'

const { Header, Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const SellerProfile = () => {
  const { token, user, logout, updateProfile } = useContext(AuthContext)
  const { unreadCount: globalUnread } = useContext(NotificationContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [form] = Form.useForm()

  useEffect(() => {
    // Auto collapse sidebar on mobile
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (window.innerWidth < 1024) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)

    if (!token) return
    fetchSellerData()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [token])

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    
    const uploadsIndex = pathStr.indexOf('/uploads/');
    let finalUrl = '';
    if (uploadsIndex !== -1) {
        const cleanPath = pathStr.substring(uploadsIndex);
        finalUrl = `${backendUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    } else {
        const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
        finalUrl = `${backendUrl}/uploads${normalizedPath}`;
    }
    return `${finalUrl}?t=${Date.now()}`;
  };

  const fetchSellerData = async () => {
    try {
      const res = await axios.get('/api/v1/sellers/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data.data
      setSeller(data)
      if (user?.picture) {
        setAvatarPreview(getMediaUrl(user.picture))
      }
      form.setFieldsValue({
        name: user?.name,
        email: user?.email,
        contactNumber: user?.contactNumber,
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        storeAddress: data.storeAddress,
        businessType: data.businessType,
        paymentMethod: data.paymentMethod,
        paymentAccountNumber: data.paymentAccountNumber
      })
    } catch (err) {
      console.error(err)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file instanceof File ? file : file.originFileObj || file);
    }
  };

  const onFinish = async (values) => {
    setSaving(true)
    console.log("Starting profile update with values:", values);
    try {
      // 1. Update User Profile (Name, Phone, and Image)
      const userFormData = new FormData();
      userFormData.append('name', values.name);
      userFormData.append('contactNumber', values.contactNumber);
      if (avatarFile) {
        userFormData.append('profileImage', avatarFile);
        console.log("Adding profile image to update");
      }

      console.log("Updating User Profile via AuthContext...");
      const userResult = await updateProfile(userFormData);
      
      if (!userResult.success) {
        console.error("User update failed:", userResult.error);
        throw new Error(userResult.error);
      }

      // 2. Update Seller Store Info
      console.log("Updating Seller Store Info...");
      const sellerRes = await axios.put('/api/v1/sellers/me', {
        storeName: values.storeName,
        storeDescription: values.storeDescription || '',
        storeAddress: values.storeAddress,
        paymentMethod: values.paymentMethod,
        paymentAccountNumber: values.paymentAccountNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Update successful!", sellerRes.data);
      toast.success("Profile and Store updated successfully!");
      
      if (userResult.data?.picture) {
        setAvatarPreview(getMediaUrl(userResult.data.picture));
      }
      
      fetchSellerData();
    } catch (err) {
      console.error("Final update error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const isVerified = seller?.verificationStatus === 'approved'

  const menuItems = [
    { key: '/seller/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard Overview' },
    { key: '/seller/products', icon: <Package size={20} />, label: 'Product Management' },
    { key: '/seller/add-product', icon: <PlusCircle size={20} />, label: 'Add New Product' },
    { key: '/seller/orders', icon: <ShoppingCart size={20} />, label: 'Orders & Tracking' },
    { key: '/seller/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { key: '/seller/earnings', icon: <Wallet size={20} />, label: 'Wallet & Earnings' },
    { key: '/seller/profile', icon: <Store size={20} />, label: 'Store Profile' }
  ]

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#FF6B6B', borderRadius: 12, fontFamily: 'Outfit, Inter, sans-serif' },
        components: {
          Button: { colorPrimary: '#FF6B6B', colorPrimaryHover: '#FF5252', controlHeight: 44, fontWeight: 700 },
          Menu: { itemSelectedBg: '#FFEBEE', itemSelectedColor: '#FF6B6B', itemHoverBg: '#FAFAFA' },
          Card: { borderRadiusLG: 16 },
          Form: { itemMarginBottom: 35 },
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
            left: 0, top: 0, bottom: 0,
            zIndex: 1000,
            transition: 'all 0.3s',
            boxShadow: collapsed && windowWidth < 1024 ? 'none' : '10px 0 30px rgba(0,0,0,0.02)'
          }}
          className="border-none"
        >
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-center mb-4 shrink-0 transition-all duration-300">
              <Link to="/">
                {collapsed ? (
                  <img src={favicon} alt="H" className="h-8 w-8 object-contain" />
                ) : (
                  <img src={logo} alt="Homedify" className="h-12" />
                )}
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={({ key }) => {
                  if (key === 'logout') logout();
                  else navigate(key);
                }}
                className="border-none px-3"
              />
            </div>
            <SellerSidebarProfile collapsed={collapsed} seller={seller} avatarPreview={avatarPreview} />
          </div>
        </Sider>

        <Layout style={{ 
          marginLeft: windowWidth < 1024 ? 0 : (collapsed ? 80 : 280), 
          transition: 'all 0.3s', 
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Header className="glass-panel sticky top-2 md:top-4 z-40 mx-2 md:mx-6 mt-2 md:mt-4 rounded-2xl md:rounded-[24px] px-4 md:px-8 flex justify-between items-center border-none h-[64px] md:h-[74px] shadow-lg shadow-black/5 relative">
            <Button type="text" icon={<MenuIcon size={20} />} onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center transition-all" />
            <div className="absolute left-1/2 -translate-x-1/2 hidden xl:block pointer-events-none">
              <Title level={4} className="m-0 font-black text-gray-900 tracking-[0.1em] uppercase text-sm flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                Store <span className="text-coral">Profile</span>
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
            <div className="max-w-[1000px] mx-auto animate-in fade-in duration-700 pb-20">
              <div className="mb-12">
                <Title level={2} className="m-0 font-black uppercase tracking-tight">
                    Store <span className="text-coral">Settings</span>
                </Title>
                <Text type="secondary" className="text-sm font-medium">Manage your shop identity, personal info, and payment methods.</Text>
              </div>

              <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} style={{ width: '100%' }}>
                {/* Store Identity Card */}
                <Card className="profile-card shadow-sm border-gray-100 rounded-2xl mb-[35px]">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative">
                            <Avatar size={80} src={avatarPreview} className="bg-gray-100 border border-gray-200">
                                {user?.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Upload 
                                showUploadList={false} 
                                onChange={handleAvatarChange}
                                beforeUpload={() => false}
                            >
                                <Button 
                                    size="small"
                                    shape="circle" 
                                    icon={<Edit size={12} />} 
                                    className="absolute -bottom-1 -right-1 bg-white shadow-md border-gray-100 flex items-center justify-center"
                                />
                            </Upload>
                        </div>
                        <div>
                            <Title level={4} className="m-0">{seller?.storeName || 'My Artisan Store'}</Title>
                            <div className="flex items-center gap-2 mt-1">
                                <Tag color={isVerified ? "green" : "orange"} className="rounded-full border-none px-3 text-[10px] font-bold uppercase">
                                    {isVerified ? "Verified Artisan" : "Verification Pending"}
                                </Tag>
                                <Text className="text-gray-400 text-xs italic">Seller since 2026</Text>
                            </div>
                        </div>
                    </div>

                    <Divider className="my-6" />

                    <Row gutter={[24, 0]}>
                        <Col span={24}>
                            <Form.Item name="storeName" label="Shop Name" rules={[{ required: true, message: 'Shop name is required' }]}>
                                <Input prefix={<Store size={18} className="text-gray-400 mr-2" />} className="h-11 rounded-lg" placeholder="Enter your shop's name" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="storeDescription" label="Store Description">
                                <TextArea rows={4} className="rounded-lg" placeholder="Tell your store's story and what makes your products unique..." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="storeAddress" label="Business Address" rules={[{ required: true, message: 'Address is required' }]}>
                                <Input prefix={<MapPin size={18} className="text-gray-400 mr-2" />} className="h-11 rounded-lg" placeholder="Full business location" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                 {/* Personal Details Card */}
                 <Card className="profile-card shadow-sm border-gray-100 rounded-2xl mb-[35px]" title={<span className="text-sm font-bold flex items-center gap-2"><User size={16} /> Personal Information</span>}>
                     <Row gutter={[24, 0]}>
                         <Col xs={24} md={12}>
                             <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                                 <Input prefix={<User size={18} className="text-gray-400 mr-2" />} className="h-11 rounded-lg" />
                             </Form.Item>
                         </Col>
                         <Col xs={24} md={12}>
                             <Form.Item name="email" label="Email Address">
                                 <Input prefix={<Mail size={18} className="text-gray-400 mr-2" />} className="h-11 rounded-lg bg-gray-50" readOnly />
                             </Form.Item>
                         </Col>
                         <Col span={24}>
                             <Form.Item name="contactNumber" label="Phone Number" rules={[{ required: true, message: 'Phone is required' }]}>
                                 <Input prefix={<Phone size={18} className="text-gray-400 mr-2" />} className="h-11 rounded-lg" placeholder="03XXXXXXXXX" />
                             </Form.Item>
                         </Col>
                     </Row>
                 </Card>
 
                 {/* Financial Details Card */}
                 <Card className="profile-card shadow-sm border-gray-100 rounded-2xl mb-[35px]" title={<span className="text-sm font-bold flex items-center gap-2"><Banknote size={16} /> Financial & Payout Settings</span>}>
                     <Row gutter={[24, 0]}>
                         <Col xs={24} md={12}>
                             <Form.Item name="paymentMethod" label="Wallet Type" rules={[{ required: true, message: 'Select your wallet type' }]}>
                                 <Select className="h-11 w-full" placeholder="Select Wallet">
                                     <Select.Option value="EasyPaisa">EasyPaisa</Select.Option>
                                     <Select.Option value="JazzCash">JazzCash</Select.Option>
                                 </Select>
                             </Form.Item>
                         </Col>
                         <Col xs={24} md={12}>
                             <Form.Item 
                                 name="paymentAccountNumber" 
                                 label="Mobile Account Number" 
                                 rules={[
                                     { required: true, message: 'Account number is required' },
                                     { pattern: /^03[0-9]{9}$/, message: 'Enter a valid 11-digit mobile number (03XXXXXXXXX)' }
                                 ]}
                             >
                                 <Input prefix={<Phone size={18} className="text-gray-400 mr-2" />} className="h-11 rounded-lg" placeholder="03XXXXXXXXX" />
                             </Form.Item>
                         </Col>
                     </Row>
                 </Card>

                {/* Action Footer */}
                <div className="flex justify-end gap-4 mt-12">
                    <Button className="h-11 px-8 rounded-lg font-bold" onClick={() => fetchSellerData()}>Discard Changes</Button>
                    <Button 
                        type="primary" 
                        onClick={() => form.submit()} 
                        loading={saving}
                        className="h-11 px-10 rounded-lg font-black bg-coral border-none shadow-xl shadow-coral/20 hover:opacity-90 uppercase tracking-widest text-xs"
                    >
                        Save Settings
                    </Button>
                </div>
              </Form>
            </div>
          </Content>
        </Layout>
      </Layout>

      <style>{`
        .ant-form-item { margin-bottom: 35px !important; }
        .ant-form-item-label { padding-bottom: 10px !important; }
        .ant-form-item-label label { font-size: 13px !important; font-weight: 600 !important; color: #64748B !important; }
        .profile-card { margin-bottom: 35px !important; }
        .profile-card .ant-card-head { border-bottom: 1px solid #f8fafc !important; padding: 0 24px !important; min-height: 56px !important; }
        .profile-card .ant-card-body { padding: 32px 24px !important; }
        .glass-panel { background: rgba(255, 255, 255, 0.8) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255, 255, 255, 0.3) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 10px; }
      `}</style>
    </ConfigProvider>
  )
}

export default SellerProfile
