import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { CSPSafeKeycloakService } from '@/services/csp-safe-keycloak.js'

export const useAuthStore = defineStore('auth', () => {
  // =============================================
  // STATE - Reactive References
  // =============================================
  
  // Authentication tokens
  const accessToken = ref(null)
  const refreshToken = ref(null)
  const idToken = ref(null)
  
  // User profile information
  const user = ref(null)
  
  // Authentication status
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  
  // Error handling
  const error = ref(null)
  const lastLoginAttempt = ref(null)
  
  // Session management
  const tokenExpiresAt = ref(null)
  const sessionTimeout = ref(null)

  // =============================================
  // COMPUTED - Reactive Getters
  // =============================================
  
  const isTokenExpired = computed(() => {
    if (!tokenExpiresAt.value) return true
    return Date.now() >= tokenExpiresAt.value
  })
  
  const isTokenExpiringSoon = computed(() => {
    if (!tokenExpiresAt.value) return false
    // Token expires in less than 5 minutes
    return Date.now() >= (tokenExpiresAt.value - 5 * 60 * 1000)
  })
  
  const userDisplayName = computed(() => {
    if (!user.value) return null
    return user.value.name || user.value.firstName || user.value.username || 'User'
  })
  
  const userInitials = computed(() => {
    if (!user.value) return null
    const name = userDisplayName.value
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  })
  
  const hasRole = computed(() => {
    return (role) => {
      if (!user.value?.roles) return false
      return user.value.roles.includes(role)
    }
  })

  // =============================================
  // KEYCLOAK SERVICE INSTANCE
  // =============================================
  
  let keycloakService = null
  
  const initializeKeycloak = async () => {
    if (!keycloakService) {
      keycloakService = new CSPSafeKeycloakService()
      await keycloakService.init()
    }
    return keycloakService
  }

  // =============================================
  // ACTIONS - Authentication Methods
  // =============================================
  
  /**
   * Initialize the authentication store
   */
  const initialize = async () => {
    if (isInitialized.value) return
    
    try {
      isLoading.value = true
      error.value = null
      
      // Load persisted tokens from localStorage
      loadPersistedState()
      
      // Initialize Keycloak service
      await initializeKeycloak()
      
      // Check if we have valid tokens
      if (accessToken.value && !isTokenExpired.value) {
        await refreshUserProfile()
        isAuthenticated.value = true
      } else if (refreshToken.value) {
        // Try to refresh the token
        await refreshAccessToken()
      }
      
      // Set up automatic token refresh
      setupTokenRefresh()
      
      isInitialized.value = true
    } catch (err) {
      console.error('❌ Auth store initialization failed:', err)
      error.value = err.message
      await logout()
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Login with Google via Keycloak
   */
  const loginWithGoogle = async (options = {}) => {
    try {
      isLoading.value = true
      error.value = null
      lastLoginAttempt.value = new Date()
      
      await initializeKeycloak()
      await keycloakService.loginWithGoogle(options)
      
      // The actual token handling will happen in handleAuthCallback
    } catch (err) {
      console.error('❌ Google login failed:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Regular login (username/password)
   */
  const login = async (options = {}) => {
    try {
      isLoading.value = true
      error.value = null
      lastLoginAttempt.value = new Date()
      
      await initializeKeycloak()
      await keycloakService.login(options)
      
      // The actual token handling will happen in handleAuthCallback
    } catch (err) {
      console.error('❌ Login failed:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Handle OAuth callback from Keycloak
   */
  const handleAuthCallback = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      await initializeKeycloak()
      const success = await keycloakService.handleOAuthCallback()
      
      if (success && keycloakService.tokens) {
        await setTokens(keycloakService.tokens)
        await refreshUserProfile()
        isAuthenticated.value = true
        
        console.log('✅ Authentication successful')
        return true
      }
      
      return false
    } catch (err) {
      console.error('❌ Auth callback failed:', err)
      error.value = err.message
      await logout()
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Logout user and clear all data
   */
  const logout = async (redirectToKeycloak = true) => {
    try {
      isLoading.value = true
      
      // Clear local state
      clearAuthState()
      
      // Logout from Keycloak if requested
      if (redirectToKeycloak && keycloakService) {
        await keycloakService.logout()
      }
      
      console.log('✅ Logout successful')
    } catch (err) {
      console.error('❌ Logout error:', err)
      // Clear state anyway
      clearAuthState()
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }
    
    try {
      await initializeKeycloak()
      const newTokens = await keycloakService.refreshToken(refreshToken.value)
      
      if (newTokens) {
        await setTokens(newTokens)
        return newTokens.access_token
      }
      
      throw new Error('Token refresh failed')
    } catch (err) {
      console.error('❌ Token refresh failed:', err)
      await logout(false) // Don't redirect to Keycloak on refresh failure
      throw err
    }
  }
  
  /**
   * Refresh user profile from Keycloak
   */
  const refreshUserProfile = async () => {
    if (!accessToken.value) return
    
    try {
      await initializeKeycloak()
      const userInfo = await keycloakService.getUserInfo()
      user.value = userInfo
      persistUserData()
    } catch (err) {
      console.error('❌ Failed to refresh user profile:', err)
      // Don't throw - this is not critical
    }
  }

  // =============================================
  // INTERNAL HELPER METHODS
  // =============================================
  
  /**
   * Set authentication tokens and extract user info
   */
  const setTokens = async (tokens) => {
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    idToken.value = tokens.id_token
    
    // Extract token expiration
    if (tokens.expires_in) {
      tokenExpiresAt.value = Date.now() + (tokens.expires_in * 1000)
    }
    
    // Extract user info from ID token
    if (tokens.id_token) {
      try {
        const payload = JSON.parse(atob(tokens.id_token.split('.')[1]))
        user.value = {
          id: payload.sub,
          username: payload.preferred_username,
          email: payload.email,
          firstName: payload.given_name,
          lastName: payload.family_name,
          name: payload.name,
          roles: payload.realm_access?.roles || [],
          groups: payload.groups || []
        }
      } catch (err) {
        console.error('❌ Failed to parse ID token:', err)
      }
    }
    
    // Persist to localStorage
    persistAuthData()
  }
  
  /**
   * Clear all authentication state
   */
  const clearAuthState = () => {
    accessToken.value = null
    refreshToken.value = null
    idToken.value = null
    user.value = null
    isAuthenticated.value = false
    tokenExpiresAt.value = null
    error.value = null
    
    // Clear localStorage
    localStorage.removeItem('auth_tokens')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_expires_at')
    
    // Clear session timeout
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
      sessionTimeout.value = null
    }
  }
  
  /**
   * Setup automatic token refresh
   */
  const setupTokenRefresh = () => {
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
    }
    
    if (!tokenExpiresAt.value) return
    
    // Refresh token 2 minutes before expiration
    const refreshTime = tokenExpiresAt.value - Date.now() - (2 * 60 * 1000)
    
    if (refreshTime > 0) {
      sessionTimeout.value = setTimeout(async () => {
        try {
          console.log('🔄 Auto-refreshing token...')
          await refreshAccessToken()
          setupTokenRefresh() // Setup next refresh
        } catch (err) {
          console.error('❌ Auto token refresh failed:', err)
        }
      }, refreshTime)
    }
  }
  
  /**
   * Persist authentication data to localStorage
   */
  const persistAuthData = () => {
    try {
      if (accessToken.value) {
        localStorage.setItem('auth_tokens', JSON.stringify({
          access_token: accessToken.value,
          refresh_token: refreshToken.value,
          id_token: idToken.value
        }))
      }
      
      if (tokenExpiresAt.value) {
        localStorage.setItem('auth_expires_at', tokenExpiresAt.value.toString())
      }
      
      persistUserData()
    } catch (err) {
      console.error('❌ Failed to persist auth data:', err)
    }
  }
  
  /**
   * Persist user data to localStorage
   */
  const persistUserData = () => {
    try {
      if (user.value) {
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }
    } catch (err) {
      console.error('❌ Failed to persist user data:', err)
    }
  }
  
  /**
   * Load persisted authentication state from localStorage
   */
  const loadPersistedState = () => {
    try {
      // Load tokens
      const storedTokens = localStorage.getItem('auth_tokens')
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens)
        accessToken.value = tokens.access_token
        refreshToken.value = tokens.refresh_token
        idToken.value = tokens.id_token
      }
      
      // Load expiration time
      const storedExpiresAt = localStorage.getItem('auth_expires_at')
      if (storedExpiresAt) {
        tokenExpiresAt.value = parseInt(storedExpiresAt)
      }
      
      // Load user data
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
      
      // Set authentication status based on token validity
      isAuthenticated.value = !!(accessToken.value && !isTokenExpired.value)
    } catch (err) {
      console.error('❌ Failed to load persisted auth state:', err)
      clearAuthState()
    }
  }

  // =============================================
  // WATCHERS - Reactive Side Effects
  // =============================================
  
  // Watch for token expiration
  watch(isTokenExpired, (expired) => {
    if (expired && isAuthenticated.value) {
      console.log('🔄 Token expired, attempting refresh...')
      refreshAccessToken().catch(() => {
        console.log('❌ Token refresh failed, logging out...')
        logout(false)
      })
    }
  })
  
  // Watch for authentication state changes
  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      setupTokenRefresh()
    } else {
      if (sessionTimeout.value) {
        clearTimeout(sessionTimeout.value)
        sessionTimeout.value = null
      }
    }
  })

  // =============================================
  // RETURN PUBLIC API
  // =============================================
  
  return {
    // State
    accessToken: readonly(accessToken),
    refreshToken: readonly(refreshToken),
    idToken: readonly(idToken),
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    error: readonly(error),
    lastLoginAttempt: readonly(lastLoginAttempt),
    
    // Computed
    isTokenExpired,
    isTokenExpiringSoon,
    userDisplayName,
    userInitials,
    hasRole,
    
    // Actions
    initialize,
    loginWithGoogle,
    login,
    handleAuthCallback,
    logout,
    refreshAccessToken,
    refreshUserProfile,
    
    // Utilities
    clearError: () => { error.value = null },
    forceRefresh: () => refreshAccessToken()
  }
})

// =============================================
// HELPER FUNCTION FOR READONLY REFS
// =============================================
function readonly(ref) {
  return computed(() => ref.value)
}