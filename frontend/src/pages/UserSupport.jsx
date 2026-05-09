import React from 'react'
import UserLayout from '../shared/UserLayout'
import { MessageSquare, LifeBuoy, FileQuestion, Book, ArrowRight, ExternalLink } from 'lucide-react'

const SupportCard = ({ icon: Icon, title, description, to, primary }) => (
    <div className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-xl hover:shadow-slate-100 group ${primary ? 'bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-200' : 'bg-white border-[#EEEEEE] text-slate-900'
        }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${primary ? 'bg-coral text-white' : 'bg-coral/10 text-coral'
            }`}>
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2 italic">{title}</h3>
        <p className={`text-sm font-medium leading-relaxed mb-6 ${primary ? 'text-slate-400' : 'text-slate-500'
            }`}>{description}</p>
        <button className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${primary ? 'text-coral group-hover:gap-4' : 'text-coral group-hover:gap-4'
            }`}>
            {primary ? 'Start Conversation' : 'Explore Guide'} <ArrowRight size={14} />
        </button>
    </div>
)

const FAQItem = ({ question, answer }) => (
    <div className="py-6 border-b border-[#EEEEEE] last:border-0">
        <h4 className="text-sm font-black text-slate-900 mb-2 tracking-tight">{question}</h4>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{answer}</p>
    </div>
)

const UserSupport = () => {
    return (
        <UserLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* HEADER */}
                <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
                    <span className="text-[10px] font-black text-coral uppercase tracking-[0.3em]">Support Center</span>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">How can we assist your collection?</h1>
                    <p className="text-slate-400 text-sm font-medium px-8">Our artisan curators and support specialists are here to ensure your Homedify experience is truly premium.</p>
                </div>

                {/* OPTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <SupportCard
                        icon={MessageSquare}
                        title="Live Curators"
                        description="Direct assistance for order issues or product inquiries with our team."
                        primary={true}
                    />
                    <SupportCard
                        icon={Book}
                        title="Help Center"
                        description="Extensive guides on shipping, artisan vetting, and buyer protection."
                        primary={false}
                    />
                    <SupportCard
                        icon={FileQuestion}
                        title="Track Claims"
                        description="Monitor status of your protection claims or return requests."
                        primary={false}
                    />
                </div>

                {/* FAQ SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-12 items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <LifeBuoy size={20} className="text-coral" />
                            <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Frequently Asked</h2>
                        </div>
                        <div className="space-y-2">
                            <FAQItem
                                question="How long does artisan delivery take?"
                                answer="Most handcrafted items are shipped within 3-5 business days. Custom commissions may take longer depending on the artisan's queue."
                            />
                            <FAQItem
                                question="Are my payments protected?"
                                answer="Yes, Homedify uses Secure Escrow. Artisans only receive payment once you confirm receipt of your order in perfect condition."
                            />
                            <FAQItem
                                question="Can I return a handcrafted item?"
                                answer="Returns are accepted within 14 days if the item is damaged or significantly different from the description. Custom items are generally non-refundable."
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100">
                        <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">Technical Support?</h3>
                        <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed">
                            If you're experiencing app issues, platform bugs, or payment failures, please include a screenshot or error code in your ticket.
                        </p>
                        <div className="space-y-4">
                            <div className="p-5 bg-white rounded-2xl border border-[#EEEEEE] flex items-center justify-between group cursor-pointer hover:border-coral/30 transition-all">
                                <div>
                                    <p className="text-xs font-black text-slate-900 mb-1">API Status</p>
                                    <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-pulse" /> All Systems Operational
                                    </div>
                                </div>
                                <ExternalLink size={16} className="text-slate-300 group-hover:text-coral transition-all" />
                            </div>
                            <button className="w-full py-4 bg-white text-slate-900 border border-[#EEEEEE] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                                System Logs & Performance
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    )
}

export default UserSupport
