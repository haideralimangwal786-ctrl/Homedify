import React, { useState, useEffect, useContext, useRef, useCallback } from 'react'
import {
  ConfigProvider, Steps, Form, Input, Select, Button, Card, Row, Col,
  Typography, Divider, Alert, Checkbox, Upload, Space, Tag, Progress,
  Modal
} from 'antd'
import { toast } from 'react-hot-toast'
import {
  User, Mail, Lock, Phone, Store, Home, ArrowRight, ArrowLeft,
  CheckCircle, ShieldCheck, ShieldAlert, CreditCard, Camera, Upload as UploadIcon,
  Smile, Loader2, Wallet, LayoutGrid, IdCard, Palette, Soup, Building2, Banknote,
  ScanLine, UserCheck, AlertCircle, Fingerprint, ScanFace, RefreshCw, Info,
  Eye, FileText, Edit3
} from 'lucide-react'
import * as faceapi from '@vladmandic/face-api'
import { calculateHeadPose, CHALLENGES } from '../utils/livenessUtils'
import Webcam from 'react-webcam'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'
import cnicSampleImg from '../assets/cnic_sample.png'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { Step } = Steps

// â”€â”€â”€ Homedify Coral Theme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CORAL = '#FF6B6B'
const CORAL_DARK = '#ff5252'
const CORAL_LIGHT = '#fff5f5'
const CORAL_BORDER = '#ffcdd2'

const homedifyTheme = {
  token: {
    colorPrimary: CORAL,
    colorPrimaryHover: CORAL_DARK,
    colorPrimaryActive: CORAL_DARK,
    colorPrimaryBorder: CORAL_BORDER,
    colorPrimaryBg: CORAL_LIGHT,
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    colorBgContainer: '#ffffff',
    colorBorder: '#e5e7eb',
    controlHeight: 48,
    fontSize: 14,
  },
  components: {
    Button: {
      primaryColor: '#ffffff',
      colorPrimary: CORAL,
      colorPrimaryHover: CORAL_DARK,
      colorPrimaryActive: CORAL_DARK,
      borderRadius: 12,
      controlHeight: 48,
      fontWeight: 700,
    },
    Input: {
      colorPrimary: CORAL,
      activeBorderColor: CORAL,
      hoverBorderColor: CORAL,
      borderRadius: 12,
      controlHeight: 48,
    },
    Select: {
      colorPrimary: CORAL,
      colorPrimaryHover: CORAL,
      borderRadius: 12,
      controlHeight: 48,
    },
    Steps: {
      colorPrimary: CORAL,
      iconSize: 54,
    },
    Form: {
      labelColor: '#1F2937',
      labelFontSize: 13,
      verticalLabelPadding: '0 0 0',
      itemMarginBottom: 14,
    },
    Checkbox: {
      colorPrimary: CORAL,
    }
  }
}

// â”€â”€â”€ Sub-category tag options (Base Defaults) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CRAFT_TAGS = ['Home Decor', 'Jewelry', 'Embroidery', 'Crochet', 'Painting', 'Pottery', 'Candles', 'Gift Items']
const FOOD_TAGS  = ['Achaar', 'Masalay', 'Mithai', 'Biscuits', 'Dry Fruits', 'Herbal Tea', 'Snacks', 'Homemade Sauce']

// Additional dynamic categories will be merged from categoriesTree fetched from the backend

