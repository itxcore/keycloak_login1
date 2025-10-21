/**
 * CSP-Safe Keycloak Authentication Service
 * 
 * This service handles Keycloak authentication without using iframes,
 * making it compatible with strict Content Security Policy (CSP) settings.
 * Communicates directly with Keycloak server - no backend server required.
 * Designed for Vue 3 + Pinia integration.
 */

// Global flag to prevent multiple callback processing across instances
let globalCallbackProcessing = false

export class CSPSafeKeycloakService {
  constructor() {
    this.config = null
    this.tokens = null
    this.accessToken = null
    this.refreshToken = null
    this.idToken = null
    this.userInfo = null
    this.isInitialized = false
    this.isProcessingCallback = false
  }

  /**
   * Check if current URL is an OAuth callback
   */
  isOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const hasCode = urlParams.has('code')
    const hasState = urlParams.has('state')
    
    console.log('🔍 Checking if OAuth callback:', { hasCode, hasState, url: window.location.href })
    return hasCode && hasState
  }

  /**
   * Initialize the Keycloak service
   */
  async init() {
    try {
      console.log('🔄 Initializing CSP-Safe Keycloak service...')
      console.log('🔄 Service already initialized?', this.isInitialized)
      console.log('🔄 Global callback processing?', globalCallbackProcessing)
      
      // Prevent multiple initializations
      if (this.isInitialized) {
        console.log('⚠️ Keycloak service already initialized, skipping...')
        return
      }
      
      // Load configuration
      this.config = await this.loadConfig()
      console.log('📡 Loaded Keycloak config:', this.config)
      
      // Check if this is an OAuth callback - ONLY process if it actually is one
      if (this.isOAuthCallback() && !globalCallbackProcessing && !this.isProcessingCallback) {
        console.log('🔄 Detected OAuth callback, processing...')
        globalCallbackProcessing = true // Set global flag
        this.isProcessingCallback = true // Set instance flag
        
        await this.handleOAuthCallback()
        
      } else if (this.isOAuthCallback() && (globalCallbackProcessing || this.isProcessingCallback)) {
        console.log('⚠️ OAuth callback already being processed globally, skipping...')
        
      } else {
        console.log('ℹ️ Not an OAuth callback, checking for persisted tokens...')
        
        // Try to load persisted tokens
        this.loadPersistedTokens()
      }
      
      console.log('✅ Keycloak service initialized')
      this.isInitialized = true
    } catch (error) {
      console.error('❌ Keycloak initialization failed:', error)
      globalCallbackProcessing = false // Reset global flag on error
      this.isProcessingCallback = false // Reset instance flag on error
      throw error
    }
  }

  /**
   * Load persisted tokens from localStorage
   */
  loadPersistedTokens() {
    try {
      const storedTokens = localStorage.getItem('keycloak_tokens')
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens)
        
        // Check if tokens are still valid (basic check)
        if (tokens.access_token) {
          const expiryTime = parseInt(localStorage.getItem('keycloak_token_expiry') || '0')
          
          if (Date.now() < expiryTime) {
            console.log('📦 Loaded persisted tokens from localStorage')
            this.tokens = tokens
            this.accessToken = tokens.access_token
            this.refreshToken = tokens.refresh_token
            this.idToken = tokens.id_token
            
            // Extract user info from ID token if available
            if (tokens.id_token) {
              try {
                const payload = JSON.parse(atob(tokens.id_token.split('.')[1]))
                this.userInfo = payload
                console.log('👤 Loaded user info from persisted ID token')
              } catch (err) {
                console.warn('⚠️ Failed to parse persisted ID token:', err)
              }
            }
            
            return true
          } else {
            console.log('⏰ Persisted tokens expired, clearing...')
            this.clearTokens()
          }
        }
      }
      
      console.log('ℹ️ No valid persisted tokens found')
      return false
    } catch (error) {
      console.error('❌ Failed to load persisted tokens:', error)
      this.clearTokens()
      return false
    }
  }

  /**
   * Load Keycloak configuration (now hardcoded - no server needed)
   */
  async loadConfig() {
    try {
      // Direct configuration - no server dependency
      const config = {
        url: 'https://auth.utribe.app',
        realm: 'utribe',
        clientId: 'giftportal',
        isPublicClient: true
      }
      
      console.log('📡 Using direct Keycloak config:', { 
        url: config.url, 
        realm: config.realm, 
        clientId: config.clientId,
        isPublicClient: config.isPublicClient 
      })
      
      return config
    } catch (error) {
      console.error('❌ Failed to load Keycloak config:', error)
      throw new Error('Unable to load authentication configuration')
    }
  }

  /**
   * Get redirect URI for OAuth flow
   */
  getRedirectUri() {
    const origin = window.location.origin
    return `${origin}/`
  }

  /**
   * Login with Google (direct redirect, no iframe)
   */
  async loginWithGoogle(options = {}) {
    console.log('🚀 Starting Google social login (direct redirect)...')
    
    const state = this.generateState()
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)
    const redirectUri = this.getRedirectUri()
    
    // Store PKCE verifier and state
    sessionStorage.setItem('keycloak_code_verifier', codeVerifier)
    sessionStorage.setItem('keycloak_state', state)
    sessionStorage.setItem('keycloak_redirect_uri', redirectUri)
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      kc_idp_hint: 'google',
      prompt: 'login',
      ...options
    })

    const loginUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/auth?${params}`
    
    console.log('🔗 Using redirect URI:', redirectUri)
    console.log('🔗 Redirecting to:', loginUrl)
    window.location.href = loginUrl
  }

  /**
   * Handle OAuth callback from Keycloak
   */
  async handleOAuthCallback() {
    try {
      console.log('🔄 Handling OAuth callback...')
      
      // Double-check we're actually on a callback URL
      if (!this.isOAuthCallback()) {
        console.log('⚠️ handleOAuthCallback called but not on callback URL, skipping...')
        return false
      }
      
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const error = urlParams.get('error')
      
      if (error) {
        throw new Error(`OAuth error: ${error}`)
      }
      
      if (!code) {
        throw new Error('No authorization code received')
      }
      
      // Get stored values
      const storedState = sessionStorage.getItem('oauth_state') || sessionStorage.getItem('keycloak_state')
      const storedCodeVerifier = sessionStorage.getItem('code_verifier') || sessionStorage.getItem('keycloak_code_verifier')
      const storedRedirectUri = sessionStorage.getItem('redirect_uri') || sessionStorage.getItem('keycloak_redirect_uri')
      
      // Validate state
      if (state !== storedState) {
        throw new Error('Invalid state parameter')
      }
      
      console.log('🔑 Using direct Keycloak token exchange...')
      console.log('📍 Using stored redirect URI:', storedRedirectUri)
      
      // Exchange code for tokens directly with Keycloak
      const tokenResponse = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          code: code,
          redirect_uri: storedRedirectUri || window.location.origin + '/',
          code_verifier: storedCodeVerifier
        })
      })
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`)
      }
      
      const tokens = await tokenResponse.json()
      console.log('🎉 Received tokens from Keycloak:', tokens)
      
      // Store tokens
      this.tokens = tokens
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token
      this.idToken = tokens.id_token
      
      // Store in localStorage for persistence with expiry
      localStorage.setItem('keycloak_tokens', JSON.stringify(tokens))
      if (tokens.expires_in) {
        const expiryTime = Date.now() + (tokens.expires_in * 1000)
        localStorage.setItem('keycloak_token_expiry', expiryTime.toString())
      }
      
      // Extract user info from ID token
      if (tokens.id_token) {
        const payload = JSON.parse(atob(tokens.id_token.split('.')[1]))
        this.userInfo = payload
        console.log('👤 Extracted user from ID token:', payload)
      }
      
      // Clean up OAuth session data
      sessionStorage.removeItem('oauth_state')
      sessionStorage.removeItem('code_verifier')
      sessionStorage.removeItem('redirect_uri')
      sessionStorage.removeItem('keycloak_state')
      sessionStorage.removeItem('keycloak_code_verifier')
      sessionStorage.removeItem('keycloak_redirect_uri')
      
      // IMPORTANT: Clean up URL immediately and prevent any further processing
      console.log('🧹 Cleaning up OAuth callback URL...')
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
      
      console.log('✅ OAuth callback processed successfully')
      
      // Reset the processing flags
      globalCallbackProcessing = false
      this.isProcessingCallback = false
      
      return true
    } catch (error) {
      console.error('❌ OAuth callback error:', error)
      // Clean up on error
      this.clearTokens()
      globalCallbackProcessing = false
      this.isProcessingCallback = false
      throw error
    }
  }

  /**
   * Clear stored tokens
   */
  clearTokens() {
    this.tokens = null
    this.accessToken = null
    this.refreshToken = null
    this.idToken = null
    this.userInfo = null
    localStorage.removeItem('keycloak_tokens')
    localStorage.removeItem('keycloak_token_expiry')
    
    // Clean up session storage
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem('code_verifier')
    sessionStorage.removeItem('redirect_uri')
    sessionStorage.removeItem('keycloak_state')
    sessionStorage.removeItem('keycloak_code_verifier')
    sessionStorage.removeItem('keycloak_redirect_uri')
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('No refresh token provided')
    }

    console.log('🔄 Refreshing access token directly with Keycloak...')

    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          refresh_token: refreshToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`)
      }

      const tokens = await response.json()
      this.tokens = tokens
      
      console.log('✅ Token refresh successful')
      return tokens
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Get user information from Keycloak
   */
  async getUserInfo() {
    if (!this.tokens?.access_token) {
      throw new Error('No access token available')
    }

    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`)
      }

      const userInfo = await response.json()
      console.log('👤 Retrieved user info from Keycloak')
      return userInfo
    } catch (error) {
      console.error('❌ Failed to get user info:', error)
      throw error
    }
  }

  /**
   * Logout from Keycloak
   */
  async logout(redirectUri = null) {
    // Early exit if config is not loaded
    if (!this.config) {
      console.log('⚠️ Logout called but config not loaded, clearing tokens only...')
      this.clearTokens()
      return
    }
    
    // Clear tokens first
    this.clearTokens()
    
    const logoutRedirectUri = redirectUri || this.getRedirectUri()
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      post_logout_redirect_uri: logoutRedirectUri
    })

    const logoutUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/logout?${params}`
    
    console.log('🚪 Redirecting to Keycloak logout...')
    window.location.href = logoutUrl
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.tokens?.access_token)
  }

  /**
   * Get current access token
   */
  getToken() {
    return this.tokens?.access_token
  }

  /**
   * Generate random state for OAuth
   */
  generateState() {
    return this.generateRandomString(32)
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier() {
    return this.generateRandomString(128)
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generate cryptographically secure random string
   */
  generateRandomString(length) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[byte % 62]
    ).join('')
  }
}

// Export singleton instance for convenience
export const keycloakService = new CSPSafeKeycloakService()