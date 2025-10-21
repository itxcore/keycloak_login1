```vue
<template>
  <div class="not-found">
    <div class="not-found-container">
      <div class="error-content">
        <div class="error-icon">
          <span class="icon-404">404</span>
        </div>
        
        <div class="error-text">
          <h1>Page Not Found</h1>
          <p class="error-message">
            Oops! The page you're looking for doesn't exist. 
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        <div class="error-actions">
          <router-link to="/" class="btn btn-primary">
            🏠 Go Home
          </router-link>
          
          <button @click="goBack" class="btn btn-secondary">
            ← Go Back
          </button>
          
          <router-link to="/dashboard" class="btn btn-outline" v-if="isAuthenticated">
            📊 Dashboard
          </router-link>
        </div>
        
        <div class="helpful-links">
          <h3>Popular Pages</h3>
          <div class="links-grid">
            <router-link to="/" class="helpful-link">
              <span class="link-icon">🏠</span>
              <span class="link-text">Home</span>
            </router-link>
            
            <router-link to="/login" class="helpful-link" v-if="!isAuthenticated">
              <span class="link-icon">🔐</span>
              <span class="link-text">Login</span>
            </router-link>
            
            <router-link to="/dashboard" class="helpful-link" v-if="isAuthenticated">
              <span class="link-icon">📊</span>
              <span class="link-text">Dashboard</span>
            </router-link>
            
            <router-link to="/profile" class="helpful-link" v-if="isAuthenticated">
              <span class="link-icon">👤</span>
              <span class="link-text">Profile</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// =============================================
// COMPOSABLE SETUP
// =============================================

const router = useRouter()
const { isAuthenticated } = useAuth()

// =============================================
// METHODS
// =============================================

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.not-found-container {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.error-icon {
  margin-bottom: 2rem;
}

.icon-404 {
  font-size: 6rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  line-height: 1;
}

.error-text {
  margin-bottom: 3rem;
}

.error-text h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.error-message {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.helpful-links {
  border-top: 1px solid #e9ecef;
  padding-top: 2rem;
}

.helpful-links h3 {
  color: #333;
  font-size: 1.25rem;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.helpful-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
}

.helpful-link:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.link-icon {
  font-size: 1.5rem;
}

.link-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
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
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 2px solid #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .not-found {
    padding: 1rem;
  }
  
  .not-found-container {
    padding: 2rem;
  }
  
  .icon-404 {
    font-size: 4rem;
  }
  
  .error-text h1 {
    font-size: 2rem;
  }
  
  .error-message {
    font-size: 1rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 200px;
  }
  
  .links-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
  
  .helpful-link {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
  }
}
</style>
```