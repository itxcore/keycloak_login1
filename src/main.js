import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// =============================================
// PINIA STORE SETUP
// =============================================

const pinia = createPinia()

// =============================================
// VUE APP SETUP
// =============================================

const app = createApp(App)

// Install Pinia first - this makes stores available
app.use(pinia)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('🚨 Global error:', err)
  console.error('Component:', instance)
  console.error('Error info:', info)
}

// Global warning handler (development only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('⚠️ Vue warning:', msg)
    console.warn('Component:', instance)
    console.warn('Trace:', trace)
  }
}

// =============================================
// MOUNT APP
// =============================================

app.mount('#app')

console.log('🚀 Vue app initialized with Pinia')
console.log('🔐 Authentication store available globally via useAuth composable')
console.log('📱 App ready!')

// =============================================
// DEVELOPMENT HELPERS
// =============================================

if (import.meta.env.DEV) {
  // Make stores available in browser console for debugging
  window.__VUE_APP__ = app
  window.__PINIA__ = pinia
  
  console.log('🛠️ Development mode: Vue app and Pinia store available on window')
  console.log('   Access via: window.__VUE_APP__ or window.__PINIA__')
}