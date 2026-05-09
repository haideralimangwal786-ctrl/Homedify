import React, { useEffect, useState, useContext } from 'react'
import { 
  Table, Tag, Space, Button, Input, Modal, Form, Select, 
  Switch, Typography, Card, Badge, Popconfirm, ConfigProvider
} from 'antd'
import { 
  Search, Plus, Edit3, Trash2, Tag as TagIcon, 
  HelpCircle, CheckCircle, XCircle, X
} from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const { Title, Text } = Typography

const CategoriesAdmin = ({ windowWidth: propWindowWidth }) => {
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
  const { user } = useContext(AuthContext)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/site/categories')
      setCategories(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      form.setFieldsValue({
        name: category.name,
        marketplace: category.marketplace,
        description: category.description,
        isActive: category.isActive
      })
    } else {
      setEditingCategory(null)
      form.resetFields()
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (values) => {
    try {
      const data = { ...values }
      
      if (editingCategory) {
        await api.put(`/api/v1/site/categories/${editingCategory._id}`, data)
        toast.success('Category updated successfully')
      } else {
        await api.post('/api/v1/site/categories', data)
        toast.success('Category created successfully')
      }
      
      setIsModalOpen(false)
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/site/categories/${id}`)
      toast.success('Category deleted')
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category')
    }
  }

  const handleStatusToggle = async (id, status) => {
    try {
      await api.put(`/api/v1/site/categories/${id}`, { isActive: status })
      toast.success(`Category ${status ? 'activated' : 'hidden'}`)
      setCategories(prev => prev.map(c => c._id === id ? { ...c, isActive: status } : c))
    } catch (err) {
      toast.error('Failed to update status')
    }
  }


  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text className="font-bold text-gray-900 text-sm tracking-tight">{name}</Text>
    },
    {
      title: 'Parent Type',
      dataIndex: 'marketplace',
      key: 'marketplace',
      render: (type) => (
        <Tag color={type === 'craft' ? 'blue' : 'orange'} className="rounded-md px-2 py-0.5 border-none font-bold uppercase text-[9px] tracking-widest shadow-sm">
          {type === 'craft' ? 'Handmade Crafts' : 'Non-Fresh Food'}
        </Tag>
      )
    },
    {
      title: 'Items',
      dataIndex: 'productCount',
      key: 'productCount',
      align: 'center',
      render: (count) => (
        <div className="flex justify-center">
          <Text className="text-[12px] font-medium text-gray-500">{count || 0}</Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive, record) => (
        <Space size={8}>
          <Switch 
            checked={isActive} 
            onChange={(checked) => handleStatusToggle(record._id, checked)}
            size="small"
            className={isActive ? 'bg-coral' : 'bg-gray-200'}
          />
          <Text className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
            {isActive ? 'Active' : 'Hidden'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Button 
            type="text" 
            icon={<Edit3 size={18} className="text-coral" />} 
            onClick={() => handleOpenModal(record)}
            className="hover:bg-coral/5 flex items-center justify-center h-10 w-10 rounded-xl"
          />
          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category? This will affect all linked products."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, className: "bg-red-500" }}
          >
            <Button 
              type="text" 
              icon={<Trash2 size={18} className="text-coral" />} 
              className="hover:bg-coral/5 flex items-center justify-center h-10 w-10 rounded-xl"
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B6B',
          borderRadius: 16,
        },
      }}
    >
      <div className="min-h-screen bg-transparent p-4 sm:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          
          {/* Box 1: Search & Action Bar */}
          <div className="mb-20 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white p-2">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search */}
                <div className="flex-1 w-full md:w-auto">
                  <Input 
                    placeholder="Search categories..." 
                    prefix={<Search size={20} className="text-gray-400 mr-2" />}
                    size="large"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="border-none bg-gray-50/50 hover:bg-gray-50 rounded-2xl h-14 text-lg font-medium"
                  />
                </div>

                {/* Stats Section */}
                <div className="hidden md:flex flex-col items-center px-10 border-x border-gray-100">
                   <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1 leading-none">Total</Text>
                   <Text className="text-2xl font-black text-coral leading-none">{categories.length}</Text>
                </div>

                {/* Create Button */}
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<Plus size={22} />} 
                  onClick={() => handleOpenModal()}
                  className="bg-coral hover:bg-coral-dark border-none h-14 px-8 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-coral/20 w-full md:w-auto"
                >
                  Create Category
                </Button>
              </div>
            </Card>
          </div>

          {/* Table Section */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200" styles={{ body: { padding: 0 } }}>
            <Table 
              scroll={windowWidth < 1200 ? { x: 'max-content' } : undefined}
              columns={columns} 
              dataSource={filteredCategories} 
              loading={loading}
              rowKey="_id"
              className="categories-table"
              rowClassName="hover:bg-[#FFF1F0] transition-colors cursor-default"
              pagination={false}
            />
          </Card>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                {editingCategory ? <Edit3 className="text-coral" size={20} /> : <Plus className="text-coral" size={20} />}
              </div>
              <div>
                <Title level={4} className="m-0 font-black text-gray-900">{editingCategory ? 'Edit Category' : 'Create New Category'}</Title>
                <Text className="text-gray-400 text-[11px] uppercase tracking-widest font-bold">Taxonomy Manager</Text>
              </div>
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={500}
          centered
          className="premium-modal"
          closeIcon={<X size={20} className="text-gray-400 hover:text-coral transition-colors" />}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="mt-6 space-y-4"
            initialValues={{ isActive: true }}
          >
            <Form.Item 
              label={<span className="text-xs font-black uppercase tracking-widest text-gray-400">Category Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter category name' }]}
            >
              <Input placeholder="e.g. Clay Pottery" size="large" className="rounded-xl py-3 font-semibold" />
            </Form.Item>

            <Form.Item 
              label={<span className="text-xs font-black uppercase tracking-widest text-gray-400">Parent Section</span>}
              name="marketplace"
              rules={[{ required: true, message: 'Please select parent section' }]}
            >
              <Select size="large" className="rounded-xl custom-select" placeholder="Select marketplace">
                <Select.Option value="craft">Handmade Crafts</Select.Option>
                <Select.Option value="food">Non-Fresh Food</Select.Option>
              </Select>
            </Form.Item>


            <div className="flex gap-4 pt-6">
              <Button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 h-14 rounded-2xl font-bold text-gray-500 border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="flex-1 h-14 rounded-2xl font-bold bg-coral hover:bg-coral-dark border-none shadow-lg shadow-coral/20"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </Form>
        </Modal>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-admin-table .ant-table-thead > tr > th {
            background: #ffffff !important;
            color: #9CA3AF !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.15em !important;
            font-weight: 900 !important;
            padding: 24px 20px !important;
            border-bottom: 1px solid #f8f8f8 !important;
          }
          .custom-admin-table .ant-table-tbody > tr > td {
            padding: 16px 20px !important;
            border-bottom: 1px solid #f8f8f8 !important;
          }
          .custom-admin-table .ant-table-row:hover > td {
            background: #fffafa !important;
          }
          .premium-modal .ant-modal-content {
            padding: 32px !important;
            border-radius: 32px !important;
          }
          .custom-select .ant-select-selector {
            border-radius: 12px !important;
            height: 52px !important;
            display: flex !important;
            align-items: center !important;
            border-color: #F3F4F6 !important;
          }
        `}} />
      </div>
    </ConfigProvider>
  )
}

export default CategoriesAdmin
