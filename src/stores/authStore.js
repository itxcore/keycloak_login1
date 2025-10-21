import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { CSPSafeKeycloakService } from '@/services/csp-safe-keycloak.js'

// Global flag to prevent multiple store initializations
let globalStoreInitialized = false

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
  const isInitializing = ref(false)
  
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
  // INTERNAL HELPER METHODS
  // =============================================
  
  /**
   * Set authentication tokens and extract user info
   */
  const setTokens = async (tokens) => {
    console.log('🔑 setTokens called with:', tokens)
    
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    idToken.value = tokens.id_token
    
    // Extract token expiration
    if (tokens.expires_in) {
      tokenExpiresAt.value = Date.now() + (tokens.expires_in * 1000)
      console.log('⏰ Token expires at:', new Date(tokenExpiresAt.value).toISOString())
    }
    
    // Extract user info from ID token
    if (tokens.id_token) {
      try {
        const payload = JSON.parse(atob(tokens.id_token.split('.')[1]))
        console.log('👤 Extracted user from ID token:', payload)
        
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
        
        console.log('✅ User object set:', user.value)
      } catch (err) {
        console.error('❌ Failed to parse ID token:', err)
      }
    }
    
    // Persist to localStorage
    persistAuthData()
    console.log('✅ setTokens completed successfully')
  }
  
  /**
   * Clear all authentication state
   */
  const clearAuthState = () => {
    console.log('🧹 Clearing auth state...')
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
    
    console.log('✅ Auth state cleared')
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
      console.log('📊 Loading persisted auth state...')
      
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
      
      // Check token validity
      const tokenValid = !!(accessToken.value && !isTokenExpired.value)
      console.log('📊 Token validity check:', {
        hasAccessToken: !!accessToken.value,
        isExpired: isTokenExpired.value,
        tokenValid
      })
      
      // Set authentication status based on token validity
      isAuthenticated.value = tokenValid
      
      return tokenValid
    } catch (err) {
      console.error('❌ Failed to load persisted auth state:', err)
      clearAuthState()
      return false
    }
  }

  // =============================================
  // ACTIONS - Authentication Methods
  // =============================================
  
  /**
   * Initialize the authentication store
   */
  const initialize = async () => {
    console.log('🔄 AUTH STORE: Starting initialization...')
    console.log('🔄 AUTH STORE: Global initialized?', globalStoreInitialized)
    console.log('🔄 AUTH STORE: Store initialized?', isInitialized.value)
    console.log('🔄 AUTH STORE: Store initializing?', isInitializing.value)
    
    // Prevent multiple initializations
    if (globalStoreInitialized || isInitialized.value || isInitializing.value) {
      console.log('⚠️ AUTH STORE: Already initialized or initializing, skipping...')
      return
    }
    
    try {
      isInitializing.value = true
      globalStoreInitialized = true
      
      console.log('🔄 AUTH STORE: Initializing Keycloak service...')
      
      // First, initialize the Keycloak service
      await initializeKeycloak()
      
      console.log('🔄 AUTH STORE: Checking for OAuth callback tokens...')
      
      // Check if we have tokens in the Keycloak service (from OAuth callback)
      if (keycloakService.tokens && keycloakService.accessToken) {
        console.log('🔄 AUTH STORE: Found OAuth callback tokens!')
        console.log('📦 AUTH STORE: Setting tokens from Keycloak service')
        
        // Set tokens from the Keycloak service
        await setTokens(keycloakService.tokens)
        
        // Set user info if available
        if (keycloakService.userInfo) {
          user.value = keycloakService.userInfo
          console.log('👤 AUTH STORE: Set user from Keycloak service')
        }
        
        // Set authentication state
        isAuthenticated.value = true
        console.log('🔐 AUTH STORE: Authentication state set to TRUE')
        
        isInitialized.value = true
        console.log('✅ AUTH STORE: OAuth callback processing complete')
        return
      }
      
      console.log('🔄 AUTH STORE: No OAuth callback, checking persisted tokens...')
      
      // If no OAuth callback, check for persisted tokens
      const hasPersistedTokens = loadPersistedState()
      
      if (hasPersistedTokens && !isTokenExpired.value) {
        console.log('✅ AUTH STORE: Using persisted authentication state')
        // Try to refresh user profile
        try {
          await refreshUserProfile()
        } catch (error) {
          console.warn('⚠️ AUTH STORE: Failed to refresh user profile:', error)
        }
      } else {
        console.log('ℹ️ AUTH STORE: No valid authentication state found')
        // DON'T call logout here - it causes loops
        clearAuthState()
      }
      
    } catch (error) {
      console.error('❌ AUTH STORE: Initialization failed:', error)
      clearAuthState()
      globalStoreInitialized = false // Reset on error
    } finally {
      isInitialized.value = true
      isInitializing.value = false
      console.log('🏁 AUTH STORE: Initialization completed')
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
      
      // The actual token handling will happen in initialize
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
      
      // The actual token handling will happen in initialize
    } catch (err) {
      console.error('❌ Login failed:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Logout user and clear all data
   */
  const logout = async (redirectToKeycloak = false) => {
    try {
      console.log('🚪 AUTH STORE: Starting logout...')
      isLoading.value = true
      
      // Clear local state first
      clearAuthState()
      
      // Reset global flag
      globalStoreInitialized = false
      
      // Logout from Keycloak if requested
      if (redirectToKeycloak && keycloakService) {
        await keycloakService.logout()
      }
      
      console.log('✅ AUTH STORE: Logout successful')
    } catch (err) {
      console.error('❌ AUTH STORE: Logout error:', err)
      // Clear state anyway
      clearAuthState()
      globalStoreInitialized = false
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
  // WATCHERS - Reactive Side Effects
  // =============================================
  
  // REMOVE these watchers as they might be causing loops
  // We'll handle auth state changes manually in the initialize method
  
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