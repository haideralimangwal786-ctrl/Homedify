import React, { useState, useEffect, useContext } from 'react'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'
import { NotificationContext } from '../context/NotificationContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { 
  Layout, Menu, Card, Button, Row, Col, Space,
  Typography, ConfigProvider, Avatar, Tooltip, Input, InputNumber,
  Select, Form, Upload, Badge, Steps, Cascader, Divider, Descriptions,
  Modal
} from 'antd'
import {
  LayoutDashboard, Package, ShoppingCart, Wallet, Store,
  Menu as MenuIcon, Upload as UploadIcon, 
  Plus, Info, Image as ImageIcon,
  Sparkles, CheckCircle, DollarSign, FileText, ArrowRight, ArrowLeft,
  Layers, Eye, XCircle, LogOut, User, X
} from 'lucide-react'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'
import { Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import SellerSidebarProfile from '../components/SellerSidebarProfile'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const SellerAddProduct = () => {
  const { token, user, logout } = useContext(AuthContext)
  const { unreadCount: globalUnread } = useContext(NotificationContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  const [categories, setCategories] = useState([])
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [fileList, setFileList] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [subCategories, setSubCategories] = useState([])
  const [isGuideVisible, setIsGuideVisible] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [form] = Form.useForm()

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return null;
    const pathStr = String(pathValue);
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    const filename = pathStr.split(/[\\/]/).pop();
    return `${backendUrl}/uploads/${filename}`;
  };

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
    loadInitialData()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [token])

  const loadInitialData = async () => {
    try {
      const [catRes, sellerRes] = await Promise.all([
        api.get('/api/v1/categories/tree'),
        api.get('/api/v1/sellers/me')
      ])
      
      // Transform categories for selection
      const transformedCats = catRes.data.data.map(cat => ({
        value: cat._id,
        label: cat.name,
        marketplace: cat.marketplace,
        children: cat.children?.map(sub => ({
          value: sub._id,
          label: sub.name
        }))
      }))
      
      setCategories(transformedCats)
      setSeller(sellerRes.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleNext = async () => {
    try {
      await form.validateFields()
      if (currentStep === 1 && fileList.length === 0) {
        toast.error('Please upload at least one product image')
        return
      }
      setCurrentStep(prev => prev + 1)
    } catch (err) {
      toast.error('Please fill all required fields correctly')
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const onFinish = async (values) => {
    setLoading(true)
    const fd = new FormData()
    
    const allValues = { ...form.getFieldsValue(true), ...values }
    
    // Append all form values
    Object.keys(allValues).forEach(key => {
      if (key !== 'mainCategory' && allValues[key] !== undefined) {
        fd.append(key, allValues[key])
      }
    })

    fileList.forEach(file => {
      if (file.originFileObj) {
        fd.append('images', file.originFileObj)
      }
    })

    try {
      await api.post('/api/v1/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Product published successfully!')
      navigate('/seller/products')
    } catch (err) {
      toast.error('Failed to publish product')
    } finally {
      setLoading(false)
    }
  }

  const isVerified = seller?.verificationStatus === 'approved'

  const menuItems = [
    { key: '/seller/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard Overview' },
    { key: '/seller/products', icon: <Package size={20} />, label: 'Product Management' },
    { key: '/seller/add-product', icon: <Plus size={20} />, label: 'Add New Product' },
    { key: '/seller/orders', icon: <ShoppingCart size={20} />, label: 'Orders & Tracking' },
    { key: '/seller/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { key: '/seller/earnings', icon: <Wallet size={20} />, label: 'Wallet & Earnings' },
    { key: '/seller/profile', icon: <Store size={20} />, label: 'Store Profile' }
  ]

  const stepItems = [
    { icon: <FileText size={22} /> },
    { icon: <ImageIcon size={22} /> },
    { icon: <CheckCircle size={22} /> }
  ]

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B6B',
          borderRadius: 12,
          fontFamily: 'Outfit, Inter, system-ui, sans-serif',
        },
        components: {
          Button: {
            colorPrimary: '#FF6B6B',
            colorPrimaryHover: '#FF5252',
            controlHeight: 48,
            fontWeight: 700,
            borderRadius: 12,
          },
          Input: { controlHeight: 48, borderRadius: 12 },
          Select: { controlHeight: 48, borderRadius: 12 },
          Cascader: { controlHeight: 48, borderRadius: 12 },
          InputNumber: { controlHeight: 48, borderRadius: 12 },
          Steps: {
            iconSize: 56,
            colorPrimary: '#FF6B6B',
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
                        left: 0, top: 0, bottom: 0,
                        zIndex: 1000,
                        transition: 'all 0.3s',
                        boxShadow: collapsed && windowWidth < 1024 ? 'none' : '10px 0 30px rgba(0,0,0,0.02)'
                    }}
          className="border-none"
        >
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-center mb-4 shrink-0">
              <Link to="/">
                <img src={logo} alt="Homedify" className="h-12" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <Menu
                mode="inline"
                selectedKeys={['/seller/add-product']}
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
              className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center"
            />
            
            <div className="absolute left-1/2 -translate-x-1/2 hidden xl:block">
              <Title level={4} className="m-0 font-black text-gray-900 tracking-[0.1em] uppercase text-sm flex items-center gap-3">
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
            <div className="max-w-[1000px] mx-auto">
              <div className="mb-12">
                <div className="mb-8 text-left">
                  <Title level={2} className="m-0 font-black text-gray-900 tracking-[0.05em] uppercase">Add New <span className="text-coral">Product</span></Title>
                  <Text type="secondary" className="text-sm font-medium text-gray-400">Complete the steps to showcase your handmade masterpiece.</Text>
                </div>
                
                <div className="max-w-md mx-auto">
                  <Steps 
                    current={currentStep} 
                    items={stepItems} 
                    responsive={true}
                    className="premium-steps-only-icon"
                  />
                </div>
              </div>

              <Form form={form} layout="vertical" onFinish={onFinish} preserve={true}>
                <div className="min-h-[450px]">
                  {/* Step 1: Basic Information */}
                  {currentStep === 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <Card 
                        className="border-none shadow-sm mb-8 rounded-[24px] p-2" 
                        title={<div className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 px-2"><Info size={14} className="text-coral" /> Step 1: Product Identity</div>}
                      >
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item 
                              name="marketplace" 
                              label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Main Category</Text>} 
                              rules={[{ required: true, message: 'Please select a marketplace' }]}
                            >
                              <Select 
                                placeholder="Choose Craft or Food" 
                                className="w-full"
                                suffixIcon={<Store size={16} className="text-gray-300" />}
                                onChange={(val) => {
                                  form.setFieldValue('categoryId', undefined)
                                  const filtered = categories.filter(c => c.marketplace === val)
                                  
                                  // Flatten children to show as sub-categories
                                  let allSubCats = []
                                  filtered.forEach(cat => {
                                    // If this category itself is not a generic root, add it
                                    const genericRoots = ["Handmade Crafts", "Non-Fresh Food Items", "Selected Food"]
                                    if (!genericRoots.includes(cat.label)) {
                                      allSubCats.push({ value: cat.value, label: cat.label })
                                    }
                                    
                                    // Add its children
                                    if (cat.children && cat.children.length > 0) {
                                      cat.children.forEach(child => {
                                        allSubCats.push({ value: child.value, label: child.label })
                                      })
                                    }
                                  })
                                  setSubCategories(allSubCats)
                                }}
                              >
                                <Select.Option value="craft">Handmade Crafts</Select.Option>
                                <Select.Option value="food">Home-made Food</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item 
                              name="categoryId" 
                              label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Sub-Category</Text>} 
                              rules={[{ required: true, message: 'Selection is required' }]}
                            >
                              <Select 
                                placeholder="Select specific category" 
                                className="w-full" 
                                suffixIcon={<Layers size={16} className="text-gray-300" />}
                                popupMatchSelectWidth={true}
                                disabled={!subCategories.length}
                              >
                                {subCategories.map(s => <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item 
                          name="name" 
                          label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Product Title</Text>} 
                          rules={[
                            { required: true, message: 'Product name is required' },
                            { min: 5, message: 'Name must be at least 5 characters' }
                          ]}
                        >
                          <Input 
                            prefix={<Package size={18} className="text-coral mr-2" />}
                            placeholder="e.g. Hand-Woven Silk Scarf" 
                            className="bg-gray-50 border-none h-12" 
                          />
                        </Form.Item>

                        <Form.Item 
                          name="description" 
                          label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Product Story & Details</Text>} 
                          rules={[
                            { required: true, message: 'Please describe your creation' },
                            { min: 30, message: 'Provide a more detailed description (min 30 chars)' }
                          ]}
                        >
                          <TextArea 
                            rows={6} 
                            placeholder="Share the inspiration, materials, and unique features of your masterpiece..." 
                            className="bg-gray-50 border-none p-4" 
                          />
                        </Form.Item>

                        <Row gutter={16}>
                            <Form.Item 
                              name="price" 
                              label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Selling Price</Text>} 
                              rules={[
                                { required: true, message: 'Price is required' },
                                { type: 'number', min: 100, message: 'Price must be at least 100 PKR' }
                              ]}
                            >
                              <InputNumber 
                                className="w-full bg-gray-50 border-none" 
                                style={{ width: '100%' }}
                                prefix={
                                  <div className="flex items-center gap-2">
                                    <DollarSign size={18} className="text-coral" />
                                    <span className="text-gray-400 font-bold text-[10px]">PKR</span>
                                  </div>
                                } 
                                min={0} 
                                placeholder="0.00"
                              />
                            </Form.Item>
                        </Row>
                      </Card>
                    </div>
                  )}

                  {/* Step 2: Media */}
                  {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                      <Card 
                        className="border-none shadow-sm rounded-[24px] w-full"
                        title={<div className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 px-2"><ImageIcon size={14} className="text-coral" /> Step 2: Media Upload</div>}
                      >
                        <div className="mb-6 flex justify-center">
                          <Button 
                            type="link" 
                            icon={<Eye size={16} />} 
                            onClick={() => setIsGuideVisible(true)}
                            className="text-coral font-bold hover:text-coral/80 flex items-center gap-2"
                          >
                            Your product images should look like this
                          </Button>
                        </div>

                        <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-[20px] bg-gray-50/50">
                          <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false}
                            multiple
                            showUploadList={{ showPreviewIcon: false, showRemoveIcon: true }}
                            className="premium-uploader-page"
                          >
                            {fileList.length >= 5 ? null : (
                              <div className="flex flex-col items-center gap-2">
                                <UploadIcon size={24} className="text-coral" />
                                <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">Add Photo</div>
                              </div>
                            )}
                          </Upload>
                          <Divider />
                          <Text type="secondary" className="text-xs">
                            Upload up to 5 high-quality photos. Show different angles and details.
                          </Text>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                      <Card 
                        className="border-none shadow-sm rounded-[24px]"
                        title={<div className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 px-2"><CheckCircle size={14} className="text-green-500" /> Step 3: Review & Submit</div>}
                      >
                        <Descriptions bordered column={1} className="premium-descriptions">
                          <Descriptions.Item label="Main Category">
                            {form.getFieldValue('marketplace') === 'craft' ? 'Handmade Crafts' : 'Home-made Food'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Category">
                            {subCategories.find(s => s.value === form.getFieldValue('categoryId'))?.label || 'N/A'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Product Name">{form.getFieldValue('name')}</Descriptions.Item>
                          <Descriptions.Item label="Price">PKR {form.getFieldValue('price')?.toLocaleString()}</Descriptions.Item>
                          <Descriptions.Item label="Marketplace">{form.getFieldValue('marketplace') === 'craft' ? 'Craft Marketplace' : 'Home-Made Food'}</Descriptions.Item>
                          <Descriptions.Item label="Description">{form.getFieldValue('description')}</Descriptions.Item>
                          <Descriptions.Item label="Images">
                            <Space size={8}>
                              {fileList.map((file, i) => (
                                <Avatar key={i} shape="square" size={64} src={file.url || (file.originFileObj && URL.createObjectURL(file.originFileObj))} />
                              ))}
                            </Space>
                          </Descriptions.Item>
                        </Descriptions>
                        
                        <div className="mt-8 bg-[#FC6A6B]/10 p-4 rounded-2xl border border-[#FC6A6B]/20 flex gap-3">
                           <Info size={20} className="text-[#FC6A6B] shrink-0" />
                           <Text className="text-[12px] text-[#FC6A6B]">
                             Once submitted, your product will be reviewed by our admin team. This usually takes less than 24 hours.
                           </Text>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-12 flex justify-between items-center max-w-[1000px] mx-auto px-2">
                  {currentStep > 0 ? (
                    <Button 
                      icon={<ArrowLeft size={18} />} 
                      onClick={handleBack} 
                      disabled={loading}
                      className="h-12 px-8 rounded-xl font-bold border-gray-200 text-gray-400 hover:text-coral hover:border-coral transition-all"
                    >
                      Back
                    </Button>
                  ) : <div />}

                  {currentStep < 2 ? (
                    <Button 
                      type="primary" 
                      onClick={handleNext}
                      className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] bg-coral border-none shadow-xl shadow-coral/20"
                    >
                      Next <ArrowRight size={18} className="ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      onClick={() => form.submit()}
                      loading={loading}
                      className="h-14 px-12 rounded-xl font-black uppercase tracking-widest text-[11px] bg-green-500 hover:bg-green-600 border-none shadow-xl shadow-green-200"
                    >
                      Confirm & Publish <CheckCircle size={18} className="ml-2" />
                    </Button>
                  )}
                </div>
              </Form>
            </div>
          </Content>
        </Layout>

        <Modal
          title={<div className="font-black uppercase tracking-widest text-[10px] text-gray-400 text-center mb-4">Mastering Product Photography</div>}
          open={isGuideVisible}
          onCancel={() => setIsGuideVisible(false)}
          footer={null}
          centered
          width={650}
          className="premium-modal"
          closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
        >
          <div className="p-2">
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div className="rounded-[24px] overflow-hidden shadow-xl mb-4 aspect-square relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&auto=format&fit=crop&q=60" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt="Good example"
                  />
                  <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Excellent</div>
                </div>
                <div className="px-2 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-green-500" />
                    <Text strong className="text-[13px] text-gray-800">High Fidelity</Text>
                  </div>
                  <Text type="secondary" className="text-[11px] leading-relaxed block">Clear background, soft natural lighting, and sharp focus.</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="rounded-[24px] overflow-hidden shadow-xl mb-4 aspect-square relative group opacity-60">
                  <img 
                    src="https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?w=500&auto=format&fit=crop&q=60" 
                    className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-110" 
                    alt="Bad example"
                  />
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Avoid This</div>
                </div>
                <div className="px-2 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle size={16} className="text-red-500" />
                    <Text strong className="text-[13px] text-gray-400">Poor Quality</Text>
                  </div>
                  <Text type="secondary" className="text-[11px] leading-relaxed block">Dark lighting, cluttered background, and out of focus.</Text>
                </div>
              </Col>
            </Row>

            <div className="mt-10 bg-gray-50/80 p-8 rounded-2xl border border-gray-100">
               <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                       <Sparkles size={18} className="text-coral" />
                    </div>
                    <div>
                       <Text strong className="text-[12px] block mb-0.5 text-gray-800">Natural Light</Text>
                       <Text className="text-[11px] text-gray-400">Place your product near a window. Avoid using harsh camera flash.</Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                       <Package size={18} className="text-coral" />
                    </div>
                    <div>
                       <Text strong className="text-[12px] block mb-0.5 text-gray-800">Multiple Angles</Text>
                       <Text className="text-[11px] text-gray-400">Show the front, sides, and a close-up of the texture/material.</Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                       <Layers size={18} className="text-coral" />
                    </div>
                    <div>
                       <Text strong className="text-[12px] block mb-0.5 text-gray-800">Minimalist Context</Text>
                       <Text className="text-[11px] text-gray-400">Use a plain white or neutral background to make the product pop.</Text>
                    </div>
                  </div>
               </div>
            </div>

            <Button 
              type="primary" 
              block 
              className="mt-8 bg-coral border-none h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-coral/20 rounded-2xl"
              onClick={() => setIsGuideVisible(false)}
            >
              Got it, let's upload!
            </Button>
          </div>
        </Modal>
      </Layout>

      <style>{`
        .premium-steps .ant-steps-item-title { font-weight: 900 !important; font-size: 13px !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; }
        .premium-descriptions .ant-descriptions-item-label { font-weight: 700; width: 140px; background: #fafafa; }
        @media (min-width: 768px) {
          .premium-descriptions .ant-descriptions-item-label { width: 200px; }
        }
        .premium-uploader-page .ant-upload-select {
          width: 100px !important;
          height: 100px !important;
          border-radius: 16px !important;
          border: 2px dashed #eee !important;
        }
        @media (min-width: 640px) {
          .premium-uploader-page .ant-upload-select {
            width: 120px !important;
            height: 120px !important;
          }
        }
        .premium-steps-only-icon .ant-steps-item-title, .premium-steps-only-icon .ant-steps-item-description { display: none !important; }
        .premium-steps-only-icon .ant-steps-item-icon { margin-right: 0 !important; }
        .premium-steps-only-icon .ant-steps-item-tail { display: block !important; }
      `}</style>
    </ConfigProvider>
  )
}

export default SellerAddProduct
