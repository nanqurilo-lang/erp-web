"use client"
import React, { useState } from 'react';

const Login = () => {
  const [userType, setUserType] = useState('employee');

  const handleUserTypeChange = (type: any) => {
    setUserType(type);
    // Add logic here for handling user type selection
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome Back</h1>
        <p className="text-center text-gray-600 mb-6">Please select your login type</p>
        
        <div className="flex justify-center gap-4 mb-8">
          <button
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              userType === 'admin' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handleUserTypeChange('admin')}
          >
            Admin
          </button>
          <button
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              userType === 'employee' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handleUserTypeChange('employee')}
          >
            Employee
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Add login submission logic here
            }}
          >
            Log In
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Forgot your password?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Reset it
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;