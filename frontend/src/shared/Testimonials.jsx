import React from 'react';
import { Quote, Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Ayesha Khan',
      role: 'Home Chef',
      text: 'Homedify helped me reach hundreds of customers from the comfort of my home. The verification gives buyers confidence.',
      rating: 5
    },
    {
      name: 'Zara Ahmed',
      role: 'Handicraft Artist',
      text: 'The onboarding was seamless, and the support team is always there to help. I love the secure payment system.',
      rating: 5
    },
    {
      name: 'Fatima Hassan',
      role: 'Soap Maker',
      text: 'Finally a platform that understands female entrepreneurs in Pakistan. Fast delivery and reliable payments.',
      rating: 5
    }
  ];

  return (
    <section className="py-20 px-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">What Our Sellers Say</h2>
          <div className="w-24 h-1.5 bg-coral mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-coral/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 text-coral/10 group-hover:text-coral/20 transition-colors">
                <Quote size={60} />
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-coral text-coral" />
                ))}
              </div>

              <p className="text-gray-600 italic leading-relaxed mb-8 relative z-10">"{t.text}"</p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-coral/10 rounded-full flex items-center justify-center text-coral font-bold text-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
