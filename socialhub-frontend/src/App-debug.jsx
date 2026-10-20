import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading...')
  const [backendStatus, setBackendStatus] = useState('Checking...')

  useEffect(() => {
    setMessage('✅ React is working!')
    
    // Test backend
    fetch('http://localhost:8080/api/health')
      .then(res => res.json())
      .then(data => {
        setBackendStatus('✅ Backend connected: ' + data.data.status)
      })
      .catch(err => {
        setBackendStatus('❌ Backend error: ' + err.message)
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f8faff, #f1f5f9)',
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1e293b'
        }}>
          🎉 SocialHub Debug Page
        </h1>
        
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #86efac',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Frontend Status:</h2>
          <p style={{ fontSize: '18px' }}>{message}</p>
        </div>

        <div style={{
          background: '#eff6ff',
          border: '2px solid #93c5fd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Backend Status:</h2>
          <p style={{ fontSize: '18px' }}>{backendStatus}</p>
        </div>

        <div style={{
          background: '#fef3c7',
          border: '2px solid #fcd34d',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>📋 Instructions:</h2>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>If you see this page → Frontend is working! ✅</li>
            <li>Check backend status above</li>
            <li>Open Console (F12) to see any errors</li>
            <li>If all OK, restore the main App</li>
          </ol>
        </div>

        <button
          onClick={() => {
            alert('Button works! React events are functioning.')
          }}
          style={{
            marginTop: '20px',
            background: '#4f46e5',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Test Button Click
        </button>
      </div>
    </div>
  )
}

export default App
