import React, { useState, useContext, useEffect } from 'react'
import { Card, Form, Input, Button, Upload, Divider, Typography, Space } from 'antd'
import { User, Mail, Lock, Camera, Save, XCircle, AlertCircle } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const { Title, Text } = Typography

const AdminProfile = ({ onCancel }) => {
  const { user, token, logout, refreshUser } = useContext(AuthContext)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [fileList, setFileList] = useState([])

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
      })
      if (user.picture) {
          const filename = user.picture.split(/[\\/]/).pop()
          setImageUrl(`/uploads/${filename}`)
      }
    }
  }, [user, form])

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const filename = url.split(/[\\/]/).pop();
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    return `${backendUrl}/uploads/${filename}`;
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('email', values.email)
      
      if (values.newPassword) {
        formData.append('currentPassword', values.currentPassword)
        formData.append('newPassword', values.newPassword)
      }

      if (fileList.length > 0) {
        formData.append('profileImage', fileList[0].originFileObj)
      }

      const res = await api.put('/api/v1/users/admin/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (values.newPassword) {
          toast.success('Security updated! Please login again.')
          setTimeout(() => logout(), 2000)
      } else {
          toast.success('Profile updated successfully!')
          refreshUser()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)
    if (newFileList.length > 0) {
      const reader = new FileReader()
      reader.onload = (e) => setImageUrl(e.target.result)
      reader.readAsDataURL(newFileList[0].originFileObj)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card 
        className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-8 bg-gray-950 text-white text-center relative overflow-hidden">
           {/* Abstract Background */}
           <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-coral/20 rounded-full blur-3xl" />
           <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 bg-coral/10 rounded-full blur-3xl" />
           
           <div className="relative z-10 flex flex-col items-center">
              <div className="relative group mb-4">
                 <div className="w-32 h-32 rounded-full border-4 border-white/20 p-1 group-hover:border-coral transition-all duration-500 overflow-hidden bg-gray-900">
                    {imageUrl ? (
                      <img src={getFullUrl(imageUrl)} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                         <User size={48} />
                      </div>
                    )}
                 </div>
                 <Upload
                   showUploadList={false}
                   beforeUpload={() => false}
                   onChange={handleUploadChange}
                   className="absolute bottom-0 right-0"
                 >
                    <Button 
                      shape="circle" 
                      icon={<Camera size={16} />} 
                      className="bg-coral border-none text-white shadow-lg hover:scale-110 transition-all flex items-center justify-center" 
                    />
                 </Upload>
              </div>
              <Title level={3} className="m-0 text-white font-black tracking-tight uppercase text-xl">Admin Profile</Title>
              <Text className="text-gray-400 text-xs font-bold tracking-widest uppercase mt-1">Platform Control Center</Text>
           </div>
        </div>

        <div className="p-10">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="space-y-6"
          >
            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-coral" />
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Information</Text>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item 
                    name="name" 
                    label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</span>}
                    rules={[{ required: true, message: 'Please enter your name' }]}
                  >
                    <Input 
                      prefix={<User size={16} className="text-gray-400 mr-2" />} 
                      className="h-14 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 focus:bg-white transition-all font-bold text-gray-900"
                    />
                  </Form.Item>

                  <Form.Item 
                    name="email" 
                    label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</span>}
                    rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                  >
                    <Input 
                      prefix={<Mail size={16} className="text-gray-400 mr-2" />} 
                      className="h-14 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 focus:bg-white transition-all font-bold text-gray-900"
                    />
                  </Form.Item>
               </div>
            </div>

            <Divider className="border-gray-50 my-8" />

            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-coral" />
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security & Access</Text>
               </div>

               <Form.Item 
                 name="currentPassword" 
                 label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Current Password</span>}
                 extra={<Text className="text-[9px] text-gray-400 font-medium">Required only if changing password or email</Text>}
               >
                 <Input.Password 
                   prefix={<Lock size={16} className="text-gray-400 mr-2" />} 
                   className="h-14 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 focus:bg-white transition-all font-bold text-gray-900"
                   placeholder="••••••••"
                 />
               </Form.Item>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item 
                    name="newPassword" 
                    label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">New Password</span>}
                    rules={[{ min: 8, message: 'Password must be at least 8 characters' }]}
                  >
                    <Input.Password 
                      prefix={<Lock size={16} className="text-gray-400 mr-2" />} 
                      className="h-14 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 focus:bg-white transition-all font-bold text-gray-900"
                      placeholder="Enter new password"
                    />
                  </Form.Item>

                  <Form.Item 
                    name="confirmPassword" 
                    label={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Confirm New Password</span>}
                    dependencies={['newPassword']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('Passwords do not match'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<Lock size={16} className="text-gray-400 mr-2" />} 
                      className="h-14 rounded-2xl bg-gray-50 border-none hover:bg-gray-100 focus:bg-white transition-all font-bold text-gray-900"
                      placeholder="Confirm new password"
                    />
                  </Form.Item>
               </div>
            </div>

            <div className="pt-8 flex gap-4">
               <Button 
                 onClick={onCancel}
                 className="flex-1 h-14 rounded-2xl border-gray-100 text-gray-400 font-bold hover:text-gray-600 transition-all"
               >
                 Cancel
               </Button>
               <Button 
                 type="primary" 
                 htmlType="submit" 
                 loading={loading}
                 icon={<Save size={18} />}
                 className="flex-1 h-14 rounded-2xl bg-coral border-none shadow-xl shadow-coral/30 font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all flex items-center justify-center gap-2"
               >
                 Save Changes
               </Button>
            </div>
          </Form>
        </div>
      </Card>

      <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4">
         <AlertCircle size={24} className="text-amber-500 shrink-0" />
         <div>
            <Text className="text-xs font-black text-amber-700 uppercase tracking-widest block mb-1">Security Policy</Text>
            <Text className="text-[11px] text-amber-600/80 font-medium leading-relaxed">
               For your protection, changing your email or password will require immediate re-authentication. Homedify uses Bcrypt encryption to ensure your credentials remain hashed and private.
            </Text>
         </div>
      </div>
    </div>
  )
}

export default AdminProfile
