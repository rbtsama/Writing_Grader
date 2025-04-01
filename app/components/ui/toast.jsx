"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';

// Toast Context
const ToastContext = createContext(null);

// Toast内容组件
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose();
    }, 5000); // 5秒后自动关闭
    
    return () => clearTimeout(timeout);
  }, [onClose]);
  
  const bgColor = type === 'error' ? 'bg-red-100 border-red-400' : 
                  type === 'success' ? 'bg-green-100 border-green-400' : 
                  'bg-blue-100 border-blue-400';
  
  const textColor = type === 'error' ? 'text-red-700' : 
                   type === 'success' ? 'text-green-700' : 
                   'text-blue-700';
  
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${bgColor} border-l-4 z-50 flex items-center justify-between max-w-md`}>
      <div className={`font-medium ${textColor}`}>{message}</div>
      <button
        onClick={onClose}
        className="ml-4 text-gray-500 hover:text-gray-700"
      >
        确定
      </button>
    </div>
  );
};

// Toast Provider组件
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const hideToast = () => {
    setToast(null);
  };
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </ToastContext.Provider>
  );
};

// 自定义Hook用于使用Toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast必须在ToastProvider内部使用');
  }
  return context;
}; 