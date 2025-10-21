import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import your components
import Home from './views/Home.vue'
import Dashboard from './views/Dashboard.vue'
import Login from './views/Login.vue'
import AuthCallback from './views/AuthCallback.vue'

// Import auth composable for route guards
import { useAuth } from './composables/useAuth'

// =============================================
// PINIA STORE SETUP
// =============================================

const pinia = createPinia()

// =============================================
// ROUTER SETUP
// =============================================

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { 
      requiresAuth: false,
      title: 'Home'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      title: 'Login',
      redirectIfAuthenticated: true
    }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback,
    meta: { 
      requiresAuth: false,
      title: 'Authentication'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { 
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('./views/Profile.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Profile'
    }
  },
  // Catch-all route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./views/NotFound.vue'),
    meta: { 
      requiresAuth: false,
      title: 'Page Not Found'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// =============================================
// NAVIGATION GUARDS
// =============================================

router.beforeEach(async (to, from, next) => {
  // Update document title
  document.title = to.meta.title ? `${to.meta.title} - My Vue App` : 'My Vue App'
  
  // Skip auth checks for auth callback route
  if (to.name === 'AuthCallback') {
    next()
    return
  }
  
  // Get auth store (it should be available since we're using it after pinia is created)
  const { isAuthenticated, isLoading } = useAuth()
  
  // Wait for auth initialization if still loading
  if (isLoading.value) {
    // You might want to show a loading screen here
    console.log('⏳ Waiting for auth initialization...')
    // For now, just proceed - the auth store will handle initialization
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    console.log('🔒 Route requires authentication, redirecting to login')
    // Store the intended destination
    sessionStorage.setItem('auth_redirect_after_login', to.fullPath)
    next('/login')
    return
  }
  
  // Redirect authenticated users away from login page
  if (to.meta.redirectIfAuthenticated && isAuthenticated.value) {
    console.log('✅ User already authenticated, redirecting to dashboard')
    next('/dashboard')
    return
  }
  
  next()
})

// Handle navigation errors
router.onError((error) => {
  console.error('🚨 Router error:', error)
})

// =============================================
// VUE APP SETUP
// =============================================

const app = createApp(App)

// Install plugins
app.use(pinia)
app.use(router)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('🚨 Global error:', err)
  console.error('Component:', instance)
  console.error('Error info:', info)
  
  // You could send this to an error reporting service
  // trackError(err, { component: instance, info })
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

console.log('🚀 Vue app initialized with Pinia and Vue Router')
console.log('🔐 Authentication store available globally')
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