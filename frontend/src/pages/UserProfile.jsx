import React, { useState, useContext, useEffect } from 'react'
import UserLayout from '../shared/UserLayout'
import { AuthContext } from '../context/AuthContext'
import { 
    Card, Form, Input, Button, Avatar, 
    Typography, Divider, Badge, Select, Upload, Row, Col, Tag
} from 'antd'
import {
    User, Lock, MapPin, Save, Banknote, Edit, Mail, Phone, Info, CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

const { Title, Text, Paragraph } = Typography

const UserProfile = () => {
    const { user, updateProfile } = useContext(AuthContext)
    const [loading, setLoading] = useState(false)
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    
    const [form] = Form.useForm()

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                contactNumber: user.contactNumber,
                address: user.address?.street || '',
                paymentMethod: user.refundDetails?.paymentMethod || 'EasyPaisa',
                accountHolderName: user.refundDetails?.accountHolderName || '',
                accountNumber: user.refundDetails?.accountNumber || ''
            })
            if (user.picture) {
                setAvatarPreview(getMediaUrl(user.picture))
            }
        }
    }, [user, form])

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
        setLoading(true)
        const formData = new FormData();
        
        formData.append('name', values.name);
        formData.append('contactNumber', values.contactNumber || '');
        formData.append('address[street]', values.address || '');
        formData.append('refundDetails[paymentMethod]', values.paymentMethod);
        formData.append('refundDetails[accountHolderName]', values.accountHolderName);
        formData.append('refundDetails[accountNumber]', values.accountNumber);

        if (values.currentPassword && values.newPassword) {
            formData.append('currentPassword', values.currentPassword);
            formData.append('newPassword', values.newPassword);
        }

        if (avatarFile) {
            formData.append('profileImage', avatarFile);
        }

        const result = await updateProfile(formData)
        setLoading(false)

        if (result.success) {
            toast.success('Account settings updated successfully!')
            form.setFieldValue('currentPassword', '')
            form.setFieldValue('newPassword', '')
            form.setFieldValue('confirmPassword', '')
            if (result.data?.picture) {
                setAvatarPreview(getMediaUrl(result.data.picture))
            }
        } else {
            toast.error(result.error || 'Update failed')
        }
    }

    return (
        <UserLayout>
            <div className="animate-in fade-in duration-700 max-w-4xl mx-auto pb-20 profile-page-container">
                {/* Simple Header */}
                <div className="mb-12 header-title-section">
                    <Title level={2} className="m-0 font-black uppercase tracking-tight">
                        Account <span style={{ color: '#FF6B6B' }}>Settings</span>
                    </Title>
                    <Text type="secondary" className="text-sm font-medium">Manage your personal information, security and payout methods.</Text>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
                    {/* Identity Card */}
                    <Card className="profile-card shadow-sm border-gray-100 rounded-xl">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="relative">
                                <Avatar size={80} src={avatarPreview} className="bg-gray-100 border border-gray-200">
                                    {user?.name?.charAt(0)}
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
                                        className="absolute -bottom-1 -right-1 bg-white shadow-md border-gray-100"
                                    />
                                </Upload>
                            </div>
                            <div>
                                <Title level={4} className="m-0">{user?.name}</Title>
                                <div className="flex items-center gap-2 mt-1">
                                    <Tag color="blue" className="rounded-full border-none px-3 text-[10px] font-bold uppercase">Customer</Tag>
                                    <Text className="text-gray-400 text-xs italic">Member since {new Date(user?.createdAt).getFullYear()}</Text>
                                </div>
                            </div>
                        </div>

                        <Divider className="my-6" />

                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <Form.Item 
                                    name="name" 
                                    label="Full Name" 
                                    rules={[
                                        { required: true, message: 'Please enter your name' },
                                        { min: 3, message: 'Name must be at least 3 characters' }
                                    ]} 
                                    className="mb-6"
                                >
                                    <Input placeholder="Your name" className="h-11 rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="email" label="Email Address" className="mb-6">
                                    <Input className="h-11 rounded-lg bg-gray-50" readOnly />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item 
                                    name="contactNumber" 
                                    label="Phone Number" 
                                    rules={[
                                        { required: true, message: 'Please enter your phone number' },
                                        { pattern: /^03[0-9]{9}$/, message: 'Enter a valid Pakistani number (e.g. 03123456789)' }
                                    ]}
                                    className="mb-0"
                                >
                                    <Input placeholder="03XXXXXXXXX" className="h-11 rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Security Card */}
                    <Card className="profile-card shadow-sm border-gray-100 rounded-xl" title={<span className="text-sm font-bold flex items-center gap-2"><Lock size={16} /> Security Settings</span>}>
                        <Row gutter={[24, 24]}>
                            <Col span={24}>
                                <Form.Item 
                                    name="currentPassword" 
                                    label="Current Password" 
                                    dependencies={['newPassword']}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (getFieldValue('newPassword') && !value) {
                                                    return Promise.reject(new Error('Current password is required to set a new password'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                    className="mb-6"
                                >
                                    <Input.Password placeholder="Required to change password" className="h-11 rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item 
                                    name="newPassword" 
                                    label="New Password" 
                                    rules={[
                                        { min: 8, message: 'Password must be at least 8 characters' }
                                    ]}
                                    className="mb-0"
                                >
                                    <Input.Password placeholder="Min 8 characters" className="h-11 rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item 
                                    name="confirmPassword" 
                                    label="Confirm Password" 
                                    dependencies={['newPassword']}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Passwords do not match'));
                                            },
                                        }),
                                    ]}
                                    className="mb-0"
                                >
                                    <Input.Password placeholder="Repeat new password" className="h-11 rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Logistics Card */}
                    <Card className="profile-card shadow-sm border-gray-100 rounded-xl" title={<span className="text-sm font-bold flex items-center gap-2"><MapPin size={16} /> Shipping Address</span>}>
                        <Form.Item 
                            name="address" 
                            label="Default Address" 
                            rules={[{ required: true, message: 'Please provide your shipping address' }]} 
                            className="mb-0"
                        >
                            <Input placeholder="Full shipping address" className="h-11 rounded-lg" />
                        </Form.Item>
                    </Card>

                    {/* Financial Card */}
                    <Card className="profile-card shadow-sm border-gray-100 rounded-xl" title={<span className="text-sm font-bold flex items-center gap-2"><Banknote size={16} /> Payout Details</span>}>
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <Form.Item name="paymentMethod" label="Method" rules={[{ required: true, message: 'Select payout method' }]} className="mb-6">
                                    <Select className="h-11 w-full" placeholder="Select method">
                                        <Select.Option value="EasyPaisa">EasyPaisa</Select.Option>
                                        <Select.Option value="JazzCash">JazzCash</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="accountHolderName" label="Holder Name" rules={[{ required: true, message: 'Enter account holder name' }]} className="mb-6">
                                    <Input placeholder="Name on account" className="h-11 rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item 
                                    name="accountNumber" 
                                    label="Account Number" 
                                    rules={[
                                        { required: true, message: 'Enter account or phone number' },
                                        { pattern: /^[0-9]+$/, message: 'Account number must contain only digits' }
                                    ]} 
                                    className="mb-0"
                                >
                                    <Input prefix={<CreditCard size={18} className="text-gray-400 mr-2" />} className="h-11 rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Action Footer */}
                    <div className="flex justify-end gap-4 mt-12">
                        <Button className="h-11 px-8 rounded-lg font-bold">Discard</Button>
                        <Button 
                            type="primary" 
                            onClick={() => form.submit()} 
                            loading={loading}
                            className="h-11 px-10 rounded-lg font-bold bg-coral border-none shadow-md hover:opacity-90"
                        >
                            Save Settings
                        </Button>
                    </div>
                </Form>
            </div>

            <style>{`
                .profile-card {
                    margin-bottom: 40px !important;
                }
                .ant-card-head {
                    border-bottom: 1px solid #f8fafc !important;
                    padding: 0 24px !important;
                    min-height: 56px !important;
                }
                .ant-card-body {
                    padding: 32px 24px !important;
                }
                .ant-form-item-label label {
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    color: #64748B !important;
                }
                .header-title-section {
                    margin-bottom: 48px !important;
                }
            `}</style>
        </UserLayout>
    )
}

export default UserProfile