const SellerRegister = () => {
  const [step, setStep] = useState(0)          // AntD Steps is 0-indexed
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')
  const [categoriesTree, setCategoriesTree] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [passwordStrength, setPasswordStrength] = useState({ percent: 0, status: 'exception', text: '' })
  const [passwordValue, setPasswordValue] = useState('')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [form] = Form.useForm()
  const webcamRef = useRef(null)
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)

  // formData for non-AntD controlled fields (images, webcam)
  const [cnicImage, setCnicImage] = useState(null)
  const [cnicPreview, setCnicPreview] = useState(null)
  const [selfieImage, setSelfieImage] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [marketplace, setMarketplace] = useState('')
  const [ocrData, setOcrData] = useState({ name: '', cnic: '', gender: '', cnic_face_base64: '' })
  const [isScanning, setIsScanning] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [verificationReport, setVerificationReport] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)


  // â”€â”€â”€ Face Pre-Check State (Step 3 popup) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [faceCheckResult, setFaceCheckResult] = useState(null)   // { matched, confidence }
  const [faceChecking, setFaceChecking] = useState(false)
  const [showFacePopup, setShowFacePopup] = useState(false)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)

  // â”€â”€â”€ Liveness Detection State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [livenessStage, setLivenessStage] = useState(0)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [livenessStatus, setLivenessStatus] = useState({ message: 'Position face in frame', color: '#94A3B8' })
  const [cooldown, setCooldown] = useState(0)
  const isDetectingRef = useRef(false)   // prevents double detection loops
  const livenessStageRef = useRef(0)     // ref copy to read inside rAF loop
  const cooldownRef = useRef(0)          // ref copy to read inside rAF loop

  useEffect(() => {
    // 1. Fetch Categories
    api.get('/api/v1/categories/tree')
      .then(res => res.data.success && setCategoriesTree(res.data.data))
      .catch(() => {})

    // 2. Load Face API Models
    const loadModels = async () => {
      try {
        console.log('AI: Loading Face-API models...')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ])
        setModelsLoaded(true)
        console.log('AI: Models loaded successfully')
      } catch (err) {
        console.error('AI: Model load error:', err)
      }
    }
    loadModels()
  }, [])

  // â”€â”€ Webcam Capture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const captureSelfie = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        fetch(imageSrc)
          .then(r => r.blob())
          .then(blob => {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
            setSelfieImage(file)
            setSelfiePreview(imageSrc)
          })
      }
    }
  }, [setStep])

  // â”€â”€ Auto Face-Match when Selfie is captured â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!ocrData.cnic_face_base64 || !selfieImage) return;
    if (faceCheckResult !== null) return;

    const runFaceCheck = async () => {
      setFaceChecking(true);
      try {
        const formData = new FormData();
        formData.append('cnic_face_base64', ocrData.cnic_face_base64);
        formData.append('selfie_image', selfieImage);
        const res = await api.post('/api/v1/sellers/pre-check-face', formData, { timeout: 60000 });
        const d = res.data?.data || {};
        setFaceCheckResult({ matched: d.matched, confidence: d.confidence ?? 0 });
      } catch (err) {
        console.error('FaceCheck error:', err);
        setFaceCheckResult({ matched: null, confidence: 0, error: true });
      } finally {
        setFaceChecking(false);
        setShowFacePopup(true);
      }
    };
    runFaceCheck();
  }, [ocrData.cnic_face_base64, selfieImage, faceCheckResult]);

  // â”€â”€ Liveness Detection Loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Keep refs in sync with state so the rAF loop always reads current values
  useEffect(() => { livenessStageRef.current = livenessStage }, [livenessStage])
  useEffect(() => { cooldownRef.current = cooldown }, [cooldown])

  useEffect(() => {
    if (step !== 1 || !modelsLoaded) return;

    // Set up challenges once
    setActiveChallenges(prev => {
      if (prev.length > 0) return prev;
      return [...CHALLENGES].sort(() => 0.5 - Math.random()).slice(0, 2);
    });

    // Guard: one loop at a time
    if (isDetectingRef.current) return;
    isDetectingRef.current = true;

    let rafId;
    let isMounted = true;
    let capturing = false;

    const detect = async () => {
      if (!isMounted) return;

      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4 || !video.videoWidth || !video.videoHeight) {
        rafId = requestAnimationFrame(detect);
        return;
      }

      const stage = livenessStageRef.current;
      if (stage >= 3) {
        isDetectingRef.current = false;
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 }))
          .withFaceLandmarks();

        if (!isMounted) return;

        if (detection) {
          const landmarks = detection.landmarks;
          const leftEye  = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const nose     = landmarks.getNose();
          const box      = detection.detection.box;

          const { turnX, pitchY } = calculateHeadPose(leftEye, rightEye, nose, box);
          const now = Date.now();

          if (now < cooldownRef.current) {
            setLivenessStatus({ message: '[OK] Great! Keep going...', color: '#10B981' });
          } else if (stage < 2) {
            // Read challenges from state via a ref-captured value when effect ran
            setActiveChallenges(challenges => {
              if (challenges.length === 0) return challenges;
              const task = challenges[stage];
              let passed = false;

              // Mirrored webcam: user looks RIGHT â†' camera sees LEFT (turnX < 0.3)
              if (task.id === 'LOOK RIGHT' && turnX < 0.38) passed = true;
              else if (task.id === 'LOOK LEFT'  && turnX > 0.62) passed = true;
              else if (task.id === 'LOOK UP'    && pitchY < 0.45) passed = true;

              const label = `Step ${stage + 1}/2: ${task.instruction}`;
              setLivenessStatus({ message: label, color: CORAL });

              if (passed) {
                setLivenessStage(s => s + 1);
                setCooldown(Date.now() + 1200);
              }
              return challenges;
            });
          } else if (stage === 2) {
            // Center-look capture stage
            if (turnX > 0.35 && turnX < 0.65) {
              if (!capturing) {
                capturing = true;
                setLivenessStatus({ message: '[TARGET] Perfect! Capturing...', color: '#10B981' });
                setLivenessStage(3);
                setTimeout(() => { if (isMounted) captureSelfie(); }, 800);
              }
              return; // stop loop after capture triggered
            } else {
              setLivenessStatus({ message: 'Look straight at the camera', color: '#3B82F6' });
            }
          }
        } else {
          if (livenessStageRef.current < 2) {
            setLivenessStatus({ message: 'Move closer - Face not detected', color: '#94A3B8' });
          }
        }
      } catch (err) {
        console.warn('AI frame error:', err.message);
      }

      rafId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      isMounted = false;
      isDetectingRef.current = false;
      cancelAnimationFrame(rafId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, modelsLoaded]);

  const runOCRScan = async (file) => {
    const rawFile = file?.originFileObj || file;
    
    if (!rawFile) {
      console.warn('Scanner: No file object found');
      return;
    }

    setIsScanning(true)
    setOcrData({ name: '', cnic: '', gender: '', cnic_face_base64: '' })
    
    try {
      console.log('Scanner: Starting AI analysis...', rawFile.name);
      const scanForm = new FormData()
      scanForm.append('cnic_image', rawFile)
      
      const res = await api.post('/api/v1/sellers/scan-cnic', scanForm, { 
        timeout: 120000 
      })
      
      const ocrResults = res.data?.data?.ocrResults || {}
      console.log('Scanner: AI Response received:', ocrResults);
      
      if (!ocrResults.name || ocrResults.name === 'Unknown' || !ocrResults.cnic || ocrResults.cnic === 'Unknown') {
        const isFaceError = res.data?.data?.message?.toLowerCase().includes('face');
        const alertMsg = isFaceError ? 'No face detected. Please upload a clear photo.' : 'Invalid CNIC data detected. Try again.';
        
        setIsScanning(false)
        setCnicImage(null)
        setCnicPreview(null)
        toast.error(alertMsg)
        return
      }

      // --- CHECK IF CNIC ALREADY EXISTS ---
      try {
        const checkRes = await api.get(`/api/v1/sellers/check-cnic/${ocrResults.cnic}`);
        if (checkRes.data.exists) {
          toast.error('Your data is Already Exist');
          setIsScanning(false);
          setCnicImage(null);
          setCnicPreview(null);
          return;
        }
      } catch (checkErr) {
        console.error('Uniqueness check error:', checkErr);
      }

      setOcrData({
        name: ocrResults.name || 'Unknown',
        cnic: ocrResults.cnic || 'Unknown',
        gender: ocrResults.gender || 'Unknown',
        cnic_face_base64: ocrResults.cnic_face_base64 || ''
      })
      setIsScanning(false)
      setIsResultModalOpen(true)
    } catch (err) {
      setIsScanning(false)
      console.error('Scan Error:', err)
      toast.error('Scan failed. Please try again.')
    }
  }

  const handleCNICUpload = (info) => {
    const { status } = info.file;
    if (status === 'removed') return;

    // Use the originFileObj if available (standard for AntD)
    const file = info.file.originFileObj || info.file;
    if (file) {
      setCnicImage(file);
      // Create preview safely
      try {
        const previewUrl = URL.createObjectURL(file instanceof Blob ? file : info.file.originFileObj);
        setCnicPreview(previewUrl);
      } catch (e) {
        console.warn('Preview error:', e);
      }
      
      // Trigger scan logic
      runOCRScan(file);
    }
  }

  // â”€â”€ Tag Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const evaluatePassword = (value) => {
    setPasswordValue(value)
    if (!value) {
      setPasswordStrength({ percent: 0, status: 'exception', text: '' })
      return
    }

    let strength = 0
    if (value.length >= 8) strength += 25
    if (/[0-9]/.test(value)) strength += 25
    if (/[a-z]/.test(value)) strength += 25
    if (/[A-Z]/.test(value)) strength += 25
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strength += 25

    let status = 'exception'
    let text = 'Weak'
    let color = '#ff4d4f'

    if (strength > 75) {
      status = 'success'
      text = 'Strong'
      color = '#52c41a'
    } else if (strength > 40) {
      status = 'normal'
      text = 'Medium'
      color = '#faad14'
    }

    setPasswordStrength({ percent: strength, status, text, color })
  }

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.password !== values.confirmPassword) {
        form.setFields([{ name: 'confirmPassword', errors: ['Passwords do not match!'] }])
        return
      }
      if (!termsAccepted) {
        setApiError('Please accept terms & conditions to continue.')
        return
      }
      setLoading(true)
      setApiError('')

      const res = await api.post('/api/v1/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
        contactNumber: values.phone?.startsWith('0') ? values.phone : `0${values.phone}`,
        storeName: values.storeName,
        storeDescription: values.storeDescription,
        storeAddress: values.storeAddress,
        businessType: marketplace,
        subCategories: selectedTags,
        paymentMethod: values.paymentMethod,
        paymentAccountNumber: values.paymentAccountNumber,
        role: 'seller'
      })

      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token)
        
        // --- 2. Step 2: AI Verification (Face Matching) ---
        if (cnicImage && selfieImage) {
          const aiForm = new FormData()
          aiForm.append('cnic_image', cnicImage)
          aiForm.append('selfie_image', selfieImage)
          
          try {
            const aiRes = await api.post('/api/v1/sellers/verify', aiForm, {
              headers: { 
                Authorization: `Bearer ${res.data.token}`, 
                'Content-Type': 'multipart/form-data' 
              },
              timeout: 120000
            })

            const aiData = aiRes.data.data
            setVerificationReport(aiData) // Save the full report for display
            
            if (aiData.FINAL_DECISION === 'VERIFIED SELLER') {
              setShowSuccessOverlay(true);
              setLoading(false);
              return;
            } else {
              // High-visibility error for AI rejection
              console.warn('AI Rejection:', aiData.reason)
              setApiError(`Identity Check Failed: ${aiData.reason}`)
              setStep(0) // send user back to fix images
              toast.error('Identity Verification Failed')
              setLoading(false);
              return
            }
          } catch (aiErr) {
            console.error('AI match failed details:', aiErr)
            const errorMsg = aiErr.response?.data?.message || 'AI Matching Service Error'
            setApiError(errorMsg)
            
            // If it's a connection/timeout error, we can allow manual queueing
            if (aiErr.message?.includes('timeout') || aiErr.code === 'ECONNABORTED') {
              setSuccess(true)
              toast.error('Verification taking longer than usual. Manual review queued.')
              setTimeout(() => navigate('/customer/dashboard'), 3000)
            } else {
              setStep(1)
            }
          }
        } else {
          setSuccess(true)
          toast.success('Registration successful! Redirecting...')
          setTimeout(() => navigate('/customer/dashboard'), 2500)
        }
      }
    } catch (err) {
      if (err?.response?.data?.message) {
        setApiError(err.response.data.message)
      } else {
        setApiError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // â”€â”€ Tags available based on marketplace (Dynamic + Base Defaults) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const availableTags = (() => {
    if (!categoriesTree || categoriesTree.length === 0) return []
    
    // Filter categories by selected marketplace
    const filtered = categoriesTree.filter(cat => cat.marketplace === marketplace)
    
    // Collect all unique names from these categories and their sub-categories
    let tags = []
    filtered.forEach(cat => {
      // Add the main category name if it's not a generic container
      const mainNames = ["Handmade Crafts", "Non-Fresh Food Items", "Selected Food"]
      if (!mainNames.includes(cat.name)) {
        tags.push(cat.name)
      }
      
      // Add all children (sub-categories)
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach(child => {
          tags.push(child.name)
        })
      }
    })
    
    return [...new Set(tags)]
  })()

  // â”€â”€ AntD Steps config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderStepIcon = (icon, index) => {
    const isActive = step === index
    const isCompleted = step > index
    return (
      <div style={{
        width: 54, height: 54, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? `linear-gradient(135deg, ${CORAL} 0%, ${CORAL_DARK} 100%)` : isCompleted ? CORAL : '#ffffff',
        color: isActive || isCompleted ? '#ffffff' : '#94A3B8',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isActive ? `0 8px 20px rgba(255,107,107,0.35)` : 'none',
        border: isActive || isCompleted ? 'none' : '2.5px solid #E2E8F0'
      }}>
        {icon}
      </div>
    )
  }

  const stepsItems = [
    { title: '', description: '', icon: renderStepIcon(<IdCard size={28} />, 0) },
    { title: '', description: '', icon: renderStepIcon(<Camera size={28} />, 1) },
    { title: '', description: '', icon: renderStepIcon(<Store size={28} />, 2) },
    { title: '', description: '', icon: renderStepIcon(<CheckCircle size={28} />, 3) },
  ]

  const inputStyle = { borderRadius: 12, height: 48 }
  const req = (label) => <span>{label} <span style={{ color: CORAL }}>*</span></span>
  const opt = (label) => <span>{label} <span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 4 }}>(Optional)</span></span>
  const handleFinish = () => handleSubmit()

  return (
    <ConfigProvider theme={homedifyTheme}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .scan-container::after {
          content: "";
          position: absolute;
          left: 0;
          width: 100%;
          height: 6px;
          background: linear-gradient(to right, transparent, ${CORAL}, transparent);
          box-shadow: 0 0 15px ${CORAL}, 0 0 8px ${CORAL};
          z-index: 50;
          animation: scanLine 3.2s ease-in-out infinite alternate;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        
        <main style={{ flex: 1, padding: windowWidth < 768 ? '20px 12px 80px' : '40px 20px 100px' }}>
          <Form form={form} layout="vertical" requiredMark={false} size="large" autoComplete="off">
          
          {/* ————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————— */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Title level={1} style={{ margin: 0, fontSize: 34, fontWeight: 900, color: '#111827', lineHeight: 1.15 }}>
              Become a <span style={{ color: CORAL }}>Verified</span> Seller
            </Title>
            <Paragraph style={{ color: '#6B7280', marginTop: 8, marginBottom: 0, fontSize: 14 }}>
              Follow our 4-step AI-powered process to launch your home business on Homedify.
            </Paragraph>
          </div>

          {/* â”€â”€ Step Tracker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <Card
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 20, maxWidth: 980, margin: '0 auto 32px' }}
            styles={{ body: { padding: '20px 32px' } }}
          >
            <Steps 
              current={step} 
              items={stepsItems} 
              size={windowWidth < 768 ? 'small' : 'default'} 
              direction={windowWidth < 768 ? 'horizontal' : 'horizontal'} 
              responsive={true}
            />
          </Card>

          {/* ==================================================================
              STEP 0 - IDENTITY VERIFICATION (CNIC)
          ================================================================== */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ maxWidth: 980, margin: '0 auto' }}>
              <Card
                style={{ borderRadius: 32, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ padding: windowWidth < 768 ? '24px 20px 10px' : '32px 32px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${CORAL_LIGHT} 0%, #fff 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${CORAL_BORDER}` }}>
                      <IdCard size={22} style={{ color: CORAL }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: windowWidth < 768 ? 'column' : 'row', 
                        justifyContent: 'space-between', 
                        alignItems: windowWidth < 768 ? 'flex-start' : 'center', 
                        gap: 16 
                      }}>
                        <div style={{ flex: 1 }}>
                          <Title level={windowWidth < 768 ? 4 : 3} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                            Identity Verification
                          </Title>
                          <Text style={{ color: '#94A3B8', fontSize: windowWidth < 768 ? 10 : 13, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginTop: 4 }}>
                            Step 1: Smart OCR Document Analysis
                          </Text>
                        </div>
                        <Button 
                          type="text" 
                          onClick={() => setIsSampleModalOpen(true)}
                          icon={<Eye size={16} />}
                          style={{ 
                            color: CORAL, 
                            fontWeight: 800, 
                            background: CORAL_LIGHT, 
                            borderRadius: 12, 
                            height: 40, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            width: windowWidth < 768 ? '100%' : 'auto', 
                            justifyContent: 'center' 
                          }}
                        >
                          View Sample
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      '1. Ensure your CNIC has good lighting (avoid shadows)',
                      '2. Keep the entire card fully inside the frame',
                      '3. Use your original CNIC (do not use a photocopy)'
                    ].map((rule, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: windowWidth < 768 ? 11 : 13, fontWeight: 700, color: '#FF6B6B', lineHeight: 1.5 }}>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: windowWidth < 768 ? '20px' : '24px 32px 32px' }}>
                  {!cnicPreview ? (
                    <Upload.Dragger
                      accept="image/*"
                      showUploadList={false}
                      onChange={handleCNICUpload}
                      style={{ borderRadius: 24, padding: '60px 0', borderStyle: 'dashed', borderWidth: 2, borderColor: CORAL_BORDER }}
                    >
                      <div className="group">
                        <div style={{ width: 80, height: 80, background: CORAL_LIGHT, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                          <UploadIcon size={36} style={{ color: CORAL }} />
                        </div>
                        <Title level={4} style={{ marginBottom: 8, fontWeight: 800 }}>Upload CNIC Front</Title>
                        <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>Select a high-resolution image for faster processing</Text>
                      </div>
                    </Upload.Dragger>
                  ) : (
                    <div className="animate-in zoom-in-95 duration-500" style={{ maxWidth: 650, margin: '0 auto' }}>
                      <div 
                        className={`relative mb-6 rounded-2xl overflow-hidden shadow-2xl ${isScanning ? 'scan-container' : ''}`} 
                        style={{ border: '4px solid #fff', background: '#2D3748', height: windowWidth < 768 ? 240 : 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                      >
                        <img src={cnicPreview} alt="CNIC" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        {isScanning && (
                           <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(1px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                              <div style={{ background: 'rgba(0,0,0,0.7)', padding: '12px 24px', borderRadius: 40, border: '1px solid rgba(255,255,255,0.2)' }}>
                                 <Space size={12}><Loader2 size={18} className="animate-spin" style={{ color: CORAL }} /><Text style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>ENCRYPTED SCANNING...</Text></Space>
                              </div>
                           </div>
                        )}
                        <Button 
                          onClick={() => { setCnicImage(null); setCnicPreview(null); setOcrData({ name: '', cnic: '', gender: '', cnic_face_base64: '' }) }} 
                          size="middle" shape="circle" icon={<RefreshCw size={16} />}
                          style={{ position: 'absolute', top: 16, right: 16, background: '#fff', border: 'none', zIndex: 20 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

              </Card>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                <Button
                  type="primary" size="large"
                  disabled={!cnicImage || isScanning || !ocrData.cnic || ocrData.gender !== 'Female'}
                  onClick={() => setStep(1)}
                  style={{ 
                    background: (!cnicImage || isScanning || !ocrData.cnic || ocrData.gender !== 'Female') ? '#CBD5E1' : CORAL, 
                    borderColor: (!cnicImage || isScanning || !ocrData.cnic || ocrData.gender !== 'Female') ? '#CBD5E1' : CORAL, 
                    borderRadius: 16, height: 56, padding: windowWidth < 640 ? '0 24px' : '0 56px', fontWeight: 900, width: windowWidth < 640 ? '100%' : 'auto',
                    boxShadow: (ocrData.gender === 'Female') ? `0 10px 25px rgba(255,107,107,0.3)` : 'none'
                  }}
                >
                  Next <ArrowRight size={20} style={{ marginLeft: 10, display: 'inline' }} />
                </Button>
              </div>
            </div>
          )}

          {/* ==================================================================
              STEP 1 - FACE MATCH (LIVE CAPTURE)
          ================================================================== */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}>
              <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 25px 70px rgba(0,0,0,0.08)' }} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: windowWidth < 768 ? '24px 20px' : '32px 40px', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: CORAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={26} style={{ color: CORAL }} />
                    </div>
                    <div>
                      <Title level={3} style={{ margin: 0, fontWeight: 900 }}>Face Verification</Title>
                      <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Step 2: Biometric Identity Check</Text>
                    </div>
                  </div>
                </div>

                <div style={{ padding: windowWidth < 768 ? '20px' : '40px' }}>
                  {!selfiePreview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 450, margin: '0 auto' }}>
                      <div style={{ width: '100%', position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#0F172A', aspectRatio: windowWidth < 768 ? '1/1' : '4/5', border: `4px solid #fff`, marginBottom: 28 }}>
                        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" mirrored={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ marginTop: '15%', background: 'rgba(255,255,255,0.8)', padding: '10px 18px', borderRadius: 40, zIndex: 30 }}>
                              <Text style={{ color: '#111827', fontSize: 13, fontWeight: 800 }}>{livenessStatus.message.toUpperCase()}</Text>
                            </div>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: windowWidth < 768 ? 180 : 240, height: windowWidth < 768 ? 250 : 330, borderRadius: '120px / 165px', border: `3.5px solid ${livenessStage === 3 ? '#10B981' : CORAL}`, boxShadow: `0 0 0 1000px rgba(15, 23, 42, 0.7)` }} />
                        </div>
                      </div>
                      <Button type="primary" size="large" onClick={captureSelfie} style={{ width: '100%', height: 60, borderRadius: 16, background: CORAL, fontWeight: 800 }}>Capture Selfie <Camera size={20} style={{ marginLeft: 10 }} /></Button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: windowWidth < 768 ? 160 : 220, height: windowWidth < 768 ? 160 : 220, borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: `8px solid #fff`, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <img src={selfiePreview} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ marginTop: 24 }}>
                        <Title level={2} style={{ marginBottom: 4, fontWeight: 900 }}>Face Captured!</Title>
                        <Text style={{ color: '#64748B', display: 'block', marginBottom: 20 }}>Our AI is verifying your identity...</Text>
                        <Button onClick={() => { setSelfiePreview(null); setFaceCheckResult(null); setLivenessStage(0); }} icon={<RefreshCw size={18} />} style={{ borderRadius: 12, fontWeight: 700 }}>Retake</Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                <Button 
                  size="large" onClick={() => setStep(0)} 
                  style={{ borderRadius: 16, height: 56, padding: windowWidth < 640 ? '0 20px' : '0 32px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <ArrowLeft size={18} /> Back
                </Button>
                  <Button 
                    type="primary" size="large" 
                    disabled={!faceCheckResult?.matched} 
                    onClick={() => { setStep(2); if (ocrData.name) form.setFieldsValue({ name: ocrData.name }); }}
                    style={{ 
                      background: !faceCheckResult?.matched ? '#CBD5E1' : CORAL, 
                      borderColor: !faceCheckResult?.matched ? '#CBD5E1' : CORAL, 
                      height: 56, padding: windowWidth < 640 ? '0 24px' : '0 56px', borderRadius: 16, fontWeight: 900,
                      boxShadow: faceCheckResult?.matched ? `0 10px 25px rgba(255,107,107,0.3)` : 'none',
                      width: windowWidth < 640 ? '100%' : 'auto',
                      justifyContent: 'center'
                    }}
                  >
                    Next <ArrowRight size={20} style={{ marginLeft: 10 }} />
                  </Button>
              </div>
            </div>
          )}

          {/* ==================================================================
              STEP 2 - BASIC INFO (STORE DETAILS)
          ================================================================== */}
          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.06)', background: '#fff', maxWidth: 880, margin: '0 auto', width: '100%' }} styles={{ body: { padding: windowWidth < 768 ? '24px 20px' : '48px 64px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: windowWidth < 768 ? 24 : 48 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: CORAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={26} style={{ color: CORAL }} />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0, fontWeight: 900, fontSize: 24 }}>Store Profile Setup</Title>
                  <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>STEP 2: FILL IN YOUR BUSINESS DETAILS</Text>
                </div>
              </div>

              <div>
                {/* --- BASIC INFO --- */}
                <Divider style={{ margin: '0 0 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: CORAL, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                     <User size={14} /> BASIC INFO
                  </div>
                </Divider>

                <Row gutter={windowWidth < 768 ? [0, 0] : [24, 0]}>
                  <Col xs={24} md={12}><Form.Item name="name" label={req('Full Name (as per CNIC)')} rules={[{ required: true }]}><Input prefix={<div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 10, marginRight: 2 }}><User size={16} style={{ color: CORAL }} /></div>} placeholder="e.g. Haider Ali" style={inputStyle} /></Form.Item></Col>
                  <Col xs={24} md={12}>
                    <Form.Item 
                      name="phone" 
                      label={req('Phone Number')} 
                      rules={[
                        { required: true, message: 'Phone number is required' }, 
                        { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit number' }
                      ]}
                    >
                      <Input 
                        prefix={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={16} style={{ color: CORAL }} /><span style={{ color: CORAL, fontWeight: 900, fontSize: 14, borderRight: '1px solid #F1F5F9', paddingRight: 8, display: 'flex', alignItems: 'center', height: 20 }}>+92</span></div>} 
                        placeholder="3XX XXXXXXX" 
                        style={inputStyle} 
                        maxLength={10}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          form.setFieldsValue({ phone: val });
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item 
                  name="email" 
                  label={req('Email Address')} 
                  validateTrigger="onBlur"
                  rules={[
                    { required: true, type: 'email', message: 'Please enter a valid email address' },
                    {
                      validator: async (_, value) => {
                        if (!value || !value.includes('@')) return;
                        try {
                          const res = await api.post('/api/v1/auth/check-email', { email: value });
                          if (res.data.exists) return Promise.reject('Email already registered!');
                        } catch (e) {}
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input prefix={<div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 10, marginRight: 2 }}><Mail size={16} style={{ color: CORAL }} /></div>} placeholder="example@email.com" style={inputStyle} />
                </Form.Item>

                <Row gutter={windowWidth < 768 ? [0, 0] : [24, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item 
                      name="password" 
                      label={req('Password')} 
                      rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
                    >
                      <Input.Password prefix={<div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 10, marginRight: 2 }}><Lock size={16} style={{ color: CORAL }} /></div>} placeholder="********" style={inputStyle} onChange={(e) => { evaluatePassword(e.target.value); setPasswordValue(e.target.value); }} />
                    </Form.Item>
                    {passwordValue && (
                      <div style={{ marginBottom: 24, marginTop: -10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 11, color: '#64748B' }}>Security Strength:</Text>
                          <Text style={{ fontSize: 11, fontWeight: 800, color: passwordStrength.color }}>{passwordStrength.text}</Text>
                        </div>
                        <Progress percent={passwordStrength.percent} strokeColor={passwordStrength.color} showInfo={false} size={[null, 4]} />
                      </div>
                    )}
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item 
                      name="confirmPassword" 
                      label={req('Confirm Password')} 
                      rules={[
                        { required: true, message: 'Please confirm your password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) return Promise.resolve();
                            return Promise.reject(new Error('Passwords do not match!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 10, marginRight: 2 }}><Lock size={16} style={{ color: CORAL }} /></div>} placeholder="********" style={inputStyle} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* --- STORE & BUSINESS DETAILS --- */}
                <Divider style={{ margin: windowWidth < 768 ? '32px 0 24px' : '48px 0 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: CORAL, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                     <Store size={14} /> STORE & BUSINESS DETAILS
                  </div>
                </Divider>

                <Row gutter={windowWidth < 768 ? [0, 0] : [24, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item 
                      name="storeName" 
                      label={req('Store Name')} 
                      validateTrigger="onBlur"
                      rules={[
                        { required: true, message: 'Store name is required' },
                        {
                          validator: async (_, value) => {
                            if (!value) return;
                            try {
                              const res = await api.post('/api/v1/auth/check-store', { storeName: value });
                              if (res.data.exists) return Promise.reject('Store name is already taken!');
                            } catch (e) {}
                            return Promise.resolve();
                          }
                        }
                      ]}
                    >
                      <Input prefix={<div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 10, marginRight: 2 }}><Store size={16} style={{ color: CORAL }} /></div>} placeholder="Enter store name" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}><Form.Item name="storeAddress" label={req('Residential Address')} rules={[{ required: true, message: 'Address is required' }]}><Input prefix={<div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 10, marginRight: 2 }}><Home size={16} style={{ color: CORAL }} /></div>} placeholder="Full address" style={inputStyle} /></Form.Item></Col>
                </Row>

                <Row gutter={windowWidth < 768 ? [0, 0] : [24, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="marketplace" label={req('Main Marketplace Category')} rules={[{ required: true }]}>
                      <Select placeholder="Select Marketplace" style={{ width: '100%' }} onChange={setMarketplace} suffixIcon={<LayoutGrid size={16} style={{ color: CORAL }} />}>
                        <Option value="craft">Handmade Crafts</Option>
                        <Option value="food">Non-Fresh Food Items</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={opt('Sub-Categories')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#FFF8F8', padding: '12px', borderRadius: 16, border: '1px solid #FFEBEB', minHeight: 48 }}>
                        {availableTags.length > 0 ? availableTags.map(tag => (
                          <Tag.CheckableTag
                            key={tag}
                            checked={selectedTags.includes(tag)}
                            onChange={checked => {
                              const nextTags = checked ? [...selectedTags, tag] : selectedTags.filter(t => t !== tag);
                              setSelectedTags(nextTags);
                            }}
                            style={{
                              margin: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: selectedTags.includes(tag) ? CORAL : '#fff',
                              color: selectedTags.includes(tag) ? '#fff' : '#64748B',
                              border: `1px solid ${selectedTags.includes(tag) ? CORAL : '#E2E8F0'}`,
                              transition: 'all 0.2s'
                            }}
                          >
                            {tag}
                          </Tag.CheckableTag>
                        )) : <Text type="secondary" style={{ fontSize: 12 }}>Select a category first</Text>}
                      </div>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="storeDescription" label={opt('Store Description')}><TextArea rows={4} placeholder="Describe your store, products, and skills in a few sentences..." style={{ borderRadius: 16, padding: '12px' }} /></Form.Item>

                {/* --- PAYMENT SETUP (OPTIONAL) --- */}
                <Divider style={{ margin: windowWidth < 768 ? '32px 0 24px' : '48px 0 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: CORAL, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                     <Banknote size={14} /> PAYMENT SETUP
                  </div>
                </Divider>

                <Row gutter={windowWidth < 768 ? [0, 0] : [24, 0]}>
                   <Col xs={24} md={12}>
                    <Form.Item 
                      name="paymentMethod" 
                      label={req('Payment Method')}
                      rules={[{ required: true, message: 'Please select a payment method' }]}
                    >
                      <Select placeholder="Select payment method" style={{ width: '100%' }}>
                        <Option value="EasyPaisa">EasyPaisa</Option>
                        <Option value="JazzCash">JazzCash</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item 
                      name="paymentAccountNumber" 
                      label={req('Account Number')}
                      rules={[{ required: true, message: 'Please enter your account number' }]}
                    >
                      <Input prefix={<div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 10, marginRight: 2 }}><Banknote size={16} style={{ color: CORAL }} /></div>} placeholder="03XX XXXXXXX" style={inputStyle} />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ 
                  background: '#FFF1F1', padding: '14px 20px', borderRadius: 12, border: '1px solid #FFE4E4', 
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 
                }}>
                  <ShieldCheck size={18} style={{ color: CORAL, flexShrink: 0 }} />
                  <Text style={{ fontSize: windowWidth < 768 ? 10 : 12, color: '#991B1B', fontWeight: 500 }}>
                    Your data is completely secure and will only be used by the Homedify verification team.
                  </Text>
                </div>

              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: windowWidth < 640 ? 'column-reverse' : 'row', justifyContent: 'space-between', marginTop: 40, maxWidth: 880, margin: '32px auto 0', alignItems: 'center', gap: 20 }}>
              <Button 
                size="large" onClick={() => setStep(1)} 
                style={{ borderRadius: 16, height: 60, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, width: windowWidth < 640 ? '100%' : 'auto', justifyContent: 'center' }}
              >
                <ArrowLeft size={20} /> Back
              </Button>
              <div style={{ display: 'flex', flexDirection: windowWidth < 640 ? 'column' : 'row', alignItems: 'center', gap: windowWidth < 640 ? 12 : 24, width: windowWidth < 640 ? '100%' : 'auto' }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>* Required fields must be filled to proceed.</Text>
                <Button 
                  type="primary" size="large" 
                  onClick={async () => {
                    try {
                      await form.validateFields([
                        'name', 'phone', 'email', 'password', 'confirmPassword',
                        'storeName', 'storeAddress', 'marketplace',
                        'paymentMethod', 'paymentAccountNumber'
                      ]);
                      setStep(3);
                    } catch (e) {
                      toast.error('Please complete all required fields')
                    }
                  }} 
                  style={{ 
                    background: CORAL, borderColor: CORAL, borderRadius: 16, height: 60, padding: windowWidth < 640 ? '0 24px' : '0 48px', 
                    fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 10px 25px rgba(255,107,107,0.3)',
                    width: windowWidth < 640 ? '100%' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  Next <ArrowRight size={20} />
                </Button>
              </div>
            </div>
          </div>

          {/* ==================================================================
              STEP 3 - FINAL REVIEW & SUBMISSION
          ================================================================== */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}>
              <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 25px 70px rgba(0,0,0,0.12)' }} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: windowWidth < 768 ? '24px 20px' : '32px 40px', background: '#fff', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 18, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={26} style={{ color: '#059669' }} /></div>
                  <div><Title level={3} style={{ margin: 0, fontWeight: 900 }}>Final Review</Title><Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700 }}>VERIFICATION COMPLETE</Text></div>
                </div>

                <div style={{ padding: windowWidth < 768 ? '40px 20px' : '64px 48px', textAlign: 'center' }}>
                    <div style={{ maxWidth: 520, margin: '0 auto' }}>
                      <div style={{ marginBottom: 40 }}>
                        <div style={{ display: 'inline-flex', padding: 24, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', marginBottom: 20 }}><ShieldCheck size={48} style={{ color: '#10B981' }} /></div>
                        <Title level={2} style={{ fontWeight: 900, marginBottom: 12 }}>Ready to Launch!</Title>
                        <Paragraph style={{ color: '#64748B', fontSize: 15 }}>Your identity has been verified. One final click to submit your profile for admin approval.</Paragraph>
                      </div>

                      <div style={{ marginBottom: 48, textAlign: 'center' }}>
                         <Button type="link" onClick={() => setIsReviewModalOpen(true)} style={{ color: CORAL, fontWeight: 800, fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 10, background: '#FFF5F5', padding: '12px 24px', borderRadius: 16 }}>
                           <FileText size={20} /> View Your Details
                         </Button>
                      </div>

                      <div style={{ marginBottom: 24, textAlign: 'left' }}>
                        <Checkbox checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} style={{ fontSize: 14, fontWeight: 600 }}>I agree to the Seller Terms &amp; Conditions</Checkbox>
                      </div>
                    </div>
                </div>
              </Card>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, alignItems: 'center' }}>
                <Button 
                  size="large" onClick={() => setStep(2)} 
                  style={{ borderRadius: 16, height: 60, padding: windowWidth < 640 ? '0 20px' : '0 32px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <ArrowLeft size={20} /> Back
                </Button>
                  <Button 
                    type="primary" size="large" 
                    loading={loading} disabled={!termsAccepted} 
                    onClick={handleFinish} 
                    style={{ 
                      height: 60, borderRadius: 16, background: CORAL, borderColor: CORAL, 
                      fontWeight: 900, fontSize: 16, padding: windowWidth < 640 ? '0 24px' : '0 64px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: '0 10px 25px rgba(255,107,107,0.3)',
                      width: windowWidth < 640 ? '100%' : 'auto',
                      justifyContent: 'center',
                      marginTop: windowWidth < 640 ? 12 : 0
                    }}
                  >
                    Submit <ArrowRight size={20} />
                  </Button>
              </div>
            </div>
          )}

          {/* ==================================================================
              MODALS & OVERLAYS
          ================================================================== */}

          {/* 1. OCR Results / Scanning Modal */}
          {(isScanning || isResultModalOpen) && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={() => !isScanning && setIsResultModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', zIndex: -1 }} />
              <div className="animate-in zoom-in-95 duration-300" style={{ width: '100%', maxWidth: windowWidth < 768 ? '95%' : 420, background: '#fff', borderRadius: 32, padding: windowWidth < 768 ? '32px 20px' : '40px 32px 32px', textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                
                {isScanning ? (
                  <div>
                    <div className="scan-container" style={{ width: 240, height: 150, borderRadius: 16, background: '#F1F5F9', margin: '0 auto 24px', overflow: 'hidden', position: 'relative', border: '2px solid #E2E8F0' }}>
                       <img src={cnicPreview} alt="Scanning" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: CORAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'spin 2s linear infinite' }}><Loader2 size={24} style={{ color: CORAL }} /></div>
                    <Title level={3} style={{ fontWeight: 900 }}>Reading CNIC...</Title>
                    <Text style={{ color: '#64748B' }}>Extracting identity details with AI</Text>
                  </div>
                ) : (
                  <>
                    <div style={{ width: 56, height: 56, background: '#D1FAE5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><ShieldCheck size={32} style={{ color: '#059669' }} /></div>
                    <Title level={3} style={{ fontWeight: 900, marginBottom: 8 }}>Identity Detected</Title>
                    <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, textAlign: 'left', marginBottom: 24, border: '1px solid #E2E8F0' }}>
                       {[{ l: 'NAME', v: ocrData.name }, { l: 'CNIC', v: ocrData.cnic }, { l: 'GENDER', v: ocrData.gender }].map(item => (
                         <Row key={item.l} style={{ marginBottom: 8 }}>
                           <Col span={10}><Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 800 }}>{item.l}</Text></Col>
                           <Col span={14}><Text strong style={{ fontSize: 13 }}>{item.v}</Text></Col>
                         </Row>
                       ))}
                    </div>

                    <div style={{ 
                      marginBottom: 24, padding: '16px', borderRadius: 16, 
                      display: 'flex', alignItems: 'center', gap: 12, 
                      background: ocrData.gender === 'Female' ? '#F0FDF4' : '#FFF1F2', 
                      border: `1px solid ${ocrData.gender === 'Female' ? '#BBF7D0' : '#FECDD3'}`,
                      textAlign: 'left'
                    }}>
                      {ocrData.gender === 'Female' ? (
                        <>
                          <CheckCircle size={20} style={{ color: '#16A34A', flexShrink: 0 }} />
                          <Text style={{ color: '#166534', fontWeight: 700, fontSize: 14 }}>
                             Congratulations {ocrData.name}! You can now proceed to the next step.
                          </Text>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={20} style={{ color: '#E11D48', flexShrink: 0 }} />
                          <Text style={{ color: '#991B1B', fontWeight: 700, fontSize: 14 }}>
                             Verification Failed: You cannot move to the next step.
                          </Text>
                        </>
                      )}
                    </div>

                    <Button 
                      type="primary" size="large" block 
                      onClick={() => setIsResultModalOpen(false)} 
                      style={{ height: 56, borderRadius: 16, background: CORAL }}
                    >
                      OK
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. Face Match Comparing Popup */}
          {(faceChecking || showFacePopup) && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: -1 }} />
              <div className="animate-in zoom-in-95 duration-300" style={{ width: '100%', maxWidth: windowWidth < 768 ? '90%' : 360, background: '#fff', borderRadius: 28, padding: windowWidth < 768 ? '24px' : '32px', textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.45)', position: 'relative', overflow: 'hidden' }}>
                
                {faceChecking ? (
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                        <div className="scan-container" style={{ width: 100, height: 125, background: '#F1F5F9', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                           <img src={`data:image/jpeg;base64,${ocrData.cnic_face_base64}`} alt="CNIC" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                        </div>
                        <div className="scan-container" style={{ width: 100, height: 125, background: '#F1F5F9', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                           <img src={selfiePreview} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                        </div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: CORAL_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'spin 1.5s linear infinite' }}><Loader2 size={24} style={{ color: CORAL }} /></div>
                    <Title level={4} style={{ fontWeight: 900 }}>Comparing Faces...</Title>
                  </div>
                ) : faceCheckResult ? (
                  <div>
                    <div style={{ width: 56, height: 56, background: faceCheckResult.matched ? '#D1FAE5' : '#FEE2E2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{faceCheckResult.matched ? <ShieldCheck size={32} style={{ color: '#059669' }} /> : <ShieldAlert size={32} style={{ color: CORAL }} />}</div>
                    <Title level={3} style={{ fontWeight: 900 }}>{faceCheckResult.matched ? 'Verified!' : 'Failed'}</Title>
                    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                      {faceCheckResult.matched ? (
                        <Button type="primary" size="large" block onClick={() => setShowFacePopup(false)} style={{ height: 52, borderRadius: 16, background: CORAL }}>OK</Button>
                      ) : (
                        <Button type="primary" block onClick={() => { setShowFacePopup(false); setSelfieImage(null); setSelfiePreview(null); setLivenessStage(0); setFaceCheckResult(null); }} style={{ height: 52, borderRadius: 16, background: CORAL }}>Retake</Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ==================================================================
              REVIEW DETAILS MODAL
          ================================================================== */}
          <Modal
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ padding: '6px', borderRadius: '8px', background: CORAL_LIGHT }}><FileText size={20} style={{ color: CORAL }} /></div>
                   <Text strong style={{ fontSize: 18 }}>Seller Profile Summary</Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<Edit3 size={14} />} 
                  onClick={() => { setIsReviewModalOpen(false); setStep(2); }}
                  style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, fontWeight: 700 }}
                >
                  Edit Details
                </Button>
              </div>
            }
            open={isReviewModalOpen}
            onCancel={() => setIsReviewModalOpen(false)}
            footer={[
              <Button key="close" type="primary" block onClick={() => setIsReviewModalOpen(false)} style={{ background: CORAL, borderColor: CORAL, height: 52, fontWeight: 900, borderRadius: 16 }}>
                Confirm & Back to Review
              </Button>
            ]}
            width={windowWidth < 768 ? '95%' : 700}
            centered
            styles={{ body: { padding: '32px' } }}
          >
            <div style={{ border: '1px solid #F1F5F9', borderRadius: 20, padding: windowWidth < 768 ? '20px' : 32, background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ background: '#F8FAFC', padding: '20px 24px', borderRadius: 16, marginBottom: 20 }}>
                <Title level={5} style={{ marginBottom: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} style={{ color: CORAL }} /> Personal Information
                </Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Full Name</Text><div style={{ fontWeight: 700, marginTop: 4 }}>{form.getFieldValue('name') || '-'}</div></Col>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Phone Number</Text><div style={{ fontWeight: 700, marginTop: 4 }}>+92 {form.getFieldValue('phone') || '-'}</div></Col>
                  <Col span={24}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Email Address</Text><div style={{ fontWeight: 700, marginTop: 4 }}>{form.getFieldValue('email') || '-'}</div></Col>
                </Row>
              </div>

              <div style={{ background: '#F8FAFC', padding: '20px 24px', borderRadius: 16, marginBottom: 20 }}>
                <Title level={5} style={{ marginBottom: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Store size={18} style={{ color: CORAL }} /> Business Details
                </Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Store Name</Text><div style={{ fontWeight: 700, marginTop: 4 }}>{form.getFieldValue('storeName') || '-'}</div></Col>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Category</Text><div style={{ fontWeight: 700, marginTop: 4 }}>{marketplace === 'craft' ? 'Handmade Crafts' : 'Food Items'}</div></Col>
                  <Col span={24}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Residential Address</Text><div style={{ fontWeight: 700, marginTop: 4 }}>{form.getFieldValue('storeAddress') || '-'}</div></Col>
                  <Col span={24}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Description</Text><div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>{form.getFieldValue('storeDescription') || 'No description provided'}</div></Col>
                </Row>
              </div>

              <div style={{ background: '#F8FAFC', padding: '20px 24px', borderRadius: 16, marginBottom: 20 }}>
                <Title level={5} style={{ marginBottom: 20, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Banknote size={18} style={{ color: CORAL }} /> Payout Information
                </Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Method</Text><div style={{ fontWeight: 700, marginTop: 4 }}>{form.getFieldValue('paymentMethod') || 'Not provided'}</div></Col>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Account No / IBAN</Text><div style={{ fontWeight: 700, marginTop: 4 }}>{form.getFieldValue('paymentAccountNumber') || 'Not provided'}</div></Col>
                </Row>
              </div>

              <div style={{ background: '#F0FDF4', padding: '20px 24px', borderRadius: 16, border: '1px solid #BBF7D0' }}>
                <Title level={5} style={{ marginBottom: 20, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={18} style={{ color: '#16A34A' }} /> Identity Verification
                </Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#166534' }}>CNIC Verification</Text><div style={{ fontWeight: 700, marginTop: 4, color: '#166534' }}>SUCCESSFUL ({ocrData.gender})</div></Col>
                  <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#166534' }}>Face Biometric</Text><div style={{ fontWeight: 700, marginTop: 4, color: '#10B981' }}>VERIFIED {faceCheckResult?.confidence}%</div></Col>
                </Row>
              </div>
            </div>
          </Modal>

          {/* ==================================================================
              FINAL SUCCESS OVERLAY
          ================================================================== */}
          {showSuccessOverlay && (
            <div className="animate-in fade-in duration-500" style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
               <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)' }} />
               
               <div className="animate-in zoom-in-95 duration-500" style={{ maxWidth: 420, width: '100%', position: 'relative' }}>
                  <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', textAlign: 'center', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                     <div style={{ padding: windowWidth < 768 ? '32px 20px' : '48px 32px 40px' }}>
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
                           <div className="animate-ping" style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)' }} />
                           <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 15px 30px rgba(16, 185, 129, 0.3)' }}>
                              <CheckCircle size={40} style={{ color: '#fff' }} />
                           </div>
                        </div>

                        <Title level={2} style={{ fontWeight: 900, fontSize: 26, marginBottom: 8 }}>Application Submitted!</Title>
                        <div style={{ background: '#F0FDF4', color: '#166534', padding: '10px 16px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, border: '1px solid #BBF7D0' }}>
                           <ShieldCheck size={16} />
                           <Text style={{ color: '#166534', fontWeight: 800, fontSize: 12 }}>VERIFICATION SUCCESSFUL</Text>
                        </div>

                        <Paragraph style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
                          Congratulations! Your verification is successfully complete. 
                          Now the Admin will approve your account within <strong style={{ color: '#1E293B' }}>2 to 3 hours</strong>. 
                          Check your Gmail for the final approval message.
                        </Paragraph>

                        <Button 
                          type="primary" size="large" block 
                          onClick={() => navigate('/seller/dashboard')}
                          style={{ height: 56, borderRadius: 16, background: CORAL, borderColor: CORAL, fontWeight: 900, fontSize: 16, boxShadow: `0 10px 20px rgba(255,107,107,0.3)` }}
                        >
                          Go to Dashboard <ArrowRight size={20} style={{ marginLeft: 10 }} />
                        </Button>
                     </div>
                     <div style={{ background: '#F8FAFC', padding: '20px', borderTop: '1px solid #F1F5F9' }}>
                        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Thank you for joining Homedify!</Text>
                     </div>
                  </Card>
               </div>
            </div>
          )}
          {/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
              SAMPLE CNIC MODAL
          = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  */}
          <Modal
            title={<Text strong style={{ fontSize: 18 }}>How to scan your CNIC</Text>}
            open={isSampleModalOpen}
            onCancel={() => setIsSampleModalOpen(false)}
            footer={[
              <Button key="close" type="primary" onClick={() => setIsSampleModalOpen(false)} style={{ background: CORAL, borderRadius: 12 }}>
                Got it!
              </Button>
            ]}
            width={600}
            centered
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <img src={cnicSampleImg} alt="Sample CNIC" style={{ maxWidth: '100%', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
              <div style={{ marginTop: 24, textAlign: 'left', background: '#F8FAFC', padding: 20, borderRadius: 16 }}>
                 <Title level={5} style={{ marginBottom: 12 }}>Pro Tips for Successful Scan:</Title>
                 <ul style={{ paddingLeft: 20, color: '#64748B', lineHeight: 1.8 }}>
                    <li>Place your original card on a flat, dark surface.</li>
                    <li>Avoid direct light or flash to prevent glare.</li>
                    <li>Ensure all four corners of the card are visible.</li>
                    <li>Hold your phone steady until the scan is complete.</li>
                 </ul>
              </div>
            </div>
          </Modal>

          </Form>
        </main>
        <Footer />
      </div>
    </ConfigProvider>
  )
}

export default SellerRegister


