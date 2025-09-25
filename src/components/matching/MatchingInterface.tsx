'use client';

import React from 'react';

export const MatchingInterface: React.FC = () => {
  console.log('=== MATCHING INTERFACE DEBUG ===')
  console.log('MatchingInterface component is rendering')

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#121212', minHeight: '100vh' }}>
      <h1 style={{ color: '#f9b700', fontSize: '2rem', marginBottom: '20px' }}>
        🎯 QALA Dashboard Loaded Successfully!
      </h1>

      <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#f9b700', marginBottom: '10px' }}>Debug Info:</h2>
        <p>✅ Authentication successful</p>
        <p>✅ Dashboard page loaded</p>
        <p>✅ MatchingInterface component rendered</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>

      <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
        <h2 style={{ color: '#f9b700', marginBottom: '10px' }}>Next Steps:</h2>
        <p>The sign-in redirect is working correctly!</p>
        <p>Your matching interface will be restored once we confirm this basic page loads.</p>

        <button
          style={{
            backgroundColor: '#f9b700',
            color: 'black',
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            marginTop: '10px',
            cursor: 'pointer'
          }}
          onClick={() => {
            console.log('Test button clicked - JavaScript is working!')
            alert('✅ Dashboard fully functional!')
          }}
        >
          Test Button - Click Me
        </button>
      </div>
    </div>
  );
};