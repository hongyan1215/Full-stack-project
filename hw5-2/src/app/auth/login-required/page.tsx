import React from 'react';

export default function LoginRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h1>
        <p className="text-gray-600 mb-6">
          Please access the dashboard through the link provided by the LINE Bot.
        </p>
        <div className="text-sm text-gray-500">
          Return to the chat and type "Dashboard".
        </div>
      </div>
    </div>
  );
}


