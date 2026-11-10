import React, { useState, useEffect, useRef } from 'react'
import { CALL_STATES } from '../utils/callStateMachine'

export default function AdvancedCallModal({
  callState,
  stateManager,
  controls,
  onDecline,
  onAccept,
  onEnd,
  onMuteToggle,
  onVideoToggle,
  onSwitchCamera,
  onSpeakerToggle,
  onPiPToggle,
  otherUser
}) {
  const [duration, setDuration] = useState('00:00')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isPiPEnabled, setIsPiPEnabled] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const durationIntervalRef = useRef(null)

  // Update duration
  useEffect(() => {
    if (callState.status === 'active' && stateManager) {
      durationIntervalRef.current = setInterval(() => {
        const formatted = stateManager.formatDuration(stateManager.callData.duration)
        setDuration(formatted)
      }, 1000)
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [callState.status, stateManager])

  if (!callState.active) return null

  const state = stateManager?.getState()
  const isIncoming = state === CALL_STATES.RINGING
  const isConnected = state === CALL_STATES.CONNECTED
  const isCalling = state === CALL_STATES.CALLING || state === CALL_STATES.CONNECTING

  const handleMuteClick = async () => {
    try {
      const muted = await onMuteToggle?.()
      setIsMuted(muted)
    } catch (error) {
      console.error('Failed to toggle mute:', error)
    }
  }

  const handleVideoClick = async () => {
    try {
      const enabled = await onVideoToggle?.()
      setIsVideoEnabled(enabled)
    } catch (error) {
      console.error('Failed to toggle video:', error)
    }
  }

  const handleCameraClick = async () => {
    try {
      await onSwitchCamera?.()
    } catch (error) {
      console.error('Failed to switch camera:', error)
    }
  }

  const handleSpeakerClick = async () => {
    try {
      const enabled = await onSpeakerToggle?.()
      setIsSpeakerOn(enabled)
    } catch (error) {
      console.error('Failed to toggle speaker:', error)
    }
  }

  const handlePiPClick = async () => {
    try {
      if (!isPiPEnabled && localVideoRef.current) {
        await onPiPToggle?.(localVideoRef.current)
        setIsPiPEnabled(true)
      } else {
        await document.exitPictureInPicture?.()
        setIsPiPEnabled(false)
      }
    } catch (error) {
      console.error('Failed to toggle PiP:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />

      {/* Video containers */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Remote video (full screen) */}
        {callState.type === 'VIDEO' && isConnected && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            data-remote-video
          />
        )}

        {/* Local video (picture in picture) */}
        {callState.type === 'VIDEO' && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute ${
              isPiPEnabled ? 'hidden' : 'bottom-4 right-4 w-32 h-44 rounded-lg border-2 border-white'
            } bg-black object-cover`}
            data-local-video
          />
        )}
      </div>

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8">
        {/* Top section - User info and duration */}
        <div className="text-center text-white">
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center overflow-hidden mb-4 border-2 border-white">
              {otherUser?.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold">
                  {(otherUser?.displayName || 'User').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">{otherUser?.displayName || 'User'}</h2>

          {/* Status message */}
          <div className="mb-4">
            {isIncoming && (
              <p className="text-lg text-gray-300 animate-pulse">Cuộc gọi đến...</p>
            )}
            {isCalling && state !== CALL_STATES.CONNECTING && (
              <p className="text-lg text-gray-300 animate-pulse">
                {callState.type === 'VOICE' ? '📞 Gọi thoại...' : '📹 Gọi video...'}
              </p>
            )}
            {state === CALL_STATES.CONNECTING && (
              <p className="text-lg text-gray-300 animate-pulse">Đang kết nối...</p>
            )}
            {isConnected && (
              <p className="text-xl font-semibold text-green-400">{duration}</p>
            )}
            {state === CALL_STATES.FAILED && (
              <p className="text-lg text-red-400">Cuộc gọi thất bại</p>
            )}
            {state === CALL_STATES.BUSY && (
              <p className="text-lg text-orange-400">Người dùng đang bận</p>
            )}
            {state === CALL_STATES.MISSED && (
              <p className="text-lg text-yellow-400">Cuộc gọi đã bị bỏ lỡ</p>
            )}
          </div>

          {/* Call type indicator */}
          <p className="text-gray-400 text-sm">
            {callState.type === 'VOICE' ? '🎤 Gọi thoại' : '📹 Gọi video'}
          </p>
        </div>

        {/* Bottom section - Control buttons */}
        <div className="flex flex-col items-center gap-8">
          {/* Advanced controls (only when connected) */}
          {isConnected && (
            <div className="flex gap-4 items-center justify-center flex-wrap">
              {/* Mute button */}
              <button
                onClick={handleMuteClick}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white`}
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm'}
              >
                <span className="material-symbols-outlined">
                  {isMuted ? 'mic_off' : 'mic'}
                </span>
              </button>

              {/* Video toggle (only for video calls) */}
              {callState.type === 'VIDEO' && (
                <button
                  onClick={handleVideoClick}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                    isVideoEnabled
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                  title={isVideoEnabled ? 'Tắt video' : 'Bật video'}
                >
                  <span className="material-symbols-outlined">
                    {isVideoEnabled ? 'videocam' : 'videocam_off'}
                  </span>
                </button>
              )}

              {/* Switch camera (only for video calls) */}
              {callState.type === 'VIDEO' && isVideoEnabled && (
                <button
                  onClick={handleCameraClick}
                  className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-all hover:scale-110"
                  title="Chuyển camera"
                >
                  <span className="material-symbols-outlined">flip_camera_android</span>
                </button>
              )}

              {/* Speaker button */}
              <button
                onClick={handleSpeakerClick}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                  isSpeakerOn
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } text-white`}
                title={isSpeakerOn ? 'Tắt loa' : 'Bật loa'}
              >
                <span className="material-symbols-outlined">
                  {isSpeakerOn ? 'volume_up' : 'volume_off'}
                </span>
              </button>

              {/* Picture in Picture (only for video calls) */}
              {callState.type === 'VIDEO' && (
                <button
                  onClick={handlePiPClick}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                    isPiPEnabled
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                  title={isPiPEnabled ? 'Thoát PiP' : 'Kích hoạt PiP'}
                >
                  <span className="material-symbols-outlined">picture_in_picture</span>
                </button>
              )}
            </div>
          )}

          {/* Primary action buttons */}
          <div className="flex gap-6 justify-center">
            {isIncoming && (
              <>
                {/* Decline */}
                <button
                  onClick={onDecline}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                  title="Từ chối"
                >
                  <span className="material-symbols-outlined text-3xl">call_end</span>
                </button>

                {/* Accept */}
                <button
                  onClick={onAccept}
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                  title="Chấp nhận"
                >
                  <span className="material-symbols-outlined text-3xl">
                    {callState.type === 'VOICE' ? 'call' : 'videocam'}
                  </span>
                </button>
              </>
            )}

            {(isCalling || isConnected) && (
              <>
                {/* End Call */}
                <button
                  onClick={onEnd}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                  title="Kết thúc gọi"
                >
                  <span className="material-symbols-outlined text-3xl">call_end</span>
                </button>
              </>
            )}

            {(state === CALL_STATES.FAILED || state === CALL_STATES.BUSY || state === CALL_STATES.MISSED) && (
              <button
                onClick={onEnd}
                className="w-16 h-16 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Remote audio element */}
      <audio
        autoPlay
        playsInline
        data-remote-audio
        style={{ display: 'none' }}
      />
    </div>
  )
}
