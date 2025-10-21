/**
 * Application Configuration
 * 
 * Centralized configuration management using Vite environment variables.
 * This ensures type safety and provides defaults for all configuration values.
 */

export const config = {
  // App Information
  app: {
    name: import.meta.env.VITE_APP_NAME || 'My Vue App',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development'
  },

  // Keycloak Configuration
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth.utribe.app',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'utribe',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'giftportal'
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000
  },

  // Security Configuration
  security: {
    enableAuthDebug: import.meta.env.VITE_ENABLE_AUTH_DEBUG === 'true',
    tokenRefreshBufferTime: parseInt(import.meta.env.VITE_TOKEN_REFRESH_BUFFER_TIME) || 300000, // 5 minutes
    sessionStorageKey: 'vue_app_session',
    localStoragePrefix: 'vue_app_'
  },

  // Feature Flags
  features: {
    enableGoogleLogin: import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false',
    enableRememberMe: import.meta.env.VITE_ENABLE_REMEMBER_ME !== 'false',
    enableAutoLogin: import.meta.env.VITE_ENABLE_AUTO_LOGIN === 'true'
  },

  // Development Settings
  development: {
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS !== 'false'
  }
}

/**
 * Check if running in development mode
 */
export const isDevelopment = () => {
  return config.app.environment === 'development' || import.meta.env.DEV
}

/**
 * Check if running in production mode
 */
export const isProduction = () => {
  return config.app.environment === 'production' || import.meta.env.PROD
}

/**
 * Get full Keycloak configuration object
 */
export const getKeycloakConfig = () => {
  return {
    url: config.keycloak.url,
    realm: config.keycloak.realm,
    clientId: config.keycloak.clientId
  }
}

/**
 * Get API endpoint URL
 */
export const getApiUrl = (endpoint = '') => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, '') // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, '') // Remove leading slash
  return cleanEndpoint ? `${baseUrl}/${cleanEndpoint}` : baseUrl
}

/**
 * Development logging utility
 */
export const devLog = {
  debug: (...args) => {
    if (isDevelopment() && config.security.enableAuthDebug) {
      console.debug('🐛 [DEBUG]', ...args)
    }
  },
  
  info: (...args) => {
    if (isDevelopment() || config.development.logLevel !== 'error') {
      console.info('ℹ️ [INFO]', ...args)
    }
  },
  
  warn: (...args) => {
    console.warn('⚠️ [WARN]', ...args)
  },
  
  error: (...args) => {
    console.error('❌ [ERROR]', ...args)
  }
}

/**
 * Validate required environment variables
 */
export const validateConfig = () => {
  const requiredVars = [
    'VITE_KEYCLOAK_URL',
    'VITE_KEYCLOAK_REALM', 
    'VITE_KEYCLOAK_CLIENT_ID'
  ]

  const missing = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env files and ensure all required variables are set.'
    )
  }

  devLog.info('Configuration validated successfully', {
    environment: config.app.environment,
    keycloak: config.keycloak,
    api: config.api
  })
}

// Validate configuration on import in development
if (isDevelopment()) {
  try {
    validateConfig()
  } catch (error) {
    devLog.error('Configuration validation failed:', error)
  }
}

export default config