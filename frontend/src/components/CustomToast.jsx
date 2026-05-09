import React from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

const CustomToast = ({ type, message, duration = 3000, toastId }) => {
    const config = {
        success: {
            bg: 'bg-white',
            border: 'border-l-4 border-green-500',
            iconBg: 'bg-green-100',
            icon: <CheckCircle2 size={22} className="text-green-600" />,
            progressBg: 'bg-green-500',
            label: 'Success'
        },
        error: {
            bg: 'bg-white',
            border: 'border-l-4 border-red-500',
            iconBg: 'bg-red-100',
            icon: <XCircle size={22} className="text-red-600" />,
            progressBg: 'bg-red-500',
            label: 'Error'
        },
        info: {
            bg: 'bg-white',
            border: 'border-l-4 border-blue-500',
            iconBg: 'bg-[#FC6A6B]/10',
            icon: <AlertCircle size={22} className="text-[#FC6A6B]" />,
            progressBg: 'bg-[#FC6A6B]/10',
            label: 'Info'
        }
    }

    const c = config[type] || config.info

    return (
        <div className={`${c.bg} ${c.border} rounded-xl shadow-xl overflow-hidden min-w-[320px] max-w-[400px] relative`}>
            <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Colored icon circle */}
                <div className={`${c.iconBg} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {c.icon}
                </div>

                {/* Message */}
                <div className="flex-1 text-sm font-semibold text-gray-800 leading-snug">
                    {message}
                </div>

                {/* Close button */}
                {toastId && (
                    <button
                        onClick={() => toast.dismiss(toastId)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100">
                <div
                    className={`h-full ${c.progressBg} rounded-full`}
                    style={{ animation: `toastShrink ${duration}ms linear forwards` }}
                />
            </div>

            <style>{`
                @keyframes toastShrink {
                    from { width: 100%; }
                    to   { width: 0%;   }
                }
            `}</style>
        </div>
    )
}

export default CustomToast
