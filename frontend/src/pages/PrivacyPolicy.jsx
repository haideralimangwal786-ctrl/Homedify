import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Database, Globe } from 'lucide-react'
import Navbar from '../shared/Navbar'
import Footer from '../shared/Footer'

const PrivacyPolicy = () => {
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
                            <Shield size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900">Privacy Policy</h1>
                            <p className="text-gray-500 font-medium mt-1">Last updated: February 14, 2026</p>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
                        <Lock className="text-green-600 flex-shrink-0 mt-1" size={24} />
                        <p className="text-gray-700 font-medium">
                            Your privacy is important to us. This policy explains how Homedify collects, uses, and protects your personal information.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-8">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">1</span>
                            Information We Collect
                        </h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed pl-11">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Personal Information</h3>
                                <p>When you create an account, we collect:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                                    <li>Full name</li>
                                    <li>Email address</li>
                                    <li>Phone number</li>
                                    <li>Password (encrypted)</li>
                                    <li>Delivery addresses</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Seller Verification Data</h3>
                                <p>For seller accounts, we additionally collect:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                                    <li>CNIC (Computerized National Identity Card) information</li>
                                    <li>Biometric verification data (facial recognition)</li>
                                    <li>Shop name and business details</li>
                                    <li>Bank account information for payouts</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Automatically Collected Information</h3>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>IP address and device information</li>
                                    <li>Browser type and version</li>
                                    <li>Pages visited and time spent on the platform</li>
                                    <li>Referring website addresses</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">2</span>
                            How We Use Your Information
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>We use your information to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><span className="font-bold text-gray-900">Provide Services:</span> Create and manage your account, process orders, and facilitate transactions</li>
                                <li><span className="font-bold text-gray-900">Verification:</span> Verify seller identities to maintain platform trust and safety</li>
                                <li><span className="font-bold text-gray-900">Communication:</span> Send order updates, platform notifications, and customer support responses</li>
                                <li><span className="font-bold text-gray-900">Improvement:</span> Analyze platform usage to improve features and user experience</li>
                                <li><span className="font-bold text-gray-900">Marketing:</span> Send promotional emails (you can opt out anytime)</li>
                                <li><span className="font-bold text-gray-900">Security:</span> Detect and prevent fraud, abuse, and security incidents</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">3</span>
                            Information Sharing
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p className="font-bold text-gray-900">We share your information only in these circumstances:</p>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">With Sellers and Buyers</h3>
                                <p>When you make a purchase, sellers receive your name, delivery address, and contact information to fulfill orders.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">With Service Providers</h3>
                                <p>We work with trusted third-party service providers for:</p>
                                <ul className="list-disc list-inside ml-4 mt-1">
                                    <li>Payment processing (Stripe, JazzCash, EasyPaisa)</li>
                                    <li>Cloud hosting (AWS, Google Cloud)</li>
                                    <li>Email services</li>
                                    <li>Analytics and monitoring</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Legal Compliance</h3>
                                <p>We may disclose information if required by law, court order, or government request.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Business Transfers</h3>
                                <p>If Homedify is acquired or merged, your information may be transferred to the new entity.</p>
                            </div>

                            <p className="font-bold text-coral mt-4">
                                We never sell your personal information to third parties for marketing purposes.
                            </p>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">4</span>
                            Data Security
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>We implement industry-standard security measures to protect your data:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><span className="font-bold text-gray-900">Encryption:</span> All data transmitted between your device and our servers is encrypted using SSL/TLS</li>
                                <li><span className="font-bold text-gray-900">Password Protection:</span> Passwords are hashed using bcrypt before storage</li>
                                <li><span className="font-bold text-gray-900">Access Controls:</span> Only authorized personnel have access to sensitive data</li>
                                <li><span className="font-bold text-gray-900">Regular Audits:</span> We conduct security audits and vulnerability assessments</li>
                                <li><span className="font-bold text-gray-900">Secure Payment Processing:</span> We do not store your complete payment card information</li>
                            </ul>
                            <p className="mt-4 text-sm italic">
                                While we strive to protect your data, no method of transmission over the internet is 100% secure. Please use strong passwords and keep your login credentials confidential.
                            </p>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">5</span>
                            Cookies and Tracking
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>Homedify uses cookies and similar tracking technologies to:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Keep you logged in</li>
                                <li>Remember your preferences</li>
                                <li>Analyze site traffic and usage patterns</li>
                                <li>Personalize your experience</li>
                            </ul>
                            <p className="mt-3">
                                You can control cookie settings through your browser. However, disabling cookies may limit some platform features.
                            </p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">6</span>
                            Third-Party Services
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Google OAuth</h3>
                                <p>
                                    If you sign up using Google, we receive basic profile information from Google (name, email, profile picture). This is governed by Google's Privacy Policy.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Payment Processors</h3>
                                <p>
                                    Payment transactions are handled by third-party processors (Stripe, JazzCash, EasyPaisa). We do not have access to your complete payment card details.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Analytics</h3>
                                <p>
                                    We use Google Analytics and similar tools to understand platform usage. These services may collect information about your visits.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">7</span>
                            Your Rights and Choices
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p className="font-bold text-gray-900">You have the right to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><span className="font-bold text-gray-900">Access:</span> Request a copy of your personal data</li>
                                <li><span className="font-bold text-gray-900">Correction:</span> Update or correct inaccurate information</li>
                                <li><span className="font-bold text-gray-900">Deletion:</span> Request deletion of your account and data (subject to legal obligations)</li>
                                <li><span className="font-bold text-gray-900">Opt-Out:</span> Unsubscribe from marketing emails via the link in each email</li>
                                <li><span className="font-bold text-gray-900">Data Portability:</span> Request your data in a portable format</li>
                            </ul>
                            <p className="mt-4">
                                To exercise these rights, contact us at{' '}
                                <a href="mailto:privacy@homedify.com" className="text-coral font-bold hover:underline">
                                    privacy@homedify.com
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">8</span>
                            Data Retention
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Transaction records for accounting and legal compliance (up to 7 years)</li>
                                <li>Communication logs for dispute resolution</li>
                                <li>Anonymized data for analytics</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">9</span>
                            Children's Privacy
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                Homedify is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                            </p>
                        </div>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">10</span>
                            International Data Transfers
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                Your information may be transferred to and stored on servers located outside Pakistan. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                            </p>
                        </div>
                    </section>

                    {/* Section 11 */}
                    <section>
                        <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-coral text-white rounded-lg flex items-center justify-center text-sm font-black">11</span>
                            Changes to This Privacy Policy
                        </h2>
                        <div className="space-y-3 text-gray-600 leading-relaxed pl-11">
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform notification. The "Last updated" date at the top indicates when changes were made.
                            </p>
                        </div>
                    </section>

                    {/* Contact */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
                            <Database className="text-coral flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h3 className="font-black text-gray-900 mb-2">Contact Us About Privacy</h3>
                                <p className="text-gray-600 font-medium mb-3">
                                    If you have questions or concerns about this Privacy Policy or how we handle your data, please contact us:
                                </p>
                                <div className="space-y-1 text-sm">
                                    <p>
                                        <span className="font-bold text-gray-700">Email:</span>{' '}
                                        <a href="mailto:privacy@homedify.com" className="text-coral font-bold hover:underline">
                                            privacy@homedify.com
                                        </a>
                                    </p>
                                    <p>
                                        <span className="font-bold text-gray-700">Data Protection Officer:</span>{' '}
                                        <a href="mailto:dpo@homedify.com" className="text-coral font-bold hover:underline">
                                            dpo@homedify.com
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default PrivacyPolicy
