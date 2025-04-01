"use client";

import React from 'react';

const Alert = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`relative w-full rounded-lg border border-gray-200 p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const AlertTitle = ({ className = "", children, ...props }) => {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
};

const AlertDescription = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`text-sm text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Alert, AlertTitle, AlertDescription }; 