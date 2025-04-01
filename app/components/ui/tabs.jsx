"use client";

import React from 'react';

const TabsContext = React.createContext(null);

const Tabs = ({ value, onValueChange, children, className = "" }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className = "", children }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, className = "", children }) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus:outline-none ${
        isSelected
          ? "bg-white text-blue-700 shadow-sm"
          : "text-gray-600 hover:text-gray-800"
      } ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className = "", children }) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  if (!isSelected) return null;

  return <div className={className}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent }; 