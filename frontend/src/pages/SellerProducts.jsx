import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { NotificationContext } from '../context/NotificationContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Layout, Menu, Card, Table, Tag, Badge, Button, Row, Col, Space,
  Typography, ConfigProvider, theme, Avatar, Tooltip, Input, InputNumber,
  Select, Form, Modal, Upload, Empty, Steps, Switch, Divider
} from 'antd'
import {
  LayoutDashboard, Package, PlusCircle, ShoppingCart, Wallet, Store,
  DollarSign, Clock, Box, ShieldCheck, LogOut, Menu as MenuIcon,
  Edit, Trash2, AlertCircle, Plus, Upload as UploadIcon, Search,
  ArrowRight, Image as ImageIcon, Info, User, X
} from 'lucide-react'
import logo from '../assets/logo.png'
import favicon from '../assets/favicon.png'
import { Bell, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import SellerSidebarProfile from '../components/SellerSidebarProfile'
const { Header, Sider, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

const SellerProducts = () => {
  const { token, user, logout } = useContext(AuthContext)
  const { unreadCount: globalUnread } = useContext(NotificationContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [editingProduct, setEditingProduct] = useState(null)
  const [fileList, setFileList] = useState([])
  const [searchText, setSearchText] = useState('')
  const [orders, setOrders] = useState([])
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
    loadData()
    // Periodic refresh every 30 seconds
    const interval = setInterval(loadData, 30000)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
    }
  }, [token])

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return 'https://files.catbox.moe/6z7x6v.png';
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    
    const uploadsIndex = pathStr.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
        const cleanPath = pathStr.substring(uploadsIndex);
        return `${backendUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    }
    
    const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    return `${backendUrl}/uploads${normalizedPath}`;
  };

  const loadData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes, sellerRes, orderRes] = await Promise.all([
        axios.get('/api/v1/products/seller', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/categories/tree'),
        axios.get('/api/v1/sellers/me', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/orders/seller', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setProducts(prodRes.data || [])
      setCategories(catRes.data.data || [])
      setSeller(sellerRes.data.data)
      setOrders(orderRes.data.data || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const showAddModal = () => {
    setEditingProduct(null)
    setFileList([])
    form.resetFields()
    setCurrentStep(0)
    setIsModalOpen(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    form.setFieldsValue({
      name: product.name,
      price: product.price,
      description: product.description,
      marketplace: product.marketplace || 'craft',
      categoryId: product.categoryId?._id || product.categoryId,
      quantity: product.quantity || 1
    })
    setFileList(product.images?.map((url, i) => ({
      uid: i,
      name: `image-${i}`,
      status: 'done',
      url: url,
    })) || [])
    setCurrentStep(0)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Keep it',
      onOk: async () => {
        try {
          await axios.delete(`/api/v1/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setProducts(prev => prev.filter(p => p._id !== id))
          toast.success('Product deleted')
        } catch (e) {
          toast.error('Failed to delete product')
        }
      }
    })
  }

  const onFinish = async (values) => {
    const fd = new FormData()
    Object.keys(values).forEach(key => {
      if (values[key]) fd.append(key, values[key])
    })

    if (!values.quantity) fd.append('quantity', 99999)

    fileList.forEach(file => {
      if (file.originFileObj) {
        fd.append('images', file.originFileObj)
      } else if (file.url) {
        fd.append('existingImages', file.url)
      }
    })

    try {
      if (editingProduct) {
        const res = await axios.put(`/api/v1/products/${editingProduct._id}`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
        setProducts(prev => prev.map(p => p._id === res.data._id ? res.data : p))
        toast.success('Product updated!')
      } else {
        const res = await axios.post('/api/v1/products', fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
        setProducts(prev => [res.data, ...prev])
        toast.success('Product published!')
      }
      setIsModalOpen(false)
      if (location.pathname === '/seller/add-product') {
        navigate('/seller/products')
      }
    } catch (err) {
      toast.error('Operation failed')
    }
  }

  const isVerified = seller?.verificationStatus === 'approved'

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
      ),
      disabled: !isVerified 
    },
    { key: '/seller/add-product', icon: <PlusCircle size={20} />, label: 'Add New Product', disabled: !isVerified },
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
    { key: '/seller/profile', icon: <Store size={20} />, label: 'Store Profile' }
  ]

  const handleToggleStatus = async (id, checked) => {
    try {
      await axios.put(`/api/v1/products/${id}`, { isActive: checked }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isActive: checked } : p))
      toast.success(checked ? 'Product enabled' : 'Product disabled')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform hover:scale-105">
            <img
              src={getMediaUrl(record.images?.[0])}
              alt="p"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://files.catbox.moe/6z7x6v.png' }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-800 text-xs truncate max-w-[200px]">{record.name}</span>
            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tight">
              {record.categoryId?.name || 'Uncategorized'}
            </span>
          </div>
        </div>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      width: 120,
      render: (price) => (
        <div className="flex flex-col">
          <span className="font-bold text-coral text-xs">Rs. {price?.toLocaleString()}</span>
          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">PKR</span>
        </div>
      )
    },

    {
      title: 'Admin Approval',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 140,
      render: (status) => {
        const map = {
          active:   { bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500',  label: 'Approved' },
          approved: { bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500',  label: 'Approved' },
          rejected: { bg: 'bg-red-50',    text: 'text-red-500',    dot: 'bg-red-500',    label: 'Rejected' },
        };
        const cfg = map[status] || { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', label: 'Pending' };
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>
        );
      }
    },
    {
      title: 'Visibility',
      key: 'visibility',
      align: 'center',
      width: 110,
      render: (_, record) => {
        const isApproved = record.status === 'active' || record.status === 'approved';
        return (
          <div className="flex flex-col items-center gap-1">
            <Switch
              size="small"
              checked={record.isActive}
              disabled={!isApproved}
              onChange={(checked) => handleToggleStatus(record._id, checked)}
              className={record.isActive ? 'bg-green-500' : ''}
            />
            {!isApproved && (
              <span className="text-[8px] italic font-bold text-gray-300 uppercase tracking-widest">Awaiting</span>
            )}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Product">
            <Button
              type="text"
              icon={<Edit size={18} />}
              onClick={() => handleEdit(record)}
              className="text-gray-400 hover:text-coral hover:bg-coral/5 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            />
          </Tooltip>
          <Tooltip title="Delete Product">
            <Button
              type="text"
              icon={<Trash2 size={18} />}
              onClick={() => handleDelete(record._id)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            />
          </Tooltip>
        </Space>
      )
    }
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
            controlHeight: 44,
            fontWeight: 700,
            borderRadius: 10,
          },
          Menu: {
            itemSelectedBg: '#FFEBEE',
            itemSelectedColor: '#FF6B6B',
            itemHoverBg: '#FAFAFA',
            itemBorderRadius: 8,
          },
          Card: {
            borderRadiusLG: 20,
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
          <Header className="glass-panel sticky top-2 md:top-4 z-40 mx-2 md:mx-6 mt-2 md:mt-4 rounded-2xl md:rounded-[16px] px-4 md:px-8 flex justify-between items-center border-none h-[64px] md:h-[74px] shadow-lg shadow-black/5 relative">
            {/* Left: Menu Toggle */}
            <div className="z-10">
              <Button
                type="text"
                icon={<MenuIcon size={20} />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-gray-500 hover:bg-gray-100/50 rounded-xl h-11 w-11 flex items-center justify-center transition-all"
              />
            </div>

            {/* Center: Seller Dashboard Title */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden xl:block pointer-events-none">
              <Title level={4} className="m-0 font-black text-gray-900 tracking-[0.1em] uppercase text-sm md:text-base flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                Seller <span className="text-coral">Dashboard</span>
                <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              </Title>
            </div>
            
            {/* Right: Actions */}
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
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-3">
                   <div>
                      <Title level={2} className="m-0 font-black text-gray-900 tracking-[0.05em] uppercase text-xl md:text-3xl">Product <span className="text-coral">Management</span></Title>
                      <Text type="secondary" className="text-xs md:text-sm font-medium text-gray-400">Manage, track, and showcase your handmade products to the world.</Text>
                   </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <Input 
                    prefix={<Search size={18} className="text-gray-400" />} 
                    placeholder="Search catalogue..." 
                    className="w-full sm:w-80 h-12 rounded-2xl border-none bg-gray-50 hover:bg-gray-100 transition-all font-medium"
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <Button 
                  type="primary" 
                  icon={<Plus size={20} />} 
                  onClick={() => navigate('/seller/add-product')} 
                  disabled={!isVerified}
                  className="w-full sm:w-auto h-12 px-8 rounded-2xl shadow-xl shadow-coral/20 font-black uppercase tracking-[0.1em] text-[11px] flex items-center justify-center bg-coral border-none"
                >
                  Add New Product
                </Button>
              </div>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                <Table 
                  columns={columns} 
                  dataSource={products.filter(p => 
                    (p.name || "").toLowerCase().includes(searchText.toLowerCase()) || 
                    (p.categoryId?.name || "").toLowerCase().includes(searchText.toLowerCase())
                  )} 
                  loading={loading}
                  rowKey="_id"
                  pagination={false}
                  className="premium-table"
                  scroll={{ x: 700 }}
                />
              </Card>
            </div>
          </Content>
        </Layout>

      </Layout>

      {/* Edit Product Modal */}
      <Modal
        title={
          <div className="mb-4 -ml-8">
            <Title level={3} className="m-0 font-black tracking-tight text-gray-900">Edit Product</Title>
            <Text type="secondary" className="text-xs font-medium">Update your product details and status</Text>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        centered
        className="premium-modal"
        closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item name="name" label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Product Name</Text>} rules={[{ required: true }]}>
                <Input className="h-11 rounded-xl bg-gray-50 border-none" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="categoryId" label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Category</Text>} rules={[{ required: true }]}>
                    <Select className="w-full h-11" placeholder="Select category">
                      {categories.map(c => <Option key={c._id} value={c._id}>{c.name}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="marketplace" label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Marketplace</Text>}>
                    <Select className="h-11">
                      <Option value="craft">Craft Marketplace</Option>
                      <Option value="food">Home-Made Food</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="price" label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Price (PKR)</Text>} rules={[{ required: true }]}>
                    <InputNumber className="w-full h-11 rounded-xl bg-gray-50 border-none pt-1" prefix="PKR" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label={<Text strong className="text-[11px] uppercase tracking-wider text-gray-400">Description</Text>} rules={[{ required: true }]}>
                <TextArea rows={4} className="bg-gray-50 border-none rounded-xl" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <div className="mb-6">
                <Text strong className="text-[11px] uppercase tracking-wider text-gray-400 block mb-3">Product Images</Text>
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  className="edit-product-uploader"
                >
                  {fileList.length >= 5 ? null : (
                    <div className="flex flex-col items-center gap-1">
                      <Plus size={16} className="text-coral" />
                      <div className="text-[10px] font-bold text-gray-400">ADD</div>
                    </div>
                  )}
                </Upload>
              </div>


            </Col>
          </Row>

          <div className="mt-10 flex gap-4 border-t border-gray-50 pt-8">
            <Button 
                type="primary" 
                htmlType="submit" 
                className="flex-[2] h-14 shadow-xl shadow-coral/20 font-black uppercase tracking-widest text-sm rounded-2xl bg-gradient-to-r from-coral to-coral/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
            <Button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 h-14 border-2 border-gray-100 font-black uppercase tracking-widest text-sm rounded-2xl hover:border-coral hover:text-coral transition-all"
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .edit-product-uploader .ant-upload-select {
          border-radius: 12px !important;
          border: 2px dashed #eee !important;
          background: #fafafa !important;
        }
        .premium-modal .ant-modal-content {
          border-radius: 24px;
          padding: 32px;
        }
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
    </ConfigProvider>
  )
}

export default SellerProducts
