import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    to,
    href,
    onClick,
    disabled = false,
    type = 'button',
    className = '',
    ...props
}) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none';

    // Size variants
    const sizeStyles = {
        sm: 'px-3 py-2 text-sm gap-1.5',
        md: 'px-6 py-3 text-base gap-2',
        lg: 'px-8 py-4 text-lg gap-3',
        xl: 'px-10 py-5 text-xl gap-3',
    };

    // Color variants
    const variantStyles = {
        primary: 'bg-coral !text-white hover:bg-coral-dark font-black shadow-xl shadow-coral/30 hover:-translate-y-1',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-md hover:shadow-lg hover:-translate-y-0.5',
        outline: 'bg-transparent border-2 border-coral text-coral hover:bg-coral-light',
        ghost: 'bg-transparent text-gray-600 hover:text-coral hover:bg-coral-light',
        white: 'bg-white text-coral hover:bg-gray-50 shadow-lg',
    };

    const combinedClasses = `
    ${baseStyles}
    ${sizeStyles[size] || sizeStyles.md}
    ${variantStyles[variant] || variantStyles.primary}
    ${className}
  `.trim();

    // If 'to' is provided, use React Router Link
    if (to) {
        return (
            <Link to={to} className={combinedClasses} {...props}>
                {children}
            </Link>
        );
    }

    // If 'href' is provided, use standard anchor tag
    if (href) {
        return (
            <a href={href} className={combinedClasses} {...props}>
                {children}
            </a>
        );
    }

    // Otherwise, render a button
    return (
        <button
            type={type}
            className={combinedClasses}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
