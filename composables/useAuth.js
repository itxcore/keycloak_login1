import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

/**
 * Vue Composable for Authentication
 * 
 * Provides a convenient API for components to interact with authentication
 * state and actions through the Pinia auth store.
 */
export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

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
      console.error('❌ Auth initialization failed:', error)
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
      console.error('❌ Google login failed:', error)
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
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  /**
   * Logout user
   */
  const logout = async (redirectToLogin = true) => {
    try {
      await authStore.logout()
      
      if (redirectToLogin) {
        await router.push('/login')
      }
    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Force redirect even if logout failed
      if (redirectToLogin) {
        await router.push('/login')
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
        // Redirect to intended page or dashboard
        const redirectTo = sessionStorage.getItem('auth_redirect_after_login') || '/dashboard'
        sessionStorage.removeItem('auth_redirect_after_login')
        await router.push(redirectTo)
      }
      
      return success
    } catch (error) {
      console.error('❌ Auth callback failed:', error)
      await router.push('/login?error=callback_failed')
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
      console.error('❌ Profile refresh failed:', error)
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
    return authStore.hasRole.value(role)
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
  // NAVIGATION HELPERS
  // =============================================
  
  /**
   * Redirect to login if not authenticated
   */
  const requireAuth = (redirectTo = null) => {
    if (!isAuthenticated.value) {
      if (redirectTo) {
        sessionStorage.setItem('auth_redirect_after_login', redirectTo)
      }
      router.push('/login')
      return false
    }
    return true
  }

  /**
   * Redirect to dashboard if already authenticated
   */
  const redirectIfAuthenticated = (redirectTo = '/dashboard') => {
    if (isAuthenticated.value) {
      router.push(redirectTo)
      return true
    }
    return false
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
      console.error('❌ Force token refresh failed:', error)
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
    
    // Navigation helpers
    requireAuth,
    redirectIfAuthenticated,
    
    // Token management
    getAccessToken,
    forceTokenRefresh
  }
}