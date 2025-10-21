<template>
  <div class="auth-button">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <span class="spinner"></span>
      Authenticating...
    </div>
    
    <!-- Not authenticated - show login button -->
    <div v-else-if="!isAuthenticated" class="login-section">
      <button 
        @click="handleGoogleLogin"
        class="btn btn-google"
        :disabled="isLoading"
      >
        <svg class="google-icon" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      
      <button 
        @click="handleRegularLogin"
        class="btn btn-secondary"
        :disabled="isLoading"
      >
        Sign in with Email
      </button>
      
      <!-- Error display -->
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="clearError" class="btn btn-link">Dismiss</button>
      </div>
    </div>
    
    <!-- Authenticated - show user info and logout -->
    <div v-else class="user-section">
      <div class="user-info">
        <div class="user-avatar">
          <img 
            v-if="user?.picture" 
            :src="user.picture" 
            :alt="userDisplayName"
            class="avatar-image"
          >
          <div v-else class="avatar-initials">
            {{ userInitials }}
          </div>
        </div>
        
        <div class="user-details">
          <h3 class="user-name">{{ userDisplayName }}</h3>
          <p class="user-email">{{ user?.email }}</p>
          
          <!-- Token expiration warning -->
          <div v-if="isTokenExpiringSoon" class="token-warning">
            ⚠️ Session expires soon
          </div>
        </div>
      </div>
      
      <div class="user-actions">
        <button @click="handleRefreshProfile" class="btn btn-link">
          Refresh Profile
        </button>
        <button @click="handleLogout" class="btn btn-secondary">
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

// =============================================
// COMPOSABLE SETUP
// =============================================

const {
  user,
  isAuthenticated,
  isLoading,
  error,
  userDisplayName,
  userInitials,
  isTokenExpiringSoon,
  loginWithGoogle,
  login,
  logout,
  refreshProfile,
  clearError
} = useAuth()

// =============================================
// EVENT HANDLERS
// =============================================

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle()
  } catch (err) {
    console.error('Google login failed:', err)
    // Error is already set in the store
  }
}

const handleRegularLogin = async () => {
  try {
    await login()
  } catch (err) {
    console.error('Regular login failed:', err)
    // Error is already set in the store
  }
}

const handleLogout = async () => {
  try {
    await logout()
  } catch (err) {
    console.error('Logout failed:', err)
    // Handle logout error if needed
  }
}

const handleRefreshProfile = async () => {
  try {
    await refreshProfile()
  } catch (err) {
    console.error('Profile refresh failed:', err)
    // Handle error if needed
  }
}
</script>

<style scoped>
.auth-button {
  max-width: 400px;
  margin: 0 auto;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #666;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #666;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-google {
  background: white;
  color: #333;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-google:hover:not(:disabled) {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-link {
  background: none;
  color: #007bff;
  border: none;
  text-decoration: underline;
  padding: 4px 8px;
  font-size: 12px;
}

.btn-link:hover:not(:disabled) {
  color: #0056b3;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  padding: 12px;
  color: #c33;
  text-align: center;
}

.error-message p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.user-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.user-email {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.token-warning {
  margin-top: 4px;
  font-size: 12px;
  color: #f56500;
  font-weight: 500;
}

.user-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .auth-button {
    max-width: 100%;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }
  
  .user-actions {
    justify-content: center;
  }
}
</style>