import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Scale, ShieldCheck, AlertCircle } from 'lucide-react'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-coral hover:text-coral-dark font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-coral/10 text-coral rounded-2xl flex items-center justify-center">
                            <Scale size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900">Terms of Service</h1>
                            <p className="text-gray-500 font-medium mt-1">Last updated: February 14, 2026</p>
                        </div>
                    </div>

                    <div className="bg-coral/5 border border-coral/20 rounded-2xl p-6 flex items-start gap-4">
                        <AlertCircle className="text-coral flex-shrink-0 mt-1" size={24} />
                        <p className="text-gray-700 font-medium">
                            By creating an account or using Homedify, you agree to be bound by these Terms of Service. Please read them carefully.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-8">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">1</span>
                            Introduction
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                Welcome to <span className="font-bold text-gray-900">Homedify</span>, a marketplace platform empowering female entrepreneurs in Pakistan to sell handmade crafts, homemade food, and artisanal products.
                            </p>
                            <p>
                                These Terms of Service ("Terms") govern your access to and use of the Homedify platform, including our website, mobile applications, and related services (collectively, the "Services").
                            </p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">2</span>
                            User Accounts
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">Account Registration:</span> To use certain features of Homedify, you must create an account. You agree to provide accurate, current, and complete information during registration.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Account Security:</span> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Account Types:</span> Homedify offers two types of accounts: Buyer accounts and Seller accounts. Seller accounts are exclusively available to female entrepreneurs.
                            </p>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">3</span>
                            Seller Obligations
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">Identity Verification:</span> All sellers must complete our identity verification process, which includes submitting a valid CNIC (Computerized National Identity Card) and biometric verification.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Product Listings:</span> Sellers must accurately describe their products, including materials, dimensions, and any relevant details. Misleading or false product information is prohibited.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Product Quality:</span> Sellers are responsible for ensuring that products meet acceptable quality standards and comply with all applicable food safety and craft regulations.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Order Fulfillment:</span> Sellers must fulfill orders promptly and maintain communication with buyers regarding order status and shipping.
                            </p>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">4</span>
                            Buyer Rights and Responsibilities
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">Purchase Terms:</span> By placing an order, you agree to pay the listed price plus any applicable taxes and shipping fees.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Reviews:</span> Buyers may leave honest reviews of products and sellers. Reviews must not contain offensive language, personal attacks, or false information.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Communication:</span> Buyers should communicate respectfully with sellers and respond to seller inquiries regarding orders.
                            </p>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">5</span>
                            Payments and Fees
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">Payment Processing:</span> All payments are processed through secure third-party payment processors. Homedify does not store your payment card information.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Platform Fees:</span> Homedify charges a commission on each sale. The current commission structure is available in the seller dashboard.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Seller Payouts:</span> Sellers receive payments after a holding period to allow for returns and disputes. The standard holding period is 7-14 days after order delivery.
                            </p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">6</span>
                            Refunds and Returns
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">Return Policy:</span> Buyers may request returns for damaged, defective, or significantly misrepresented products within 7 days of delivery.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Food Products:</span> Due to the perishable nature of food products, returns are only accepted for quality issues reported within 24 hours of delivery.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Refund Process:</span> Approved refunds will be processed to the original payment method within 5-10 business days.
                            </p>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">7</span>
                            Prohibited Activities
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p className="font-bold text-gray-900">You may not:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Sell counterfeit, stolen, or illegal products</li>
                                <li>Engage in fraudulent activities or money laundering</li>
                                <li>Harass, threaten, or abuse other users</li>
                                <li>Manipulate reviews or ratings</li>
                                <li>Use automated systems to access the platform without permission</li>
                                <li>Circumvent our fee structure</li>
                                <li>Sell products that violate health and safety regulations</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">8</span>
                            Dispute Resolution
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">Internal Resolution:</span> We encourage buyers and sellers to resolve disputes directly through our messaging system.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Platform Mediation:</span> If direct resolution fails, either party may request platform mediation. Our team will review the case and make a fair decision.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">Legal Jurisdiction:</span> These Terms are governed by the laws of Pakistan. Any legal disputes will be subject to the exclusive jurisdiction of courts in Pakistan.
                            </p>
                        </div>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">9</span>
                            Intellectual Property
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">Platform Content:</span> All content on the Homedify platform, including logos, designs, and software, is owned by Homedify and protected by intellectual property laws.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">User Content:</span> Sellers retain ownership of their product images and descriptions but grant Homedify a license to display this content on the platform.
                            </p>
                        </div>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">10</span>
                            Limitation of Liability
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                Homedify acts as a marketplace platform connecting buyers and sellers. We are not responsible for the quality, safety, or legality of products sold through the platform.
                            </p>
                            <p>
                                To the maximum extent permitted by law, Homedify is not liable for any indirect, incidental, or consequential damages arising from your use of the Services.
                            </p>
                        </div>
                    </section>

                    {/* Section 11 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">11</span>
                            Account Termination
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                <span className="font-bold text-gray-900">By You:</span> You may close your account at any time by contacting our support team.
                            </p>
                            <p>
                                <span className="font-bold text-gray-900">By Homedify:</span> We reserve the right to suspend or terminate accounts that violate these Terms or engage in prohibited activities.
                            </p>
                        </div>
                    </section>

                    {/* Section 12 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">12</span>
                            Changes to Terms
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                Homedify reserves the right to modify these Terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the Services after changes constitutes acceptance of the updated Terms.
                            </p>
                        </div>
                    </section>

                    {/* Contact */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
                            <ShieldCheck className="text-coral flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h3 className="font-black text-gray-900 mb-2">Questions or Concerns?</h3>
                                <p className="text-gray-600 font-medium">
                                    If you have any questions about these Terms of Service, please contact us at{' '}
                                    <a href="mailto:legal@homedify.com" className="text-coral font-bold hover:underline">
                                        legal@homedify.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default TermsOfService
