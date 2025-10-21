import Keycloak from 'keycloak-js'

class KeycloakService {
  constructor() {
    this.keycloak = null
    this.isInitialized = false
    this.config = {
      url: 'https://auth.utribe.app',
      realm: 'utribe',
      clientId: 'giftportal'
    }
  }

  /**
   * Initialize Keycloak instance
   * @param {Object} options - Keycloak initialization options
   * @returns {Promise<boolean>} - Returns true if authenticated
   */
  async init(options = {}) {
    try {
      console.log('🔧 Initializing Keycloak service...')
      
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

      // Initialize Keycloak
      this.keycloak = new Keycloak(this.config)

      const defaultOptions = {
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false, // Disable iframe checks that cause CSP issues
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        enableLogging: true,
        messageReceiveTimeout: 10000,
        // Add these options to avoid frame issues
        flow: 'standard',
        responseMode: 'fragment',
        // Disable silent check SSO fallback to avoid iframe issues
        silentCheckSsoFallback: false
      }

      const initOptions = { ...defaultOptions, ...options }
      console.log('🚀 Initializing with options:', initOptions)

      const authenticated = await this.keycloak.init(initOptions)
      this.isInitialized = true

      // Setup token refresh
      this.setupTokenRefresh()

      // Setup event listeners
      this.setupEventListeners()

      console.log(`✅ Keycloak initialized. Authenticated: ${authenticated}`)
      return authenticated

    } catch (error) {
      console.error('❌ Keycloak initialization failed:', error)
      throw new Error(`Keycloak initialization failed: ${error.message}`)
    }
  }

  /**
   * Login with Google social provider
   * @param {Object} options - Login options
   */
  loginWithGoogle(options = {}) {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized')
    }

    const loginOptions = {
      idpHint: 'google',
      redirectUri: window.location.origin,
      ...options
    }

    console.log('🔑 Initiating Google login...')
    return this.keycloak.login(loginOptions)
  }

  /**
   * Standard login
   * @param {Object} options - Login options
   */
  login(options = {}) {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized')
    }

    console.log('🔑 Initiating login...')
    return this.keycloak.login(options)
  }

  /**
   * Logout
   * @param {Object} options - Logout options
   */
  logout(options = {}) {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized')
    }

    const logoutOptions = {
      redirectUri: window.location.origin,
      ...options
    }

    console.log('🚪 Logging out...')
    return this.keycloak.logout(logoutOptions)
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile() {
    if (!this.keycloak || !this.isAuthenticated()) {
      throw new Error('User not authenticated')
    }

    try {
      const profile = await this.keycloak.loadUserProfile()
      console.log('👤 User profile loaded:', profile)
      return profile
    } catch (error) {
      console.error('❌ Failed to load user profile:', error)
      throw error
    }
  }

  /**
   * Get parsed token
   * @returns {Object|null} Parsed token
   */
  getToken() {
    return this.keycloak?.tokenParsed || null
  }

  /**
   * Get raw access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return this.keycloak?.token || null
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.keycloak?.authenticated || false
  }

  /**
   * Check if token is expired
   * @param {number} minValidity - Minimum validity in seconds
   * @returns {boolean}
   */
  isTokenExpired(minValidity = 30) {
    return this.keycloak?.isTokenExpired(minValidity) || false
  }

  /**
   * Update token
   * @param {number} minValidity - Minimum validity in seconds
   * @returns {Promise<boolean>}
   */
  async updateToken(minValidity = 30) {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized')
    }

    try {
      const refreshed = await this.keycloak.updateToken(minValidity)
      if (refreshed) {
        console.log('🔄 Token refreshed')
      }
      return refreshed
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Get user roles
   * @returns {Array<string>}
   */
  getUserRoles() {
    const token = this.getToken()
    return token?.realm_access?.roles || []
  }

  /**
   * Check if user has role
   * @param {string} role - Role name
   * @returns {boolean}
   */
  hasRole(role) {
    return this.getUserRoles().includes(role)
  }

  /**
   * Setup automatic token refresh
   */
  setupTokenRefresh() {
    if (!this.keycloak) return

    // Check token every 30 seconds
    setInterval(async () => {
      try {
        if (this.isTokenExpired(60)) { // Refresh if expires in 60 seconds
          await this.updateToken(60)
        }
      } catch (error) {
        console.error('⚠️ Automatic token refresh failed:', error)
        // Could emit an event here for the Vue app to handle
      }
    }, 30000)
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.keycloak) return

    this.keycloak.onReady = (authenticated) => {
      console.log(`🎯 Keycloak ready. Authenticated: ${authenticated}`)
    }

    this.keycloak.onAuthSuccess = () => {
      console.log('✅ Authentication successful')
    }

    this.keycloak.onAuthError = () => {
      console.error('❌ Authentication error')
    }

    this.keycloak.onAuthRefreshSuccess = () => {
      console.log('🔄 Token refresh successful')
    }

    this.keycloak.onAuthRefreshError = () => {
      console.error('❌ Token refresh error')
    }

    this.keycloak.onTokenExpired = () => {
      console.warn('⏰ Token expired')
    }
  }

  /**
   * Get Keycloak instance (for advanced usage)
   * @returns {Keycloak|null}
   */
  getInstance() {
    return this.keycloak
  }
}

// Create singleton instance
const keycloakService = new KeycloakService()

export default keycloakService