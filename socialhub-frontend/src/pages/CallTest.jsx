import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import webrtcService from '../services/webrtcService'
import websocketService from '../services/websocketService'
import callApi from '../services/callApi'
import api from '../services/api'

/**
 * WebRTC Call Test Page
 * Test voice/video calling with ICE servers, signaling, and media controls
 */
export default function CallTest() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [callType, setCallType] = useState('VOICE')
  const [conversationId, setConversationId] = useState('')
  
  // Call state
  const [callId, setCallId] = useState(null)
  const [callState, setCallState] = useState('IDLE')
  const [isInitiator, setIsInitiator] = useState(false)
  const [iceConnectionState, setIceConnectionState] = useState('new')
  
  // Media state
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  
  // Refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  
  // ICE servers
  const [iceServers, setIceServers] = useState(null)
  
  // Logs
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Load test users
    loadUsers()
    
    // Initialize WebRTC
    initializeWebRTC()
    
    // Setup WebSocket listener
    const handleCallMessage = (message) => {
      log(`📩 Received: ${message.type}`, message)
      handleIncomingSignal(message)
    }
    
    websocketService.subscribe(handleCallMessage)
    
    return () => {
      websocketService.unsubscribe(handleCallMessage)
      webrtcService.endCall()
    }
  }, [])

  const log = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, data }])
    console.log(`[CallTest] ${message}`, data)
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/users', { params: { page: 0, size: 20 } })
      const allUsers = response.data.content || []
      // Filter out current user
      setUsers(allUsers.filter(u => u.id !== user?.id))
      log('✅ Loaded users', allUsers.length)
    } catch (error) {
      log('❌ Failed to load users', error.message)
    }
  }

  const initializeWebRTC = async () => {
    try {
      await webrtcService.initialize()
      setIceServers(webrtcService.iceServers)
      log('✅ WebRTC initialized with ICE servers', webrtcService.iceServers)
      
      // Setup callbacks
      webrtcService.onRemoteStream = handleRemoteStream
      webrtcService.onIceConnectionStateChange = handleIceStateChange
    } catch (error) {
      log('❌ Failed to initialize WebRTC', error.message)
    }
  }

  const handleRemoteStream = (stream) => {
    log('📺 Received remote stream')
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
    }
  }

  const handleIceStateChange = (state) => {
    log(`🧊 ICE state: ${state}`)
    setIceConnectionState(state)
    
    // Map ICE states to call states
    if (state === 'checking') {
      setCallState('CONNECTING')
    } else if (state === 'connected' || state === 'completed') {
      setCallState('CONNECTED')
    } else if (state === 'failed' || state === 'disconnected') {
      setCallState('FAILED')
    }
  }

  const handleIncomingSignal = async (message) => {
    const { type } = message
    
    if (type === 'incoming') {
      // Incoming call notification
      log('📞 Incoming call', message)
      setCallId(message.callData?.id)
      setCallState('RINGING')
      setIsInitiator(false)
    } else if (type === 'accepted') {
      log('✅ Call accepted')
      setCallState('ACCEPTED')
    } else if (type === 'rejected') {
      log('❌ Call rejected')
      setCallState('REJECTED')
      cleanup()
    } else if (type === 'ended') {
      log('🔚 Call ended')
      setCallState('ENDED')
      cleanup()
    } else if (type === 'busy') {
      log('📵 User busy')
      setCallState('BUSY')
      cleanup()
    } else if (type === 'missed') {
      log('📵 Call missed')
      setCallState('MISSED')
      cleanup()
    } else if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
      // WebRTC signaling
      await webrtcService.handleSignaling(message)
    }
  }

  const startCall = async () => {
    if (!selectedUser || !conversationId) {
      alert('Please select a user and enter conversation ID')
      return
    }

    try {
      log(`📞 Starting ${callType} call to ${selectedUser.username}`)
      setCallState('CALLING')
      setIsInitiator(true)

      // 1. Initiate call via API
      const response = await callApi.initiateCall(conversationId, selectedUser.id, callType)
      const call = response.data
      setCallId(call.id)
      log('✅ Call initiated', call)

      // 2. Get media stream
      const stream = await webrtcService.getMediaStream(callType)
      log('🎤 Got local stream')
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // 3. Start WebRTC connection
      await webrtcService.startCall(call.id, callType, stream)
      log('🔗 WebRTC connection started')
      
    } catch (error) {
      log('❌ Failed to start call', error.message)
      setCallState('FAILED')
    }
  }

  const answerCall = async () => {
    if (!callId) return

    try {
      log('📞 Answering call')
      setCallState('ANSWERING')

      // 1. Accept call via API
      await callApi.acceptCall(callId)
      log('✅ Call accepted via API')

      // 2. Get media stream
      const stream = await webrtcService.getMediaStream(callType)
      log('🎤 Got local stream')
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // 3. Answer WebRTC call
      await webrtcService.answerCall(callId, callType, stream)
      log('🔗 WebRTC answer initiated')
      
      setCallState('CONNECTING')
    } catch (error) {
      log('❌ Failed to answer call', error.message)
      setCallState('FAILED')
    }
  }

  const declineCall = async () => {
    if (!callId) return

    try {
      log('❌ Declining call')
      await callApi.declineCall(callId)
      setCallState('DECLINED')
      cleanup()
    } catch (error) {
      log('❌ Failed to decline call', error.message)
    }
  }

  const endCall = async () => {
    if (!callId) return

    try {
      log('🔚 Ending call')
      await callApi.endCall(callId)
      setCallState('ENDED')
      cleanup()
    } catch (error) {
      log('❌ Failed to end call', error.message)
    }
  }

  const toggleMute = () => {
    const muted = webrtcService.toggleMute()
    setIsMuted(muted)
    log(muted ? '🔇 Muted' : '🔊 Unmuted')
  }

  const toggleVideo = () => {
    const enabled = webrtcService.toggleVideo()
    setIsVideoEnabled(enabled)
    log(enabled ? '📹 Video enabled' : '📷 Video disabled')
  }

  const switchCamera = async () => {
    await webrtcService.switchCamera()
    log('📸 Camera switched')
  }

  const cleanup = () => {
    webrtcService.endCall()
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    setCallId(null)
    setIsInitiator(false)
    setIsMuted(false)
    setIsVideoEnabled(false)
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">WebRTC Call Test</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatarUrl || 'https://via.placeholder.com/40'}
              alt={user?.displayName}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-semibold">{user?.displayName}</p>
              <p className="text-sm text-gray-500">@{user?.username}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                websocketService.isConnected() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {websocketService.isConnected() ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Call Setup */}
          <div className="space-y-4">
            {/* ICE Servers Info */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">ICE Servers</h2>
              {iceServers ? (
                <div className="space-y-2">
                  {iceServers.map((server, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                      <div className="font-mono text-xs text-gray-600">
                        {server.urls.join(', ')}
                      </div>
                      {server.username && (
                        <div className="text-xs text-gray-500 mt-1">
                          Username: {server.username}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>

            {/* Call Setup */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Start Call</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User
                  </label>
                  <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                      const user = users.find(u => u.id === e.target.value)
                      setSelectedUser(user)
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={callState !== 'IDLE'}
                  >
                    <option value="">Choose user...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.displayName} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conversation ID
                  </label>
                  <input
                    type="text"
                    value={conversationId}
                    onChange={(e) => setConversationId(e.target.value)}
                    placeholder="Enter conversation ID"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={callState !== 'IDLE'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCallType('VOICE')}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        callType === 'VOICE'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      disabled={callState !== 'IDLE'}
                    >
                      🎤 Voice
                    </button>
                    <button
                      onClick={() => setCallType('VIDEO')}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        callType === 'VIDEO'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                      disabled={callState !== 'IDLE'}
                    >
                      📹 Video
                    </button>
                  </div>
                </div>

                <button
                  onClick={startCall}
                  disabled={callState !== 'IDLE' || !selectedUser || !conversationId}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📞 Start Call
                </button>
              </div>
            </div>

            {/* Call State */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Call State</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">State:</span>
                  <span className="font-semibold">{callState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ICE State:</span>
                  <span className="font-semibold">{iceConnectionState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-semibold">{isInitiator ? 'Caller' : 'Callee'}</span>
                </div>
                {callId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Call ID:</span>
                    <span className="font-mono text-xs">{callId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            {(callState === 'RINGING' || callState === 'CONNECTING' || callState === 'CONNECTED') && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Controls</h2>
                
                {callState === 'RINGING' && !isInitiator && (
                  <div className="flex gap-2">
                    <button
                      onClick={answerCall}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      ✅ Answer
                    </button>
                    <button
                      onClick={declineCall}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                    >
                      ❌ Decline
                    </button>
                  </div>
                )}

                {(callState === 'CONNECTING' || callState === 'CONNECTED') && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={toggleMute}
                        className={`py-2 rounded-lg font-medium ${
                          isMuted
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                      </button>
                      
                      {callType === 'VIDEO' && (
                        <>
                          <button
                            onClick={toggleVideo}
                            className={`py-2 rounded-lg font-medium ${
                              isVideoEnabled
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isVideoEnabled ? '📹 Video Off' : '📷 Video On'}
                          </button>
                          <button
                            onClick={switchCamera}
                            className="py-2 rounded-lg font-medium bg-gray-100 text-gray-700"
                          >
                            🔄 Switch Camera
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={endCall}
                      className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                    >
                      🔚 End Call
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Video & Logs */}
          <div className="space-y-4">
            {/* Video Streams */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Video Streams</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Local Stream</p>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full bg-black rounded-lg"
                    style={{ maxHeight: '200px' }}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Remote Stream</p>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full bg-black rounded-lg"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              </div>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Logs</h2>
                <button
                  onClick={clearLogs}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No logs yet...</p>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, idx) => (
                      <div key={idx} className="text-xs font-mono">
                        <span className="text-gray-500">{log.timestamp}</span>{' '}
                        <span>{log.message}</span>
                        {log.data && (
                          <div className="ml-4 text-gray-600">
                            {JSON.stringify(log.data, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
