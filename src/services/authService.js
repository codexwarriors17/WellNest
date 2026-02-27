// src/services/authService.js
// Re-exports auth functions for convenience
export {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} from '../firebase/firebaseFunctions'
