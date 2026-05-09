import React, { useState, useContext, useEffect } from 'react'
import UserLayout from '../shared/UserLayout'
import { AuthContext } from '../context/AuthContext'
import { 
    Card, Button, Typography, Space, Empty, 
    Modal, Form, Input, Select, Tag, Popconfirm, Divider
} from 'antd'
import {
    MapPin, Plus, Home, Briefcase, 
    Trash2, Edit3, CheckCircle, ArrowRight,
    Globe, Phone, User as UserIcon, Building
} from 'lucide-react'
import toast from 'react-hot-toast'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault }) => (
    <Card 
        className={`border-none shadow-sm rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:shadow-md ${isDefault ? 'bg-white border-coral/20' : 'bg-gray-50/50'}`}
        styles={{ body: { padding: 0 } }}
    >
        <div className="p-8">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDefault ? 'bg-coral text-white shadow-lg shadow-coral/20' : 'bg-white text-gray-400'}`}>
                    {address.label === 'Home' ? <Home size={20} /> : 
                     address.label === 'Office' ? <Briefcase size={20} /> : <MapPin size={20} />}
                </div>
                {isDefault && (
                    <Tag color="success" className="m-0 font-black uppercase text-[9px] px-3 py-1 rounded-full border-none tracking-widest shadow-lg shadow-emerald-50">
                        Primary Address
                    </Tag>
                )}
            </div>

            <div className="space-y-4 mb-8">
                <div>
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Full Name</Text>
                    <Text className="text-sm font-black text-gray-900">{address.name}</Text>
                </div>
                <div>
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contact Details</Text>
                    <Text className="text-xs font-bold text-gray-600 flex items-center gap-2">
                        <Phone size={12} className="text-coral" /> {address.phone}
                    </Text>
                </div>
                <div>
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Physical Location</Text>
                    <Text className="text-xs font-medium text-gray-500 leading-relaxed block">
                        {address.street}, {address.city}<br />
                        {address.province}, Pakistan
                    </Text>
                </div>
            </div>

            <Divider className="my-6 border-gray-100" />

            <div className="flex items-center justify-between">
                <Space>
                    <Button 
                        type="text" 
                        icon={<Edit3 size={14} />} 
                        onClick={() => onEdit(address)}
                        className="text-gray-400 hover:text-coral font-bold text-[10px] uppercase tracking-widest p-0"
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Address?"
                        description="This action cannot be undone."
                        onConfirm={() => onDelete(address._id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true, className: 'rounded-lg' }}
                        cancelButtonProps={{ className: 'rounded-lg' }}
                    >
                        <Button 
                            type="text" 
                            icon={<Trash2 size={14} />} 
                            className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest p-0"
                        >
                            Remove
                        </Button>
                    </Popconfirm>
                </Space>
                {!isDefault && (
                    <Button 
                        type="link" 
                        onClick={() => onSetDefault(address._id)}
                        className="text-coral font-black text-[10px] uppercase tracking-widest p-0"
                    >
                        Set Primary
                    </Button>
                )}
            </div>
        </div>
    </Card>
)

const UserAddresses = () => {
    const { user, updateProfile } = useContext(AuthContext)
    const [addresses, setAddresses] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState(null)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    useEffect(() => {
        if (user?.addresses) {
            setAddresses(user.addresses)
        }
    }, [user])

    const handleAdd = () => {
        setEditingAddress(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const handleEdit = (addr) => {
        setEditingAddress(addr)
        form.setFieldsValue(addr)
        setIsModalOpen(true)
    }

    const onFinish = async (values) => {
        setLoading(true)
        try {
            let newAddresses = [...addresses]
            if (editingAddress) {
                newAddresses = addresses.map(a => a._id === editingAddress._id ? { ...a, ...values } : a)
            } else {
                newAddresses.push({ ...values, _id: Date.now().toString() }) // Temporary ID for frontend
            }

            const result = await updateProfile({ addresses: newAddresses })
            if (result.success) {
                toast.success(editingAddress ? 'Address updated!' : 'Address added!')
                setIsModalOpen(false)
            } else {
                toast.error(result.error || 'Failed to save address')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        const newAddresses = addresses.filter(a => a._id !== id)
        const result = await updateProfile({ addresses: newAddresses })
        if (result.success) toast.success('Address removed')
    }

    const handleSetDefault = async (id) => {
        const newAddresses = addresses.map(a => ({ ...a, isDefault: a._id === id }))
        const result = await updateProfile({ addresses: newAddresses })
        if (result.success) toast.success('Primary address updated')
    }

    return (
        <UserLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <Title level={2} className="m-0 font-black tracking-tight italic">Logistic <span className="text-coral">Center</span></Title>
                        <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px] block mt-1">Manage your premium delivery destinations</Text>
                    </div>
                    <Button 
                        type="primary" 
                        icon={<Plus size={18} />} 
                        onClick={handleAdd}
                        className="bg-gray-900 border-none rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-gray-200 hover:scale-105 transition-all"
                    >
                        Add New Destination
                    </Button>
                </div>

                {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {addresses.map(addr => (
                            <AddressCard
                                key={addr._id}
                                address={addr}
                                isDefault={addr.isDefault}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onSetDefault={handleSetDefault}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden py-32 text-center bg-gray-50/30">
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <div className="mt-6 max-w-sm mx-auto">
                                    <Text className="text-xl font-black text-gray-900 block tracking-tight">No Destinations Found</Text>
                                    <Text className="text-gray-400 font-medium text-sm mt-2 block">
                                        Add your home or office address to ensure a lightning-fast checkout experience for your next artisan treasure.
                                    </Text>
                                    <Button 
                                        type="primary" 
                                        className="bg-coral border-none rounded-2xl h-12 px-8 mt-8 font-black uppercase text-[9px] tracking-widest shadow-lg shadow-coral/20"
                                        onClick={handleAdd}
                                    >
                                        Add Your First Address
                                    </Button>
                                </div>
                            }
                        />
                    </Card>
                )}

                {/* Info Card */}
                <div className="mt-16 bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row items-center gap-10 group">
                    <div className="w-20 h-20 bg-[#FC6A6B]/10 rounded-[2rem] flex items-center justify-center text-[#FC6A6B] shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                        <Globe size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <Title level={4} className="m-0 font-black tracking-tight uppercase mb-1 italic">Verified <span className="text-coral">Logistics</span></Title>
                        <Paragraph className="text-gray-400 text-sm font-medium m-0 leading-relaxed">
                            Homedify uses intelligent geocoding to verify artisan shipping routes. Ensure your address details are accurate to receive your handcrafted treasures without delay.
                        </Paragraph>
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            <Modal
                title={editingAddress ? "Update Destination" : "New Destination"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={600}
                className="premium-modal"
                styles={{ content: { borderRadius: '32px', padding: '40px' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="mt-8"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="label" label="Address Label" className="col-span-2" rules={[{ required: true }]}>
                            <Select className="premium-select">
                                <Option value="Home">Home</Option>
                                <Option value="Office">Office</Option>
                                <Option value="Studio">Studio</Option>
                                <Option value="Other">Other</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="name" label="Receiver Name" className="col-span-2" rules={[{ required: true }]}>
                            <Input className="premium-input" placeholder="e.g. Haider Sultan" />
                        </Form.Item>
                        <Form.Item name="phone" label="Contact Number" rules={[{ required: true }]}>
                            <Input className="premium-input" placeholder="03XXXXXXXXX" />
                        </Form.Item>
                        <Form.Item name="city" label="City" rules={[{ required: true }]}>
                            <Input className="premium-input" />
                        </Form.Item>
                        <Form.Item name="street" label="Street Address" className="col-span-2" rules={[{ required: true }]}>
                            <Input.TextArea rows={3} className="premium-input" placeholder="House #, Street, Area..." />
                        </Form.Item>
                        <Form.Item name="province" label="Province" className="col-span-2" rules={[{ required: true }]}>
                            <Select className="premium-select">
                                <Option value="Punjab">Punjab</Option>
                                <Option value="Sindh">Sindh</Option>
                                <Option value="KPK">KPK</Option>
                                <Option value="Balochistan">Balochistan</Option>
                                <Option value="Gilgit Baltistan">Gilgit Baltistan</Option>
                                <Option value="AJK">AJK</Option>
                                <Option value="Islamabad">Islamabad</Option>
                            </Select>
                        </Form.Item>
                    </div>
                    <div className="mt-8 flex gap-4">
                        <Button className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-gray-100" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading} className="flex-[2] h-14 bg-coral border-none rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-coral/20">
                            {editingAddress ? 'Update Destination' : 'Save Destination'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <style>{`
                .premium-input {
                    border-radius: 16px !important;
                    padding: 12px 20px !important;
                    border: 1px solid #F1F5F9 !important;
                    font-weight: 700 !important;
                    font-size: 13px !important;
                }
                .premium-select .ant-select-selector {
                    border-radius: 16px !important;
                    height: 50px !important;
                    display: flex !important;
                    align-items: center !important;
                    border: 1px solid #F1F5F9 !important;
                }
                .premium-modal .ant-modal-title {
                    font-size: 20px !important;
                    font-weight: 900 !important;
                    letter-spacing: -0.02em !important;
                    font-style: italic !important;
                }
            `}</style>
        </UserLayout>
    )
}

export default UserAddresses
