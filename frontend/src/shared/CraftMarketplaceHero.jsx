import React from 'react';
import { Sparkles } from 'lucide-react';
import Button from './Button';
import CraftMarketplaceImage from '../assets/FoodMarketplaceImage.png';

const CraftMarketplaceHero = () => {
    return (
        <section className=" py-16 md:py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* Left side - Text & CTA */}
                    <div className="flex-1 text-center lg:text-left space-y-6">
                        {/* Title */}
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Homedify <span className="text-coral">Craft</span> Marketplace
                        </h2>

                        {/* Description */}
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            Explore exquisite handmade crafts created by talented home-based female artisans. Each piece is a unique work of art, crafted with skill, tradition, and love.
                        </p>

                        {/* CTA Button */}
                        <div className="flex justify-center lg:justify-start">
                            <Button
                                to="/shop?category=craft"
                                variant="primary"
                                size="lg"
                            >
                                <Sparkles size={22} />
                                Shop Crafts
                            </Button>
                        </div>
                    </div>

                    {/* Right side - Image */}
                    <div className="flex-1 relative w-full flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-md">
                            <img
                                src={CraftMarketplaceImage}
                                alt="Home-based female artisan crafting handmade items"
                                className="w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default CraftMarketplaceHero;
