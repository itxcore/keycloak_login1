```vue
<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access your account</p>
        </div>

        <!-- Authentication Component -->
        <div class="login-content">
          <AuthButton />
        </div>

        <!-- Additional Info -->
        <div class="login-footer">
          <p class="help-text">
            New to our platform? 
            <router-link to="/signup" class="signup-link">Create an account</router-link>
          </p>
          
          <div class="security-info">
            <small>
              🔒 Secured by Keycloak authentication
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import AuthButton from '@/components/AuthButton.vue'

// =============================================
// COMPOSABLE SETUP
// =============================================

const { redirectIfAuthenticated } = useAuth()

// =============================================
// LIFECYCLE
// =============================================

onMounted(() => {
  // Redirect if already authenticated
  redirectIfAuthenticated()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #333;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.login-header p {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.login-content {
  margin-bottom: 2rem;
}

.login-footer {
  text-align: center;
}

.help-text {
  color: #666;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.signup-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.signup-link:hover {
  text-decoration: underline;
}

.security-info {
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.security-info small {
  color: #999;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }
  
  .login-card {
    padding: 2rem;
  }
}
</style>
```