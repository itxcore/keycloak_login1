<template>
  <div id="app">
    <!-- Header with authentication -->
    <header class="app-header">
      <div class="container">
        <h1 class="app-title">
          <router-link to="/">My Vue App</router-link>
        </h1>
        
        <!-- Authentication component -->
        <AuthButton />
      </div>
    </header>

    <!-- Main content -->
    <main class="app-main">
      <div class="container">
        <!-- Loading state during auth initialization -->
        <div v-if="isLoading && !isInitialized" class="loading-screen">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Initializing authentication...</p>
          </div>
        </div>
        
        <!-- Main router view -->
        <router-view v-else />
        
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
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="container">
        <p>&copy; 2025 My Vue App. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import AuthButton from '@/components/AuthButton.vue'

// =============================================
// COMPOSABLE SETUP
// =============================================

const {
  isLoading,
  error,
  initialize,
  clearError
} = useAuth()

// Track if auth has been initialized
const isInitialized = computed(() => {
  // You can add a specific isInitialized state to your auth store if needed
  return !isLoading.value || error.value !== null
})

// =============================================
// LIFECYCLE
// =============================================

onMounted(async () => {
  try {
    console.log('🚀 Initializing app...')
    await initialize()
    console.log('✅ App initialized successfully')
  } catch (err) {
    console.error('❌ App initialization failed:', err)
    // Error is handled by the auth store
  }
})
</script>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.app-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.app-title a {
  color: #333;
  text-decoration: none;
}

.app-title a:hover {
  color: #007bff;
}

/* Main content */
.app-main {
  flex: 1;
  padding: 2rem 0;
}

/* Footer */
.app-footer {
  background: #333;
  color: white;
  padding: 1rem 0;
  text-align: center;
}

.app-footer p {
  font-size: 0.875rem;
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
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
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

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header .container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .container {
    padding: 0 16px;
  }
  
  .app-main {
    padding: 1rem 0;
  }
}
</style>