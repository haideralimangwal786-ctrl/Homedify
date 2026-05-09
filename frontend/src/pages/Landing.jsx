import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import Hero from '../shared/Hero';
import HowItWorks from '../shared/HowItWorks';
import Testimonials from '../shared/Testimonials';
import CTABanner from '../shared/CTABanner';
import FoodMarketplaceHero from '../shared/FoodMarketplaceHero';
import CraftMarketplaceHero from '../shared/CraftMarketplaceHero';
import Team1 from '../assets/team1.png';
import Team2 from '../assets/team2.png';
import Team3 from '../assets/team3.png';
import DeliveryBike from '../assets/DeliveryBike.png';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ShieldCheck,
  Gem,
  CreditCard,
  Plus,
  Minus,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Send,
  CheckCircle2,
  Users
} from 'lucide-react';

const Landing = () => {
  const [featured, setFeatured] = useState([]);
  const [faqOpen, setFaqOpen] = useState(0);
  const [cmsContent, setCmsContent] = useState({});

  // Food categories
  const foodCategories = [
    { name: "Spices & Masalas", image: "https://images.unsplash.com/photo-1596040033229-a0b3b1c50dd7?w=300&q=80" },
    { name: "Pickles & Achars", image: "https://images.unsplash.com/photo-1626200419199-9956f71071c0?w=300&q=80" },
    { name: "Dry Snacks", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&q=80" },
    { name: "Sweets & Mithai", image: "https://images.unsplash.com/photo-1603893604545-c43947da95de?w=300&q=80" },
    { name: "Dry Fruits Mixes", image: "https://images.unsplash.com/photo-1576699717657-6c6c0e2e3c0d?w=300&q=80" },
    { name: "Jams & Preserves", image: "https://images.unsplash.com/photo-1599819177862-74aea1e7e897?w=300&q=80" },
    { name: "Herbal & Tea Mixes", image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=300&q=80" },
    { name: "Ready-to-Cook Meals", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&q=80" }
  ];

  // Craft categories
  const craftCategories = [
    { name: "Pottery", image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80" },
    { name: "Embroidery", image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=300&q=80" },
    { name: "Jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&q=80" },
    { name: "Wall Art", image: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=300&q=80" },
    { name: "Cushions", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=300&q=80" },
    { name: "Macrame", image: "https://images.unsplash.com/photo-1602932347892-f3eb7e91f2c4?w=300&q=80" },
    { name: "Candles", image: "https://images.unsplash.com/photo-1602874801007-63c0f6c5f1a0?w=300&q=80" },
    { name: "Handmade Soaps", image: "https://images.unsplash.com/photo-1600428853876-a3c9b6c14f9b?w=300&q=80" }
  ];

  // FAQs
  const faqs = [
    {
      question: "Is Homedify safe?",
      answer: "Absolutely. All sellers undergo strict CNIC OCR and face verification using our AI-powered systems. Payments are securely held by our admin team and only released to the seller after you confirm successful delivery."
    },
    {
      question: "How do I become a seller?",
      answer: "Click on 'Become a Seller', complete your profile, and upload your CNIC along with a live selfie. Our AI services and admin team will review your application within 24-48 hours. Once approved, you can start listing products!"
    },
    {
      question: "What payment methods do you support?",
      answer: "We support popular Pakistani payment methods including JazzCash, EasyPaisa, and Direct Bank Transfer (IBFT). Cash on Delivery (COD) is also available for selected items."
    },
    {
      question: "What is the delivery process for food items?",
      answer: "We specialize in non-fresh, home-made food items like pickles, jams, and dry snacks. Sellers manage their own delivery or use our logistics partners to ensure your products arrive perfectly packaged."
    }
  ];

  const team = [
    {
      name: 'Muhammad Zaryab',
      role: 'UI/UX Designer & Developer',
      image: Team1
    },
    {
      name: 'Haider Ali',
      role: 'Full Stack Developer',
      image: Team2
    },
    {
      name: 'Danish Mehmood',
      role: 'App Developer',
      image: Team3
    }
  ];

  useEffect(() => {
    axios.get('/api/v1/products').then(r => {
      const data = r.data.data;
      if (Array.isArray(data)) setFeatured(data.slice(0, 8));
      else if (data && Array.isArray(data.products)) setFeatured(data.products.slice(0, 8));
    }).catch(() => { });

    axios.get('/api/v1/admin/content/homepage').then(r => {
      if (r.data && r.data.data && r.data.data.content) setCmsContent(r.data.data.content);
    }).catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Premium Hero Section */}
      <Hero content={cmsContent} />

      {/* Why Homedify - Features with Icons */}
      <section className="py-12 md:py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Why Choose Homedify</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">We provide a secure and empowering environment for both sellers and buyers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Verified Female Sellers",
                desc: "100% identity verification through CNIC and Face Matching technology.",
                icon: <Users className="text-coral" size={32} />,
                color: "bg-red-50"
              },
              {
                title: "Premium Quality Crafts",
                desc: "Every item is handcrafted with love and undergoes a quality check.",
                icon: <Gem className="text-[#FC6A6B]" size={32} />,
                color: "bg-[#FC6A6B]/10"
              },
              {
                title: "Escrowed Payments",
                desc: "Your money is safe. We only release it to sellers when you're satisfied.",
                icon: <CreditCard className="text-green-500" size={32} />,
                color: "bg-green-50"
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl border border-gray-100 hover:border-coral/50 hover:shadow-2xl hover:shadow-coral/5 transition-all duration-300">
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Food Marketplace Hero */}
      <FoodMarketplaceHero />

      {/* Craft Marketplace Hero */}
      <CraftMarketplaceHero />


      {/* How It Works - Shared Component */}
      <HowItWorks />


      {/* Delivery Section - Future Scalability Demonstration */}
      <section className="py-12 md:py-24 px-6 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[2rem] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-16 shadow-xl shadow-gray-200/50 border border-gray-100">

            {/* Left Side - Image with Badge */}
            <div className="flex-1 relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-coral/5 rounded-full blur-3xl"></div>
              <img
                src={DeliveryBike}
                alt="Bike Delivery Services - Future Integration"
                className="rounded-2xl shadow-2xl relative z-10 w-full h-auto object-contain"
              />
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 z-20">
                <div className="bg-coral/10 p-3 rounded-full text-coral">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="font-bold">Safe & Secure</div>
                  <div className="text-xs text-gray-500">Tracked Deliveries</div>
                </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
                Reliable Delivery with <br />
                <span className="text-coral">Real-Time Tracking</span>
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed">
                Homedify is designed with scalability in mind. While sellers currently manage their own deliveries, our platform architecture supports future integration with verified logistics partners for real-time tracking and centralized delivery management.
              </p>

              {/* Bullet Points - Future Features */}
              <div className="space-y-4 py-4">
                {[
                  "Verified delivery partners only",
                  "Secure delivery confirmation system",
                  "Tamper-proof packaging guidance",
                  "Dedicated delivery support"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 font-medium text-gray-700">
                    <CheckCircle2 className="text-coral flex-shrink-0" size={18} /> {item}
                  </div>
                ))}
              </div>

              {/* Future Scope Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FC6A6B]/10 text-[#FC6A6B] rounded-full text-sm font-semibold">
                <span className="w-2 h-2 bg-[#FC6A6B] rounded-full animate-pulse"></span>
                Future Integration Ready
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-12 md:py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="w-24 h-1.5 bg-coral mx-auto rounded-full"></div>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? -1 : idx)}
                  className="w-full px-8 py-6 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-lg text-left text-gray-800">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${faqOpen === idx ? 'bg-coral text-white rotate-180' : 'bg-coral/10 text-coral'}`}>
                    {faqOpen === idx ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${faqOpen === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="px-8 pb-6 pt-2 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-12 md:py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Meet the Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              The young minds behind Homedify initiative.
            </p>
            <div className="w-24 h-1.5 bg-coral mx-auto rounded-full mt-6"></div>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {team.map((member, i) => (
              <div
                key={i}
                className="group bg-white p-8 rounded-[1.5rem] text-center shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-coral/20 hover:-translate-y-2"
              >
                {/* Profile Image */}
                <div className="relative w-36 h-36 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-coral/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>

                {/* Member Info */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-coral transition-colors">
                  {member.name}
                </h3>
                <p className="text-coral font-semibold mb-6 text-sm uppercase tracking-wide">
                  {member.role}
                </p>


              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900 rounded-[2rem] p-8 md:p-16 flex flex-col lg:flex-row gap-16 shadow-2xl">
            <div className="flex-1 text-white">
              <h2 className="text-4xl font-extrabold mb-8">Get In Touch</h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Have questions about our platform or need support? Our team is here to help you 24/7. Reach out to us through any channel below.
              </p>
              <div className="space-y-6">
                {[
                  { icon: <Mail className="text-coral" />, text: "contact@homedify.com", label: "Email us at" },
                  { icon: <Phone className="text-coral" />, text: "+92 311 5809634", label: "Call us on" },
                  { icon: <MapPin className="text-coral" />, text: "Lahore, Pakistan", label: "Visit our office" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{item.label}</div>
                      <div className="text-xl font-bold text-white">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white p-8 md:p-12 rounded-[2rem]">
              <form 
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = {
                    name: formData.get('contact-name'),
                    email: formData.get('contact-email'),
                    subject: formData.get('contact-subject'),
                    message: formData.get('contact-message')
                  };

                  try {
                    const res = await axios.post('/api/v1/site/contact', data);
                    if (res.data.success) {
                      toast.success('Message sent! We will get back to you soon.');
                      e.target.reset();
                    }
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to send message');
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
                    <input id="contact-name" name="contact-name" type="text" required className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-coral focus:bg-white rounded-xl transition-all outline-none" placeholder="Enter your name" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email</label>
                    <input id="contact-email" name="contact-email" type="email" required className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-coral focus:bg-white rounded-xl transition-all outline-none" placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Subject</label>
                  <input id="contact-subject" name="contact-subject" type="text" required className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-coral focus:bg-white rounded-xl transition-all outline-none" placeholder="What can we help you with?" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Message</label>
                  <textarea id="contact-message" name="contact-message" rows="4" required className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-coral focus:bg-white rounded-xl transition-all outline-none resize-none" placeholder="Your message here..."></textarea>
                </div>
                <button type="submit" className="w-full bg-coral hover:bg-coral-dark text-white px-8 py-5 rounded-xl font-bold text-lg shadow-xl shadow-coral/20 transition-all flex items-center justify-center gap-3">
                  Send Message <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Testimonials */}
      <Testimonials />

      {/* Shared CTA Banner */}
      <CTABanner />

      <Footer />
    </div>
  );
};

export default Landing;
