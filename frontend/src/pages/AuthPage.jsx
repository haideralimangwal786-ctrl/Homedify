import React, { useState, useContext, useEffect } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, LogIn,
  UserPlus, User, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Loader2
} from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const AuthPage = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login')
  const { login, user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Where to go after login: back to the page that triggered the redirect, or role-based home
  const from = location.state?.from
  const getRedirectPath = (role) => {
    if (from) return from
    if (role === 'admin') return '/admin'
    if (role === 'seller') return '/seller/dashboard'
    return '/'
  }

  // --- LOGIN STATE ---
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // --- REGISTER STATE ---
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'customer', termsAccepted: false
  })
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  
  // --- EMAIL CHECK STATE ---
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState(null) // null, true, or false
  const [emailCheckMsg, setEmailCheckMsg] = useState('')
  const [isInvalidFormat, setIsInvalidFormat] = useState(false)

  // --- FORGOT PASSWORD STATE ---
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [showForgotPwd, setShowForgotPwd] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(getRedirectPath(user.role), { replace: true })
  }, [user, navigate])

  // Debounced Email Check
  useEffect(() => {
    const checkEmailAvailability = async () => {
      const email = regForm.email
      if (!email || isLogin) {
        setEmailAvailable(null)
        setEmailCheckMsg('')
        setIsInvalidFormat(false)
        return
      }

      // Basic regex check before hitting API
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(email)) {
        setEmailAvailable(false)
        setEmailCheckMsg('Invalid email format')
        setIsInvalidFormat(true)
        return
      }

      setIsInvalidFormat(false)
      setEmailChecking(true)
      try {
        const res = await axios.post('/api/v1/auth/check-email', { email })
        if (res.data.exists) {
          setEmailAvailable(false)
          setEmailCheckMsg('Email already taken')
        } else {
          setEmailAvailable(true)
          setEmailCheckMsg('Email is available')
        }
      } catch (err) {
        if (err.response?.data?.invalidFormat) {
          setEmailAvailable(false)
          setEmailCheckMsg('Invalid email format')
        } else if (err.response?.data?.isDisposable) {
          setEmailAvailable(false)
          setEmailCheckMsg('Fake/Temp email blocked')
        } else if (err.response?.data?.invalidDomain) {
          setEmailAvailable(false)
          setEmailCheckMsg('Real domain not found')
        } else {
          console.error('Email check failed', err)
          setEmailCheckMsg('Verification failed')
        }
      } finally {
        setEmailChecking(false)
      }
    }

    const timeoutId = setTimeout(() => {
      checkEmailAvailability()
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [regForm.email, isLogin])

  const toggleMode = () => {
    const newMode = !isLogin
    setIsLogin(newMode)
    // Update URL without unmounting to keep animation
    window.history.replaceState(null, '', newMode ? '/login' : '/register')
    // Clear errors when switching
    setLoginError('')
    setRegError('')
  }

  // --- HANDLERS ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginLoading(true)

    try {
      const res = await axios.post('/api/v1/auth/login', loginForm)
      const { token, user: loggedUser } = res.data

      toast.success('Welcome back!')
      login(token)
      navigate(getRedirectPath(loggedUser.role), { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoginLoading(false)
    }
  }

  const validateReg = () => {
    if (!regForm.name || !regForm.email || !regForm.password || !regForm.confirmPassword) {
      toast.error('All fields are required.')
      return false
    }
    
    // Strict email check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(regForm.email)) {
      toast.error('Please enter a valid email address (e.g. name@example.com)')
      return false
    }

    if (emailAvailable === false) {
      toast.error(emailCheckMsg || 'Please use a valid and available email.')
      return false
    }
    if (regForm.password !== regForm.confirmPassword) {
      toast.error('Passwords do not match.')
      return false
    }
    if (regForm.password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return false
    }
    if (!regForm.termsAccepted) {
      toast.error('You must accept the Terms & Conditions.')
      return false
    }
    return true
  }

  const handleResendVerification = async () => {
    try {
      await axios.post('/api/v1/auth/resend-verification', { email: regForm.email })
      toast.success('New verification link sent to your email.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend link.')
    }
  }

  const handleRegSubmit = async (e) => {
    e.preventDefault()
    if (!validateReg()) return

    setRegLoading(true)
    try {
      const res = await axios.post('/api/v1/auth/register', {
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        role: regForm.role
      })

      setRegSuccess(true)
      toast.success(res.data.message || 'Account created successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setRegLoading(false)
    }
  }

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        isLogin ? setLoginLoading(true) : setRegLoading(true)
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })

        const { name, email, sub: googleId, picture } = userInfo.data

        const res = await axios.post('/api/v1/auth/google-login', { name, email, googleId, picture })
        const { token, user: loggedUser } = res.data
        
        toast.success('Successfully logged in with Google!')
        login(token)
        navigate(getRedirectPath(loggedUser.role), { replace: true })
      } catch (err) {
        console.error('Google Login Error:', err)
        toast.error(err.response?.data?.message || 'Google Login failed.')
      } finally {
        isLogin ? setLoginLoading(false) : setRegLoading(false)
      }
    },
    onError: () => {
      toast.error('Google Login Failed')
    }
  })

  // --- FORGOT PASSWORD HANDLERS ---
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await axios.post('/api/v1/auth/forgot-password', { email: forgotEmail })
      setForgotStep(2)
      toast.success('OTP sent to your email.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setForgotLoading(false)
    }
  }
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await axios.post('/api/v1/auth/verify-reset-otp', { email: forgotEmail, otp: resetOtp })
      setForgotStep(3)
      toast.success('OTP verified! Please secure your account with a new password.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match')
      return;
    }
    setForgotLoading(true)
    try {
      await axios.post('/api/v1/auth/reset-password', { email: forgotEmail, otp: resetOtp, newPassword })
      toast.success('Password reset successfully! Please login.')
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotEmail('')
        setResetOtp('')
        setNewPassword('')
        setConfirmNewPassword('')
      }, 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-coral/20 selection:text-coral-dark">
      
      {/* Premium Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[5%] w-[50%] h-[50%] bg-gradient-to-br from-coral/10 via-rose-300/10 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[0%] -right-[5%] w-[50%] h-[50%] bg-gradient-to-tl from-coral/10 via-orange-300/10 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-gradient-to-t from-rose-200/20 to-transparent rounded-full blur-[120px]" />
      </div>

      {/* Elegant Back to Home Pill - Wrapped in relative div to prevent overlap */}
      <div className="w-full max-w-[1000px] px-4 pt-6 md:pt-8 z-50 flex items-start">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 bg-white/70 hover:bg-white backdrop-blur-xl px-5 py-2.5 rounded-full border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(255,107,107,0.15)] hover:text-coral transition-all duration-300 font-bold group active:scale-95">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> <span className="text-sm">Back to Home</span>
        </Link>
      </div>

      <main className="w-full flex-1 flex items-center justify-center p-4 relative z-10 perspective-1000">
        
        {/* Animated Glow Behind Container */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] max-w-[1050px] h-[750px] bg-gradient-to-r from-coral/20 via-rose-300/20 to-orange-300/20 rounded-[2rem] blur-2xl animate-[spin_10s_linear_infinite] opacity-50 z-0"></div>

        {/* Main Sliding Container (Ultra Premium) */}
        <div className="relative w-full max-w-[1000px] min-h-0 md:min-h-[700px] bg-white/80 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05),0_0_80px_-10px_rgba(255,107,107,0.15)] mx-auto z-10 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05),0_0_80px_-10px_rgba(255,107,107,0.2)]">
          
          {/* SIGN IN FORM SECTION */}
          <div className={`w-full md:w-1/2 min-h-[550px] md:h-full transition-all duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] flex flex-col justify-center px-6 md:px-12 z-10 ${
            isLogin 
              ? 'opacity-100 translate-x-0 relative md:absolute top-0 left-0 pointer-events-auto' 
              : 'opacity-0 translate-x-[-20%] absolute top-0 left-0 pointer-events-none'
          }`}>
            <div className="max-w-md w-full mx-auto">
              <div className="mb-10 text-center relative">
                <div className="w-16 h-16 mt-[10px] bg-gradient-to-br from-coral/10 to-rose-400/10 text-coral rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12 transition-transform hover:rotate-0 duration-500 shadow-sm border border-coral/5">
                  <LogIn size={32} />
                </div>
                <h1 className="text-2xl md:text-[2rem] font-black text-gray-900 mb-2 tracking-tight">Welcome Back</h1>
                <p className="text-gray-500 font-medium text-xs md:text-sm">Sign in to your Homedify account</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300">
                      <Mail size={20} />
                    </div>
                    <input id="login-email" name="login-email" type="email" required placeholder="name@example.com"
                      value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-coral/10 focus:border-coral outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 font-semibold shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center pl-2 pr-2">
                    <label htmlFor="login-password" className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                    <button type="button" onClick={() => setShowForgotModal(true)} className="text-[11px] font-black uppercase text-coral hover:text-coral-dark transition-colors">Forgot Password?</button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300">
                      <Lock size={20} />
                    </div>
                    <input id="login-password" name="login-password" type={showLoginPassword ? 'text' : 'password'} required placeholder="••••••••"
                      value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-coral/10 focus:border-coral outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 font-semibold shadow-sm"
                    />
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button disabled={loginLoading} className="w-full py-5 bg-coral text-white hover:bg-coral-dark rounded-2xl font-black text-xl transition-all shadow-xl shadow-coral/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 mt-2 disabled:transform-none">
                  {loginLoading ? 'Authenticating...' : 'Sign In'}
                  {!loginLoading && <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-full border-t border-gray-100"></div>
                  <span className="bg-white px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest relative">Or continue with</span>
                </div>
                <button type="button" onClick={() => googleLoginHandler()} className="mt-5 w-full flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-gray-300 transition-all font-bold text-gray-700 active:scale-[0.98] group">
                  <div className="bg-white p-1 rounded-lg group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  </div>
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>

          {/* SIGN UP FORM SECTION */}
          <div className={`w-full md:w-1/2 min-h-[600px] md:h-full transition-all duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] flex flex-col justify-center px-6 md:px-12 z-10 ${
            !isLogin 
              ? 'opacity-100 translate-x-0 relative md:absolute top-0 right-0 pointer-events-auto' 
              : 'opacity-0 translate-x-[20%] absolute top-0 right-0 pointer-events-none'
          }`}>
            <div className="max-w-md w-full mx-auto">
              {regSuccess ? (
                <div className="text-center py-10">
                  <div className="w-24 h-24 bg-coral/10 text-coral rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                    <Mail size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Check Your Email</h2>
                  <p className="text-gray-500 font-medium leading-relaxed mb-10">
                    We've sent a verification link to <span className="text-coral font-bold">{regForm.email}</span>. 
                    Please click the link to activate your account.
                  </p>
                  <div className="space-y-4">
                    <button 
                      onClick={handleResendVerification} 
                      className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all"
                    >
                      Resend Link
                    </button>
                    <button 
                      onClick={() => { setIsLogin(true); setRegSuccess(false); }} 
                      className="w-full py-4 bg-coral text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-coral/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Go to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <div className="w-16 h-16 mt-[10px] bg-coral/10 text-coral rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-12 transition-transform hover:rotate-0 duration-300">
                      <UserPlus size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-1">Create Account</h1>
                    <p className="text-gray-500 font-medium text-xs">Join us to explore the future of home decor</p>
                  </div>

                  <form onSubmit={handleRegSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="reg-name" className="text-[11px] font-black uppercase text-gray-400 tracking-widest pl-2">Full Name</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300"><User size={18}/></div>
                          <input id="reg-name" name="reg-name" type="text" required placeholder="John Doe" value={regForm.name} onChange={e=>setRegForm({...regForm, name: e.target.value})} className="w-full pl-9 pr-3 py-3.5 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-coral/10 focus:border-coral outline-none transition-all duration-300 text-sm font-semibold text-gray-900 placeholder-gray-400 shadow-sm"/>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="reg-email" className="text-[11px] font-black uppercase text-gray-400 tracking-widest pl-2">Email</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300"><Mail size={18}/></div>
                          <input id="reg-email" name="reg-email" type="email" required placeholder="name@email.com" value={regForm.email} onChange={e=>setRegForm({...regForm, email: e.target.value})} className={`w-full pl-9 pr-10 py-3.5 bg-gray-50/50 hover:bg-white border ${emailAvailable === false ? 'border-red-400 focus:border-red-500' : emailAvailable === true ? 'border-green-400 focus:border-green-500' : 'border-gray-200 focus:border-coral'} rounded-2xl focus:bg-white focus:ring-4 ${emailAvailable === false ? 'focus:ring-red-100' : emailAvailable === true ? 'focus:ring-green-100' : 'focus:ring-coral/10'} outline-none transition-all duration-300 text-sm font-semibold text-gray-900 placeholder-gray-400 shadow-sm`}/>
                          
                          {/* Availability Indicators */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                            {emailChecking && <Loader2 className="animate-spin text-gray-400" size={16} />}
                            {!emailChecking && emailAvailable === true && <CheckCircle2 className="text-green-500" size={16} />}
                            {!emailChecking && emailAvailable === false && <AlertCircle className="text-red-500" size={16} />}
                          </div>
                        </div>
                        {/* Status Message */}
                        {emailCheckMsg && (
                          <p className={`text-[10px] font-bold mt-1 pl-2 uppercase tracking-tighter ${emailAvailable === true ? 'text-green-600' : 'text-red-500'}`}>
                            {emailCheckMsg}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="reg-password" className="text-[11px] font-black uppercase text-gray-400 tracking-widest pl-2">Password</label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300"><Lock size={18}/></div>
                        <input id="reg-password" name="reg-password" type={showRegPassword ? 'text' : 'password'} required placeholder="••••••••" value={regForm.password} onChange={e=>setRegForm({...regForm, password: e.target.value})} className="w-full pl-9 pr-9 py-3.5 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-coral/10 focus:border-coral outline-none transition-all duration-300 text-sm font-semibold text-gray-900 placeholder-gray-400 shadow-sm"/>
                        <button type="button" onClick={()=>setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {showRegPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="reg-confirm-password" className="text-[11px] font-black uppercase text-gray-400 tracking-widest pl-2">Confirm Password</label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300"><ShieldCheck size={18}/></div>
                        <input id="reg-confirm-password" name="reg-confirm-password" type={showRegPassword ? 'text' : 'password'} required placeholder="••••••••" value={regForm.confirmPassword} onChange={e=>setRegForm({...regForm, confirmPassword: e.target.value})} className="w-full pl-9 pr-9 py-3.5 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-coral/10 focus:border-coral outline-none transition-all duration-300 text-sm font-semibold text-gray-900 placeholder-gray-400 shadow-sm"/>
                        <button type="button" onClick={()=>setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {showRegPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 pl-1">
                      <input id="reg-terms-accepted" name="reg-terms-accepted" type="checkbox" required checked={regForm.termsAccepted} onChange={e=>setRegForm({...regForm, termsAccepted: e.target.checked})} className="w-4 h-4 rounded mt-0.5 accent-coral cursor-pointer border-gray-200" />
                      <label htmlFor="reg-terms-accepted" className="text-xs font-bold text-gray-500 cursor-pointer">I agree to the Terms & Privacy</label>
                    </div>

                    <button disabled={regLoading || emailChecking || emailAvailable === false} className="w-full py-4 bg-coral text-white hover:bg-coral-dark rounded-xl font-black uppercase tracking-wider transition-all shadow-xl shadow-coral/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 mt-2 disabled:transform-none">
                      {regLoading ? 'Creating...' : 'Sign Up Now'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* SLIDING OVERLAY PANEL (Ultra Premium Gradient) */}
          <div className={`absolute top-0 left-0 w-1/2 h-full z-20 transition-all duration-[800ms] ease-[cubic-bezier(0.645,0.045,0.355,1)] hidden md:block ${
            isLogin ? 'translate-x-[100%]' : 'translate-x-0'
          }`}
               style={{
                 /* Diagonal cut */
                 clipPath: isLogin 
                   ? 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' 
                   : 'polygon(0 0, 85% 0, 100% 100%, 0 100%)'
               }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] via-[#ff5f6d] to-[#ffc371] opacity-95" />
            <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-gradient-to-tl from-white/10 to-transparent animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-black/5 backdrop-blur-3xl" />
            
            <div className="absolute inset-0 flex items-center justify-center p-12 text-center overflow-hidden">
               {/* Decorative floating geometry inside panel */}
               <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/20 hover:bg-white/30 transition-colors duration-700 rounded-full blur-[80px]" />
               <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 hover:bg-white/20 transition-colors duration-700 rounded-full blur-[60px]" />
               
               {/* Tiny sharp accents */}
               <div className="absolute top-[20%] right-[15%] w-10 h-10 border-[3px] border-white/20 rounded-xl rotate-12" />
               <div className="absolute bottom-[25%] left-[15%] w-6 h-6 bg-white/30 rounded-full blur-[2px]" />

               <div className={`transition-all duration-700 absolute inset-0 flex flex-col items-center justify-center px-10 ease-in-out ${isLogin ? 'opacity-100 translate-x-0 delay-300' : 'opacity-0 -translate-x-20 pointer-events-none'}`}>
                 <h2 className="text-[2.75rem] leading-tight font-black text-white drop-shadow-md mb-6 flex flex-col items-center gap-2 mt-[10px]">
                   <UserPlus className="text-white drop-shadow-lg" size={40} /> <span>Welcome!</span>
                 </h2>
                 <p className="text-white/95 mb-10 text-lg max-w-sm font-medium drop-shadow-sm">Join Homedify to discover unique home-based products today.</p>
                 <button onClick={toggleMode} className="py-4 px-12 border-2 border-white/90 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-white hover:text-coral transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.6)] hover:-translate-y-1 active:scale-95">
                   Create Account
                 </button>
               </div>

               <div className={`transition-all duration-700 absolute inset-0 flex flex-col items-center justify-center px-10 ease-in-out ${!isLogin ? 'opacity-100 translate-x-0 delay-300' : 'opacity-0 translate-x-20 pointer-events-none'}`}>
                 <h2 className="text-[2.75rem] leading-tight font-black text-white drop-shadow-md mb-6 flex flex-col items-center gap-2 mt-[10px]">
                   <LogIn className="text-white drop-shadow-lg" size={40} /> <span>Welcome Back!</span>
                 </h2>
                 <p className="text-white/95 mb-10 text-lg max-w-sm font-medium drop-shadow-sm">To stay connected with us, please login with your personal info.</p>
                 <button onClick={toggleMode} className="py-4 px-12 border-2 border-white/90 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-white hover:text-coral transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.6)] hover:-translate-y-1 active:scale-95">
                   Sign In
                 </button>
               </div>
            </div>
          </div>
          
          {/* MOBILE TOGGLE */}
          <div className="w-full text-center md:hidden z-30 pb-10 px-6">
            <div className="h-px bg-gray-100 w-full mb-6 opacity-50" />
            {isLogin ? (
              <div className="space-y-4">
                <p className="text-gray-500 font-bold text-sm">Don't have an account?</p>
                <button 
                  onClick={toggleMode} 
                  className="w-full py-4 border-2 border-coral text-coral rounded-2xl font-black uppercase tracking-wider hover:bg-coral hover:text-white transition-all active:scale-95"
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 font-bold text-sm">Already have an account?</p>
                <button 
                  onClick={toggleMode} 
                  className="w-full py-4 border-2 border-coral text-coral rounded-2xl font-black uppercase tracking-wider hover:bg-coral hover:text-white transition-all active:scale-95"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowForgotModal(false)} />
          <div className="bg-white rounded-[1.5rem] p-10 shadow-2xl w-full max-w-md relative z-10 animate-fade-in-up">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Recover Password</h3>
            <p className="text-gray-500 text-sm mb-6">{
              forgotStep === 1 ? "Enter your email to receive an OTP." : 
              forgotStep === 2 ? "Enter the 6-digit OTP sent to your email." : 
              "Create a strong new password."
            }</p>
            
            <form onSubmit={forgotStep === 1 ? handleSendOtp : forgotStep === 2 ? handleVerifyOtp : handleResetPassword} className="space-y-4">
              {forgotStep === 1 && (
                <>
                  <label htmlFor="forgot-email" className="sr-only">Email Address</label>
                  <input id="forgot-email" name="forgot-email" type="email" placeholder="Email Address" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none font-medium text-gray-900" />
                  <button type="submit" className="w-full py-4 bg-coral text-white font-bold rounded-2xl hover:bg-coral-dark transition-all shadow-xl shadow-coral/30">{forgotLoading ? 'Sending...' : 'Send OTP'}</button>
                </>
              )}
              {forgotStep === 2 && (
                <>
                  <div className="flex gap-2 justify-center mb-4">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const digit = resetOtp[index] || '';
                      return (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !/^\\d$/.test(val)) return;
                            
                            let arr = resetOtp.split('');
                            while(arr.length < 6) arr.push('');
                            arr[index] = val;
                            setResetOtp(arr.join(''));
                            
                            if (val && index < 5) {
                              document.getElementById(`otp-${index + 1}`)?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !digit && index > 0) {
                              document.getElementById(`otp-${index - 1}`)?.focus();
                            }
                          }}
                          onPaste={(e) => {
                            const pasted = e.clipboardData.getData('text').slice(0, 6).replace(/\\D/g, '');
                            if (pasted) {
                              setResetOtp(pasted);
                              if (pasted.length === 6) {
                                document.getElementById('otp-5')?.focus();
                              } else {
                                document.getElementById(`otp-${pasted.length}`)?.focus();
                              }
                            }
                            e.preventDefault();
                          }}
                          className="w-12 h-14 text-center text-xl font-black bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none text-gray-900 transition-all shadow-sm"
                        />
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setForgotStep(1)} className="w-full mb-3 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all text-sm group flex justify-center items-center gap-1"><ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Wrong Email? Go Back</button>
                  <button type="submit" disabled={resetOtp.length < 6} className="w-full py-4 bg-coral text-white font-bold rounded-2xl hover:bg-coral-dark transition-all shadow-xl shadow-coral/30 disabled:opacity-50 disabled:cursor-not-allowed">{forgotLoading ? 'Verifying...' : 'Verify OTP'}</button>
                </>
              )}
              {forgotStep === 3 && (
                <>
                  <div className="space-y-3">
                    <div className="relative group">
                      <label htmlFor="forgot-new-password" className="sr-only">New Password</label>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300">
                        <Lock size={20} />
                      </div>
                      <input id="forgot-new-password" name="forgot-new-password" type={showForgotPwd ? 'text' : 'password'} placeholder="New Password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none font-medium text-gray-900" />
                      <button type="button" aria-label="Toggle password visibility" onClick={() => setShowForgotPwd(!showForgotPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showForgotPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="relative group">
                      <label htmlFor="forgot-confirm-password" className="sr-only">Confirm New Password</label>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral transition-colors duration-300">
                        <ShieldCheck size={20} />
                      </div>
                      <input id="forgot-confirm-password" name="forgot-confirm-password" type={showForgotPwd ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} required className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none font-medium text-gray-900" />
                      <button type="button" aria-label="Toggle password visibility" onClick={() => setShowForgotPwd(!showForgotPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showForgotPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 py-4 bg-coral text-white font-bold rounded-2xl hover:bg-coral-dark transition-all shadow-xl shadow-coral/30">{forgotLoading ? 'Resetting...' : 'Set New Password'}</button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthPage
