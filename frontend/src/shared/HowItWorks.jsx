import React from 'react';
import { UserPlus, FileCheck, ShoppingBag, ShieldCheck } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <UserPlus className="w-8 h-8" />,
      title: 'Create an Account',
      description: 'Users register to shop, and sellers apply to start selling on Homedify.',
      color: 'bg-coral/10',
      textColor: 'text-coral'
    },
    {
      icon: <FileCheck className="w-8 h-8" />,
      title: 'Seller Verification',
      description: 'All sellers are verified by the admin to ensure trust and authenticity.',
      color: 'bg-[#FC6A6B]/10',
      textColor: 'text-[#FC6A6B]'
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: 'Browse & Order',
      description: 'Customers browse products, add to cart, and place orders easily.',
      color: 'bg-coral/10',
      textColor: 'text-coral'
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: 'Delivery & Payment',
      description: 'Orders are delivered securely, and payments are safely managed by the platform.',
      color: 'bg-[#FC6A6B]/10',
      textColor: 'text-[#FC6A6B]'
    }
  ];

  return (
    <div className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How Homedify Works
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            A simple and secure way to buy handmade crafts and non-fresh food from verified home-based sellers.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:border-coral/30 hover:shadow-2xl hover:shadow-coral/10 transition-all duration-500"
            >
              {/* Step Number */}
              <div className="absolute top-4 right-6 text-6xl font-black text-gray-100 group-hover:text-coral/10 transition-colors">
                0{i + 1}
              </div>

              {/* Icon */}
              <div className={`${step.color} ${step.textColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed relative z-10">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
