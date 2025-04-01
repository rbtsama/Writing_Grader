"use client";

import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  className = "", 
  disabled = false, 
  variant = "default", 
  size = "default" 
}) => {
  const baseClasses = "flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 hover:bg-gray-100",
    ghost: "hover:bg-gray-100"
  };
  
  const sizeClasses = {
    default: "h-10 py-2 px-4 rounded-md",
    sm: "h-8 px-3 rounded-md text-sm"
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button 
      className={classes} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export { Button }; 