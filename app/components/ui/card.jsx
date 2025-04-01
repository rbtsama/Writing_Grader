"use client";

import React from 'react';

const Card = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card }; 