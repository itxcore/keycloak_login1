/**
 * CSP-Safe Keycloak Authentication Service
 * 
 * This service handles Keycloak authentication without using iframes,
 * making it compatible with strict Content Security Policy (CSP) settings.
 * Designed for Vue 3 + Pinia integration.
 */

export class CSPSafeKeycloakService {
  constructor() {
    this.config = null
    this.tokens = null
    this.isInitialized = false
  }

  /**
   * Initialize the Keycloak service
   */
  async init() {
    if (this.isInitialized) return true
    
    try {
      console.log('🔧 Initializing Keycloak service...')
      
      // Load configuration from backend
      this.config = await this.loadConfig()
      
      // Check if we're returning from authentication
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('code') && urlParams.get('state')) {
        console.log('🔄 Detected OAuth callback, processing...')
        await this.handleOAuthCallback()
      }
      
      this.isInitialized = true
      console.log('✅ Keycloak service initialized')
      return true
    } catch (error) {
      console.error('❌ Keycloak initialization failed:', error)
      throw error
    }
  }

  /**
   * Load Keycloak configuration from backend
   */
  async loadConfig() {
    try {
      const response = await fetch('/api/keycloak-config')
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`)
      }
      const config = await response.json()
      console.log('📡 Loaded Keycloak config:', { 
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
   * Provides fallback options for different deployment scenarios
   */
  getRedirectUri() {
    const origin = window.location.origin
    const pathname = window.location.pathname
    
    // Return base origin with trailing slash for consistency
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
   * Regular login (direct redirect, no iframe)
   */
  async login(options = {}) {
    console.log('🔑 Starting regular login (direct redirect)...')
    
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
    console.log('🔄 Handling OAuth callback...')
    
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const error = urlParams.get('error')

    if (error) {
      console.error('❌ OAuth error:', error)
      throw new Error(`OAuth error: ${error}`)
    }

    if (!code) {
      console.error('❌ No authorization code received')
      throw new Error('No authorization code received')
    }

    // Verify state
    const storedState = sessionStorage.getItem('keycloak_state')
    if (state !== storedState) {
      console.error('❌ State mismatch')
      throw new Error('State mismatch - possible CSRF attack')
    }

    const codeVerifier = sessionStorage.getItem('keycloak_code_verifier')
    const storedRedirectUri = sessionStorage.getItem('keycloak_redirect_uri')
    
    if (!codeVerifier) {
      console.error('❌ No code verifier found')
      throw new Error('No code verifier found in session')
    }

    console.log('🔑 Using server-side token exchange...')
    console.log('📍 Using stored redirect URI:', storedRedirectUri)

    // Use server-side token exchange endpoint for security
    const response = await fetch('/api/token-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code,
        codeVerifier: codeVerifier,
        redirectUri: storedRedirectUri || this.getRedirectUri()
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Server-side token exchange failed:', errorData)
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`)
    }

    this.tokens = await response.json()
    
    // Clean up session storage
    sessionStorage.removeItem('keycloak_state')
    sessionStorage.removeItem('keycloak_code_verifier')
    sessionStorage.removeItem('keycloak_redirect_uri')
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname)
    
    console.log('✅ OAuth callback processed successfully')
    return true
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('No refresh token provided')
    }

    console.log('🔄 Refreshing access token...')

    try {
      const response = await fetch('/api/token-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: refreshToken
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