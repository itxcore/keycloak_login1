```vue
<template>
  <div class="home">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Welcome to Our Platform</h1>
        <p class="hero-subtitle">
          Experience secure authentication with Keycloak and Google Social Login
        </p>
        
        <div class="hero-actions">
          <router-link 
            v-if="!isAuthenticated" 
            to="/login" 
            class="btn btn-primary btn-large"
          >
            Get Started
          </router-link>
          
          <router-link 
            v-else 
            to="/dashboard" 
            class="btn btn-primary btn-large"
          >
            Go to Dashboard
          </router-link>
          
          <a href="#features" class="btn btn-secondary btn-large">
            Learn More
          </a>
        </div>
      </div>
    </div>

    <div id="features" class="features-section">
      <div class="container">
        <h2 class="section-title">Features</h2>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🔐</div>
            <h3>Secure Authentication</h3>
            <p>
              Industry-standard OAuth 2.0 and OpenID Connect protocols 
              with Keycloak for enterprise-grade security.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>Social Login</h3>
            <p>
              Sign in seamlessly with your Google account. 
              No need to remember additional passwords.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>Modern Stack</h3>
            <p>
              Built with Vue 3, Composition API, Pinia state management, 
              and CSP-safe authentication practices.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Responsive Design</h3>
            <p>
              Optimized for all devices with a clean, modern interface 
              that works on desktop, tablet, and mobile.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>Auto Token Refresh</h3>
            <p>
              Automatic token refresh ensures uninterrupted sessions 
              without requiring manual re-authentication.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Fast & Reliable</h3>
            <p>
              Optimized performance with efficient state management 
              and minimal network requests for a smooth user experience.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>
            Join thousands of users who trust our secure authentication platform.
          </p>
          
          <router-link 
            v-if="!isAuthenticated" 
            to="/login" 
            class="btn btn-primary btn-large"
          >
            Sign In Now
          </router-link>
          
          <div v-else class="user-welcome">
            <p>Welcome back, {{ userDisplayName }}!</p>
            <router-link to="/dashboard" class="btn btn-primary">
              Continue to Dashboard
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

// =============================================
// COMPOSABLE SETUP
// =============================================

const { isAuthenticated, userDisplayName } = useAuth()
</script>

<style scoped>
.home {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 2rem;
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0 0 3rem 0;
  opacity: 0.9;
  line-height: 1.4;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Features Section */
.features-section {
  padding: 6rem 0;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 4rem 0;
  font-weight: 600;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
}

.feature-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* CTA Section */
.cta-section {
  background: #333;
  color: white;
  padding: 6rem 0;
  text-align: center;
}

.cta-content h2 {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.cta-content p {
  font-size: 1.2rem;
  margin: 0 0 3rem 0;
  opacity: 0.9;
}

.user-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.user-welcome p {
  font-size: 1.5rem;
  color: #4CAF50;
  margin: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-large {
  padding: 1.25rem 2.5rem;
  font-size: 1.1rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #333;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .feature-card {
    padding: 2rem;
  }
  
  .container {
    padding: 0 1rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .features-section {
    padding: 4rem 0;
  }
  
  .cta-section {
    padding: 4rem 0;
  }
}
</style>
```