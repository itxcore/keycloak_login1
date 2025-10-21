import { createApp } from 'vue'
import App from './App.vue'
import cspSafeKeycloakService from './services/csp-safe-keycloak.js'

// Initialize CSP-Safe Keycloak and then mount Vue app
async function initApp() {
  try {
    console.log('🚀 Starting Vue app with CSP-Safe Keycloak integration...')
    
    // Initialize our CSP-safe Keycloak service (no iframe usage)
    const authenticated = await cspSafeKeycloakService.init()
    
    // Create and mount Vue app
    const app = createApp(App)
    
    // Make keycloak service available globally
    app.config.globalProperties.$keycloak = cspSafeKeycloakService
    
    // Provide keycloak service for composition API
    app.provide('keycloak', cspSafeKeycloakService)
    
    app.mount('#app')
    
    console.log(`✅ Vue app mounted successfully. Authenticated: ${authenticated}`)
    
  } catch (error) {
    console.error('❌ Failed to initialize app:', error)
    
    // Show error in DOM
    document.getElementById('app').innerHTML = `
      <div style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0;
        padding: 20px;
      ">
        <div style="
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 3rem;
          text-align: center;
          max-width: 500px;
        ">
          <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
          <h1 style="color: #dc3545; margin-bottom: 1rem;">Initialization Error</h1>
          <p style="color: #666; margin-bottom: 1rem;">Failed to initialize CSP-Safe Keycloak:</p>
          <code style="background: #f8f9fa; padding: 0.5rem; border-radius: 4px; color: #dc3545;">
            ${error.message}
          </code>
          <br><br>
          <button onclick="window.location.reload()" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
          ">
            🔄 Retry
          </button>
        </div>
      </div>
    `
  }
}

// Start the application
initApp()