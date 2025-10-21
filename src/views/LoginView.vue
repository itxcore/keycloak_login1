<template>
  <div class="container">
    <div class="logo">🔐</div>
    <h1>Keycloak Vue 3 Integration</h1>
    <p class="description">
      Modern authentication demo using <strong>Vue 3</strong>, <strong>keycloak-js</strong>, 
      and <strong>Google social login</strong>.
    </p>

    <div v-if="error" class="error">
      <h4>❌ Authentication Error</h4>
      <p>{{ error }}</p>
      <button @click="clearError" class="btn btn-secondary">
        Clear Error
      </button>
    </div>

    <div class="auth-buttons">
      <button 
        @click="loginWithGoogle" 
        :disabled="isLoading"
        class="btn btn-primary"
      >
        <span v-if="isLoading">⏳ Redirecting...</span>
        <span v-else>🚀 Login with Google</span>
      </button>

      <button 
        @click="regularLogin" 
        :disabled="isLoading"
        class="btn btn-secondary"
      >
        <span v-if="isLoading">⏳ Redirecting...</span>
        <span v-else>🔑 Regular Login</span>
      </button>
    </div>

    <div class="features">
      <h3>✨ Features</h3>
      <ul>
        <li>🔐 Secure PKCE OAuth2 flow</li>
        <li>🔄 Automatic token refresh</li>
        <li>👤 User profile management</li>
        <li>📱 Responsive design</li>
        <li>🎯 Vue 3 Composition API</li>
      </ul>
    </div>

    <div class="debug-info" v-if="showDebug">
      <h4>🐛 Debug Information</h4>
      <pre>{{ debugInfo }}</pre>
      <button @click="refreshDebugInfo" class="btn btn-secondary">
        🔄 Refresh Debug Info
      </button>
    </div>

    <button @click="toggleDebug" class="btn btn-outline debug-toggle">
      {{ showDebug ? '🙈 Hide Debug' : '🐛 Show Debug' }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted, inject } from 'vue'

export default {
  name: 'LoginView',
  setup() {
    const keycloak = inject('keycloak')
    const isLoading = ref(false)
    const error = ref(null)
    const showDebug = ref(false)
    const debugInfo = ref({})

    const loginWithGoogle = async () => {
      isLoading.value = true
      error.value = null

      try {
        console.log('🚀 Starting Google login...')
        await keycloak.loginWithGoogle()
      } catch (err) {
        console.error('Google login failed:', err)
        error.value = err.message || 'Google login failed'
        isLoading.value = false
      }
    }

    const regularLogin = async () => {
      isLoading.value = true
      error.value = null

      try {
        console.log('🔑 Starting regular login...')
        await keycloak.login()
      } catch (err) {
        console.error('Regular login failed:', err)
        error.value = err.message || 'Login failed'
        isLoading.value = false
      }
    }

    const clearError = () => {
      error.value = null
    }

    const toggleDebug = () => {
      showDebug.value = !showDebug.value
      if (showDebug.value) {
        refreshDebugInfo()
      }
    }

    const refreshDebugInfo = () => {
      debugInfo.value = {
        isInitialized: keycloak.isInitialized,
        isAuthenticated: keycloak.isAuthenticated(),
        config: keycloak.config,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        location: {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search
        }
      }
    }

    onMounted(() => {
      // Initial debug info
      refreshDebugInfo()
    })

    return {
      isLoading,
      error,
      showDebug,
      debugInfo,
      loginWithGoogle,
      regularLogin,
      clearError,
      toggleDebug,
      refreshDebugInfo
    }
  }
}
</script>

<style scoped>
.logo {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h1 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 2.2rem;
}

.description {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
  font-size: 1.1rem;
}

.auth-buttons {
  margin: 2rem 0;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features {
  margin: 2rem 0;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.features h3 {
  text-align: center;
  color: #333;
  margin-bottom: 1rem;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 0.5rem 0;
  color: #555;
  font-size: 1rem;
}

.debug-info {
  margin: 2rem 0;
  text-align: left;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.debug-info h4 {
  margin-bottom: 1rem;
  color: #333;
}

.debug-info pre {
  font-size: 0.8rem;
  color: #555;
  white-space: pre-wrap;
  word-break: break-word;
}

.debug-toggle {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

@media (max-width: 600px) {
  .auth-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .auth-buttons .btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>