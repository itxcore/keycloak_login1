```vue
<template>
  <div class="auth-callback">
    <div class="callback-container">
      <!-- Processing state -->
      <div v-if="isProcessing" class="processing">
        <div class="spinner"></div>
        <h2>Completing Sign In...</h2>
        <p>Please wait while we process your authentication.</p>
      </div>
      
      <!-- Success state -->
      <div v-else-if="isSuccess" class="success">
        <div class="success-icon">✅</div>
        <h2>Sign In Successful!</h2>
        <p>Redirecting you to your dashboard...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error">
        <div class="error-icon">❌</div>
        <h2>Sign In Failed</h2>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button @click="tryAgain" class="btn btn-primary">
            Try Again
          </button>
          <router-link to="/" class="btn btn-secondary">
            Go Home
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// =============================================
// REACTIVE STATE
// =============================================

const router = useRouter()
const { handleCallback } = useAuth()

const isProcessing = ref(true)
const isSuccess = ref(false)
const error = ref(null)

// =============================================
// METHODS
// =============================================

const processCallback = async () => {
  try {
    isProcessing.value = true
    error.value = null
    
    console.log('🔄 Processing OAuth callback...')
    
    const success = await handleCallback()
    
    if (success) {
      isSuccess.value = true
      isProcessing.value = false
      
      // Small delay for user feedback, then redirect
      setTimeout(() => {
        const redirectTo = sessionStorage.getItem('auth_redirect_after_login') || '/dashboard'
        sessionStorage.removeItem('auth_redirect_after_login')
        router.push(redirectTo)
      }, 1500)
    } else {
      throw new Error('Authentication callback did not complete successfully')
    }
  } catch (err) {
    console.error('❌ Callback processing failed:', err)
    error.value = err.message || 'Authentication failed. Please try again.'
    isProcessing.value = false
    isSuccess.value = false
  }
}

const tryAgain = () => {
  router.push('/login')
}

// =============================================
// LIFECYCLE
// =============================================

onMounted(() => {
  // Small delay to show the processing state
  setTimeout(processCallback, 500)
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.callback-container {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.processing,
.success,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-icon,
.error-icon {
  font-size: 48px;
  margin-bottom: 0.5rem;
}

h2 {
  color: #333;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

p {
  color: #666;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

@media (max-width: 768px) {
  .callback-container {
    padding: 2rem;
    margin: 1rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
```