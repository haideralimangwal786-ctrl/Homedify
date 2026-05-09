import React from 'react'
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Heart } from 'lucide-react'
import logo from '../assets/logo.png'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6 text-center md:text-left">
            <a href="/" className="flex items-center justify-center md:justify-start gap-2 group">
              <img src={logo} alt="Homedify" className="h-14 w-auto object-contain" />
            </a>
            <p className="text-gray-500 text-sm leading-relaxed">
              Empowering home-based female entrepreneurs to showcase their craftsmanship and reach a global audience.
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-coral hover:text-white transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-coral hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-coral hover:text-white transition-all">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="text-gray-900 font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="/" className="text-gray-500 text-sm hover:text-coral transition-colors">Home</a></li>
              <li><a href="/shop" className="text-gray-500 text-sm hover:text-coral transition-colors">Shop</a></li>
              <li><a href="/seller/register" className="text-gray-500 text-sm hover:text-coral transition-colors">Become a Seller</a></li>
              <li><a href="#" className="text-gray-500 text-sm hover:text-coral transition-colors">Categories</a></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="text-center md:text-left">
            <h4 className="text-gray-900 font-bold mb-6">Support</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-500 text-sm hover:text-coral transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-500 text-sm hover:text-coral transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 text-sm hover:text-coral transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-500 text-sm hover:text-coral transition-colors">Refund Policy</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h4 className="text-gray-900 font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-500 text-sm">
                <MapPin size={18} className="text-coral" />
                Electronic City, Pakistan
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-500 text-sm">
                <Phone size={18} className="text-coral" />
                +92 311 5809634
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-500 text-sm">
                <Mail size={18} className="text-coral" />
                support@homedify.com
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Homedify. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            Made with <Heart size={12} className="text-coral fill-coral" /> for Female Entrepreneurs
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
