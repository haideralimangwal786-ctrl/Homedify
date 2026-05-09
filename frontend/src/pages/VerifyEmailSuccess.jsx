import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Mail } from 'lucide-react';

const VerifyEmailSuccess = () => {
    return (
        <div className="min-h-screen bg-[#FDFBFB] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center border border-gray-50">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce shadow-inner">
                    <CheckCircle size={40} />
                </div>
                
                <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Email Verified!</h1>
                <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                    Great news! Your email address has been successfully verified. You can now explore all the premium features of Homedify.
                </p>

                <div className="space-y-4">
                    <Link 
                        to="/login" 
                        className="w-full py-4 bg-coral text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-coral/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                        Go to Login
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <Link 
                        to="/" 
                        className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-100 transition-all block"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="fixed top-20 right-20 w-64 h-64 bg-coral/5 rounded-full blur-3xl -z-10" />
            <div className="fixed bottom-20 left-20 w-64 h-64 bg-orange-200/10 rounded-full blur-3xl -z-10" />
        </div>
    );
};

export default VerifyEmailSuccess;
