<template>
  <div id="app">
    <Header />
    <main>
      <!-- Loading state during auth initialization -->
      <div v-if="isLoading && !isInitialized" class="loading-screen">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Initializing authentication...</p>
        </div>
      </div>
      
      <!-- Main content based on auth state -->
      <component :is="currentView" v-else />
      
      <!-- Global error handling -->
      <div v-if="error && !isLoading" class="global-error">
        <div class="error-content">
          <h3>Authentication Error</h3>
          <p>{{ error }}</p>
          <button @click="clearError" class="btn btn-primary">
            Dismiss
          </button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'

export default {
  name: 'App',
  components: {
    Header,
    Footer,
    LoginView,
    DashboardView
  },
  setup() {
    // Use our new Pinia-based auth system
    const {
      isAuthenticated,
      isLoading,
      error,
      initialize,
      clearError,
      isInitialized
    } = useAuth()

    // Determine current view based on auth state
    const currentView = computed(() => {
      return isAuthenticated.value ? 'DashboardView' : 'LoginView'
    })

    // Initialize authentication on app mount
    onMounted(async () => {
      try {
        console.log('🚀 Initializing app...')
        await initialize()
        console.log('✅ App initialized successfully')
      } catch (err) {
        console.error('❌ App initialization failed:', err)
      }
    })

    return {
      currentView,
      isLoading,
      isInitialized,
      error,
      clearError
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.btn {
  display: inline-block;
  padding: 12px 30px;
  margin: 10px;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e9ecef;
}

.btn-secondary:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.user-info {
  text-align: left;
  background: #e8f5e8;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.user-info h3 {
  color: #155724;
  margin-bottom: 1rem;
}

.user-info p {
  margin: 0.5rem 0;
  color: #155724;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 1rem auto;
  display: block;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.loading {
  color: #6c757d;
  font-style: italic;
}

/* Loading screen */
.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  text-align: center;
  color: white;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Global error */
.global-error {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.error-content h3 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-content p {
  margin-bottom: 1.5rem;
  color: #666;
}

@media (max-width: 600px) {
  .container {
    padding: 2rem 1.5rem;
  }

  .btn {
    display: block;
    width: 100%;
    margin: 10px 0;
  }
}
</style>