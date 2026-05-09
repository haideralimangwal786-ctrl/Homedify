import React from 'react';
import { ShoppingBag, Store } from 'lucide-react';
import Button from './Button';
import Heroimage1 from '../assets/Heroimage1.png';
import Heroimage2 from '../assets/Heroimage2.png';
import Heroimage3 from '../assets/Heroimage3.png';

const Hero = ({ content = {} }) => {
  const title = content.heroTitle || "Discover Unique Handmade Crafts & Delicious Treats";
  const subtitle = content.heroSubtitle || "Support female home-based sellers and explore exclusive craft and food items.";
  const banner = content.bannerUrl || Heroimage1;

  return (
    <section className="bg-white py-12 md:py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left side - Text & CTA */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Heading */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
              {title}
            </h1>

            {/* Subheading */}
            <p className="text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {subtitle}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              {/* Shop Now - Primary Button */}
              <Button
                to="/shop"
                variant="primary"
                size="xl"
                className="w-full sm:w-auto"
              >
                <ShoppingBag size={22} />
                Shop Now
              </Button>

              {/* Become a Seller - Secondary Button */}
              <Button
                to="/seller/register"
                variant="secondary"
                size="xl"
                className="w-full sm:w-auto"
              >
                <Store size={22} />
                Become a Seller
              </Button>
            </div>
          </div>

          {/* Right side - Images with overlapping layout */}
          <div className="flex-1 relative w-full h-[350px] sm:h-[450px] md:h-[500px] lg:h-[600px] mt-8 lg:mt-0">
            {/* Image 1 - Handmade craft item (Top Left) */}
            <div className="absolute top-0 left-0 w-[55%] h-[50%] z-30 transform -rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500">
              <img
                src={banner}
                alt="Handmade craft item"
                className="w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-white"
              />
            </div>

            {/* Image 2 - Non-fresh food item (Top Right) */}
            <div className="absolute top-[15%] right-0 w-[55%] h-[50%] z-20 transform rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500">
              <img
                src={Heroimage2}
                alt="Non-fresh food item"
                className="w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-white"
              />
            </div>

            {/* Image 3 - Combination of craft + food (Bottom Center) */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[60%] h-[50%] z-10 rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500">
              <img
                src={Heroimage3}
                alt="Combination of craft and food items"
                className="w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-white"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
