/**
 * Auth API Service
 * 
 * Comprehensive wrapper for all authentication endpoints
 * Phase 1: Login, Register, Refresh, Logout, Sessions, Refresh Token Management
 * Phase 2: Email Verification, Password Reset, OAuth Google
 */

import api from './api'

// ──────────────────────────────────────────────────────
// Phase 1: Core Authentication
// ──────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Register new user
 */
export async function register(email, username, password, displayName = '') {
  const response = await api.post('/auth/register', {
    email,
    username,
    password,
    displayName,
  })
  return response
}

/**
 * POST /auth/login
 * Login with email/username and password
 */
export async function login(emailOrUsername, password) {
  const response = await api.post('/auth/login', {
    emailOrUsername,
    password,
  })
  return response
}

/**
 * POST /auth/refresh
 * Refresh access token using refresh token from cookie
 */
export async function refreshToken() {
  const response = await api.post('/auth/refresh')
  return response
}

/**
 * POST /auth/logout
 * Logout from current session
 */
export async function logout() {
  const response = await api.post('/auth/logout')
  return response
}

/**
 * POST /auth/logout-all
 * Logout from all sessions
 * @param exceptCurrent - If true, keep current session active
 */
export async function logoutAllSessions(exceptCurrent = false) {
  const response = await api.post('/auth/logout-all', {
    exceptCurrent,
  })
  return response
}

/**
 * GET /auth/sessions
 * Get all active sessions for current user
 */
export async function getSessions() {
  const response = await api.get('/auth/sessions')
  return response
}

/**
 * DELETE /auth/sessions/{sessionId}
 * Revoke specific session
 */
export async function revokeSession(sessionId) {
  const response = await api.delete(`/auth/sessions/${sessionId}`)
  return response
}

// ──────────────────────────────────────────────────────
// Phase 2: Email Verification & Password Reset
// ──────────────────────────────────────────────────────

/**
 * POST /auth/verify-email
 * Verify email using token from email link
 */
export async function verifyEmail(token) {
  const response = await api.post('/auth/verify-email', {
    token,
  })
  return response
}

/**
 * POST /auth/resend-verification
 * Resend verification email to user email
 */
export async function resendVerificationEmail(email) {
  const response = await api.post('/auth/resend-verification', {
    email,
  })
  return response
}

/**
 * POST /auth/forgot-password
 * Request password reset email
 * Always returns same message for security (no user enumeration)
 */
export async function requestPasswordReset(email) {
  const response = await api.post('/auth/forgot-password', {
    email,
  })
  return response
}

/**
 * POST /auth/reset-password
 * Reset password using token from email link
 * Revokes all sessions after password change
 */
export async function resetPassword(token, newPassword) {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword,
  })
  return response
}

// ──────────────────────────────────────────────────────
// Phase 2: OAuth Google
// ──────────────────────────────────────────────────────

/**
 * POST /auth/oauth/google
 * Authenticate with Google using ID token from Google Sign-In
 */
export async function authenticateWithGoogle(googleIdToken) {
  const response = await api.post('/auth/oauth/google', {
    idToken: googleIdToken,
  })
  return response
}

// ──────────────────────────────────────────────────────
// User Profile (linked to Auth)
// ──────────────────────────────────────────────────────

/**
 * GET /users/me
 * Get current authenticated user profile
 */
export async function getCurrentUser() {
  const response = await api.get('/users/me')
  return response
}

/**
 * PUT /users/me
 * Update current user profile
 * Can change email (will require re-verification)
 */
export async function updateProfile(updates) {
  const response = await api.put('/users/me', updates)
  return response
}

/**
 * PUT /users/me/password
 * Change password (requires old password)
 */
export async function changePassword(oldPassword, newPassword) {
  const response = await api.put('/users/me/password', {
    oldPassword,
    newPassword,
  })
  return response
}

export default {
  // Phase 1
  register,
  login,
  refreshToken,
  logout,
  logoutAllSessions,
  getSessions,
  revokeSession,
  // Phase 2 - Email & Password
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  // Phase 2 - OAuth
  authenticateWithGoogle,
  // User
  getCurrentUser,
  updateProfile,
  changePassword,
}
