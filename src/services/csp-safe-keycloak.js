/**
 * CSP-Safe Keycloak Service
 * Completely avoids iframe usage to prevent CSP frame-ancestors issues
 */
class CSPSafeKeycloakService {
  constructor() {
    this.config = {
      url: 'https://auth.utribe.app',
      realm: 'utribe',
      clientId: 'giftportal'
    }
    this.isInitialized = false
    this.tokens = null
    this.userProfile = null
    this.refreshTimer = null
  }

  /**
   * Initialize the service (no iframe usage)
   */
  async init() {
    try {
      console.log('🔧 Initializing CSP-Safe Keycloak service...')
      
      // Get config from server if available
      try {
        const response = await fetch('/api/keycloak-config')
        if (response.ok) {
          const serverConfig = await response.json()
          this.config = { ...this.config, ...serverConfig }
          console.log('📡 Loaded config from server:', this.config)
        }
      } catch (error) {
        console.warn('⚠️ Failed to load server config, using defaults:', error.message)
      }

      // Check for OAuth callback in URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')
      const state = urlParams.get('state')

      if (error) {
        console.error('❌ OAuth error:', error, urlParams.get('error_description'))
        // Clean URL
        this.cleanUrl()
        throw new Error(`OAuth error: ${error} - ${urlParams.get('error_description')}`)
      }

      if (code) {
        console.log('🔑 Processing OAuth callback...')
        await this.handleOAuthCallback(code, state)
        // Clean URL after processing
        this.cleanUrl()
        return true
      }

      // Check for existing tokens in localStorage
      const storedTokens = this.getStoredTokens()
      if (storedTokens && storedTokens.access_token) {
        console.log('🔍 Found stored tokens, validating...')
        const isValid = await this.validateToken(storedTokens.access_token)
        if (isValid) {
          this.tokens = storedTokens
          this.setupTokenRefresh()
          console.log('✅ Restored valid session from storage')
          return true
        } else {
          console.log('⚠️ Stored tokens are invalid, clearing...')
          this.clearStoredTokens()
        }
      }

      this.isInitialized = true
      console.log('✅ CSP-Safe Keycloak service initialized (not authenticated)')
      return false

    } catch (error) {
      console.error('❌ Keycloak initialization failed:', error)
      this.isInitialized = true // Still mark as initialized even if failed
      throw error
    }
  }

  /**
   * Get the correct redirect URI for the current environment
   */
  getRedirectUri() {
    const origin = window.location.origin
    const pathname = window.location.pathname
    
    // Try different redirect URI patterns that are commonly configured
    const candidates = [
      `${origin}/`,                    // Root with trailing slash
      `${origin}`,                     // Root without trailing slash
      `${origin}/index.html`,          // Explicit index.html
      `${origin}${pathname}`,          // Current pathname
      `${origin}/auth/callback`,       // Dedicated callback path
      `${origin}/*`                    // Wildcard (if configured)
    ]
    
    // For development, log all candidates
    console.log('🔍 Redirect URI candidates:', candidates)
    
    // Return the most common pattern (root with trailing slash)
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
   * Logout (direct redirect)
   */
  logout(options = {}) {
    console.log('🚪 Logging out...')
    
    // Clear local data
    this.clearStoredTokens()
    this.tokens = null
    this.userProfile = null
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      post_logout_redirect_uri: window.location.origin,
      ...options
    })

    if (this.tokens?.id_token) {
      params.append('id_token_hint', this.tokens.id_token)
    }

    const logoutUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/logout?${params}`
    
    console.log('🔗 Redirecting to logout:', logoutUrl)
    window.location.href = logoutUrl
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code, state) {
    const storedState = sessionStorage.getItem('keycloak_state')
    const codeVerifier = sessionStorage.getItem('keycloak_code_verifier')
    const storedRedirectUri = sessionStorage.getItem('keycloak_redirect_uri')

    if (state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack')
    }

    if (!codeVerifier) {
      throw new Error('Missing code verifier')
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
    
    // Store tokens
    this.storeTokens(this.tokens)
    
    // Clean up session storage
    sessionStorage.removeItem('keycloak_state')
    sessionStorage.removeItem('keycloak_code_verifier')
    sessionStorage.removeItem('keycloak_redirect_uri')
    
    // Setup token refresh
    this.setupTokenRefresh()
    
    console.log('✅ OAuth callback processed successfully')
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated')
    }

    if (this.userProfile) {
      return this.userProfile
    }

    const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/userinfo`, {
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to load user profile: ${response.status}`)
    }

    this.userProfile = await response.json()
    return this.userProfile
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!(this.tokens?.access_token && !this.isTokenExpired())
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    if (!this.tokens?.access_token) return true
    
    try {
      const payload = JSON.parse(atob(this.tokens.access_token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      return payload.exp <= now + 30 // Consider expired if expires in 30 seconds
    } catch {
      return true
    }
  }

  /**
   * Get access token
   */
  getAccessToken() {
    return this.tokens?.access_token || null
  }

  /**
   * Get parsed token
   */
  getToken() {
    if (!this.tokens?.access_token) return null
    
    try {
      return JSON.parse(atob(this.tokens.access_token.split('.')[1]))
    } catch {
      return null
    }
  }

  /**
   * Get user roles
   */
  getUserRoles() {
    const token = this.getToken()
    return token?.realm_access?.roles || []
  }

  /**
   * Update token (refresh)
   */
  async updateToken() {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available')
    }

    const tokenData = {
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      refresh_token: this.tokens.refresh_token
    }

    const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(tokenData)
    })

    if (!response.ok) {
      // Refresh failed, clear tokens and require re-login
      this.clearStoredTokens()
      this.tokens = null
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    this.tokens = await response.json()
    this.storeTokens(this.tokens)
    
    console.log('🔄 Token refreshed successfully')
    return true
  }

  /**
   * Validate token with Keycloak
   */
  async validateToken(token) {
    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Setup automatic token refresh
   */
  setupTokenRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    this.refreshTimer = setInterval(async () => {
      try {
        if (this.isTokenExpired()) {
          await this.updateToken()
        }
      } catch (error) {
        console.error('⚠️ Automatic token refresh failed:', error)
        // Token refresh failed, user needs to re-login
        this.clearStoredTokens()
        this.tokens = null
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generate PKCE code challenge
   */
  async generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generate state parameter
   */
  generateState() {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Store tokens in localStorage
   */
  storeTokens(tokens) {
    try {
      localStorage.setItem('keycloak_tokens', JSON.stringify({
        ...tokens,
        stored_at: Date.now()
      }))
    } catch (error) {
      console.warn('Failed to store tokens:', error)
    }
  }

  /**
   * Get stored tokens from localStorage
   */
  getStoredTokens() {
    try {
      const stored = localStorage.getItem('keycloak_tokens')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.warn('Failed to retrieve stored tokens:', error)
      return null
    }
  }

  /**
   * Clear stored tokens
   */
  clearStoredTokens() {
    try {
      localStorage.removeItem('keycloak_tokens')
    } catch (error) {
      console.warn('Failed to clear stored tokens:', error)
    }
  }

  /**
   * Clean URL parameters
   */
  cleanUrl() {
    const url = new URL(window.location)
    url.search = ''
    window.history.replaceState({}, document.title, url.pathname)
  }
}

// Create singleton instance
const cspSafeKeycloakService = new CSPSafeKeycloakService()

export default cspSafeKeycloakService