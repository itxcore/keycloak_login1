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
    console.log('🎯 Initialize called, isInitialized:', isInitialized.value)
    if (isInitialized.value) {
      console.log('⏭️ Already initialized, skipping')
      return
    }
    
    try {
      console.log('🚀 Starting authentication initialization...')
      isLoading.value = true
      error.value = null
      
      // Initialize Keycloak service
      await initializeKeycloak()
      
      // Check if Keycloak service already processed an OAuth callback and has tokens
      if (keycloakService.tokens) {
        console.log('🔄 Found tokens in Keycloak service (OAuth callback was processed)')
        console.log('📦 Setting tokens from Keycloak service:', keycloakService.tokens)
        console.log('📦 keycloakService.tokens type:', typeof keycloakService.tokens)
        console.log('📦 keycloakService.tokens keys:', Object.keys(keycloakService.tokens || {}))
        
        try {
          await setTokens(keycloakService.tokens)
          console.log('✅ setTokens completed successfully')
        } catch (tokenError) {
          console.error('❌ setTokens failed:', tokenError)
          throw tokenError
        }
        
        await refreshUserProfile()
        
        console.log('🔐 Before setting isAuthenticated = true:')
        console.log('  - accessToken exists:', !!accessToken.value)
        console.log('  - tokenExpiresAt:', tokenExpiresAt.value)
        console.log('  - current time:', Date.now())
        console.log('  - isTokenExpired:', isTokenExpired.value)
        console.log('  - user:', user.value)
        
        isAuthenticated.value = true
        
        console.log('🔐 After setting isAuthenticated = true:')
        console.log('  - isAuthenticated:', isAuthenticated.value)
        
        console.log('✅ OAuth callback processed successfully')
        console.log('🔐 Final isAuthenticated:', isAuthenticated.value)
        console.log('👤 Final User:', user.value)
        
        isInitialized.value = true
        console.log('🏁 isInitialized set to true, returning from OAuth callback processing')
        return
      }
      
      // Check if this is an OAuth callback (has 'code' parameter) - legacy check
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('code')) {
        console.log('🔄 Detected OAuth callback via URL parameters, processing...')
        const success = await keycloakService.handleOAuthCallback()
        
        if (success && keycloakService.tokens) {
          console.log('📦 Setting tokens from OAuth callback:', keycloakService.tokens)
          console.log('📦 keycloakService.tokens type:', typeof keycloakService.tokens)
          console.log('📦 keycloakService.tokens keys:', Object.keys(keycloakService.tokens || {}))
          
          try {
            await setTokens(keycloakService.tokens)
            console.log('✅ setTokens completed successfully')
          } catch (tokenError) {
            console.error('❌ setTokens failed:', tokenError)
            throw tokenError
          }
          
          await refreshUserProfile()
          
          console.log('🔐 Before setting isAuthenticated = true:')
          console.log('  - accessToken exists:', !!accessToken.value)
          console.log('  - tokenExpiresAt:', tokenExpiresAt.value)
          console.log('  - current time:', Date.now())
          console.log('  - isTokenExpired:', isTokenExpired.value)
          console.log('  - user:', user.value)
          
          isAuthenticated.value = true
          
          console.log('🔐 After setting isAuthenticated = true:')
          console.log('  - isAuthenticated:', isAuthenticated.value)
          
          // Clean up the URL by removing OAuth parameters
          const cleanUrl = window.location.origin + window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
          
          console.log('✅ OAuth callback processed successfully')
          console.log('🔐 Final isAuthenticated:', isAuthenticated.value)
          console.log('👤 Final User:', user.value)
          
          isInitialized.value = true
          console.log('🏁 isInitialized set to true, returning from OAuth callback processing')
          return
        }
      }
      
      // Load persisted tokens from localStorage (only if not OAuth callback)
      loadPersistedState()
      
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
      
      // Don't call logout() during initialization to avoid infinite loops
      // Just clear the auth state without redirecting
      clearAuthState()
      
      // Still mark as initialized to prevent infinite loops
      isInitialized.value = true
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
    console.log('🔑 setTokens called with:', tokens)
    console.log('🔑 Token object keys:', Object.keys(tokens || {}))
    console.log('🔑 expires_in value:', tokens?.expires_in)
    console.log('🔑 expires_in type:', typeof tokens?.expires_in)
    
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    idToken.value = tokens.id_token
    
    // Extract token expiration
    if (tokens.expires_in) {
      tokenExpiresAt.value = Date.now() + (tokens.expires_in * 1000)
      console.log('⏰ Token expires at:', new Date(tokenExpiresAt.value).toISOString())
      console.log('⏰ Token expires in seconds:', tokens.expires_in)
    } else {
      console.warn('⚠️ No expires_in found in tokens object')
      // Try to extract expiration from access token if it's a JWT
      if (tokens.access_token) {
        try {
          const payload = JSON.parse(atob(tokens.access_token.split('.')[1]))
          if (payload.exp) {
            tokenExpiresAt.value = payload.exp * 1000 // JWT exp is in seconds
            console.log('⏰ Extracted expiration from JWT:', new Date(tokenExpiresAt.value).toISOString())
          }
        } catch (err) {
          console.warn('⚠️ Could not extract expiration from JWT:', err)
        }
      }
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
      const tokenValid = !!(accessToken.value && !isTokenExpired.value)
      console.log('📊 loadPersistedState token validation:')
      console.log('  - accessToken exists:', !!accessToken.value)
      console.log('  - isTokenExpired:', isTokenExpired.value)
      console.log('  - tokenExpiresAt:', tokenExpiresAt.value)
      console.log('  - current time:', Date.now())
      console.log('  - calculated tokenValid:', tokenValid)
      console.log('  - current isAuthenticated:', isAuthenticated.value)
      
      isAuthenticated.value = tokenValid
      console.log('  - new isAuthenticated:', isAuthenticated.value)
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
  watch(isAuthenticated, (authenticated, oldValue) => {
    console.log(`🔄 isAuthenticated changed: ${oldValue} → ${authenticated}`)
    console.trace('Authentication state change trace:')
    
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