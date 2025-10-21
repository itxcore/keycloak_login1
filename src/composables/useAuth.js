import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

/**
 * Vue Composable for Authentication
 * 
 * Provides a convenient API for components to interact with authentication
 * state and actions through the Pinia auth store.
 * 
 * Simplified version without Vue Router dependency.
 */
export function useAuth() {
  const authStore = useAuthStore()

  // =============================================
  // REACTIVE STATE
  // =============================================
  
  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => authStore.isLoading)
  const error = computed(() => authStore.error)
  const userDisplayName = computed(() => authStore.userDisplayName)
  const userInitials = computed(() => authStore.userInitials)
  const isTokenExpiringSoon = computed(() => authStore.isTokenExpiringSoon)
  const isInitialized = computed(() => authStore.isInitialized)

  // =============================================
  // AUTHENTICATION ACTIONS
  // =============================================
  
  /**
   * Initialize authentication (call in app setup)
   */
  const initialize = async () => {
    try {
      await authStore.initialize()
    } catch (error) {
      console.error(' Auth initialization failed:', error)
      throw error
    }
  }

  /**
   * Login with Google
   */
  const loginWithGoogle = async () => {
    try {
      await authStore.loginWithGoogle()
    } catch (error) {
      console.error(' Google login failed:', error)
      throw error
    }
  }

  /**
   * Regular login
   */
  const login = async (options = {}) => {
    try {
      await authStore.login(options)
    } catch (error) {
      console.error(' Login failed:', error)
      throw error
    }
  }

  /**
   * Logout user
   */
  const logout = async (redirectToLogin = true) => {
    try {
      await authStore.logout()
      
      // For now, just reload the page to show login view
      // In a router-based app, this would navigate to /login
      if (redirectToLogin) {
        window.location.reload()
      }
    } catch (error) {
      console.error(' Logout failed:', error)
      // Force page reload even if logout failed
      if (redirectToLogin) {
        window.location.reload()
      }
    }
  }

  /**
   * Handle OAuth callback (call in callback route)
   */
  const handleCallback = async () => {
    try {
      const success = await authStore.handleAuthCallback()
      
      if (success) {
        // For now, just reload to show authenticated state
        // In a router-based app, this would navigate to intended page
        console.log(' Authentication successful - reloading page')
        window.location.href = window.location.origin
      }
      
      return success
    } catch (error) {
      console.error(' Auth callback failed:', error)
      // Reload to show login view on error
      window.location.href = window.location.origin + '?error=callback_failed'
      throw error
    }
  }

  /**
   * Refresh user profile
   */
  const refreshProfile = async () => {
    try {
      await authStore.refreshUserProfile()
    } catch (error) {
      console.error(' Profile refresh failed:', error)
      throw error
    }
  }

  /**
   * Clear authentication error
   */
  const clearError = () => {
    authStore.clearError()
  }

  // =============================================
  // ROLE & PERMISSION HELPERS
  // =============================================
  
  /**
   * Check if user has specific role
   */
  const hasRole = (role) => {
    return authStore.hasRole(role)
  }

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role))
  }

  /**
   * Check if user has all of the specified roles
   */
  const hasAllRoles = (roles) => {
    return roles.every(role => hasRole(role))
  }

  // =============================================
  // TOKEN MANAGEMENT
  // =============================================
  
  /**
   * Get current access token
   */
  const getAccessToken = () => {
    return authStore.accessToken
  }

  /**
   * Check if token is expired
   */
  const isTokenExpired = computed(() => {
    return authStore.isTokenExpired
  })

  /**
   * Force token refresh
   */
  const forceTokenRefresh = async () => {
    try {
      await authStore.forceRefresh()
    } catch (error) {
      console.error(' Force token refresh failed:', error)
      throw error
    }
  }

  // =============================================
  // RETURN PUBLIC API
  // =============================================
  
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    userDisplayName,
    userInitials,
    isTokenExpired,
    isTokenExpiringSoon,
    isInitialized,
    
    // Actions
    initialize,
    loginWithGoogle,
    login,
    logout,
    handleCallback,
    refreshProfile,
    clearError,
    
    // Role helpers
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Token management
    getAccessToken,
    forceTokenRefresh
  }
}
