import React from 'react';
import { Store, ArrowRight, Sparkles } from 'lucide-react';

const CTABanner = () => {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-coral to-coral-dark rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-coral/30">
          {/* Decorative elements */}
          <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium mb-6">
                <Sparkles size={14} /> Join 500+ Verified Sellers
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
                Ready to Start Your <br className="hidden md:block" /> Online Business?
              </h2>
              <p className="text-lg text-white/80 max-w-xl">
                Join our exclusive community of female entrepreneurs. Get verified, list your products, and reach thousands of customers across Pakistan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <a
                href="/seller/register"
                style={{ color: '#FF5252', backgroundColor: '#FFFFFF' }}
                className="group flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-extrabold text-xl hover:scale-105 transition-all duration-300 shadow-2xl shadow-black/10 whitespace-nowrap"
              >
                <Store size={26} style={{ color: '#FF5252' }} />
                <span className="tracking-tight">Become a Seller</span>
                <ArrowRight size={24} style={{ color: '#FF5252' }} className="group-hover:translate-x-2 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
