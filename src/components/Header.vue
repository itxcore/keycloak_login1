<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <span class="logo-icon">🔐</span>
        <span class="logo-text">Keycloak Vue Demo</span>
      </div>
      <nav v-if="isAuthenticated" class="nav">
        <button @click="logout" class="btn btn-outline">
          🚪 Logout
        </button>
      </nav>
    </div>
  </header>
</template>

<script>
import { ref, onMounted, inject } from 'vue'

export default {
  name: 'Header',
  setup() {
    const keycloak = inject('keycloak')
    const isAuthenticated = ref(false)

    const updateAuthStatus = () => {
      isAuthenticated.value = keycloak.isAuthenticated()
    }

    const logout = async () => {
      try {
        await keycloak.logout()
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    onMounted(() => {
      updateAuthStatus()
      
      // Update auth status periodically
      const interval = setInterval(updateAuthStatus, 1000)
      return () => clearInterval(interval)
    })

    return {
      isAuthenticated,
      logout
    }
  }
}
</script>

<style scoped>
.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.nav {
  display: flex;
  gap: 1rem;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 600px) {
  .header-content {
    padding: 0 1rem;
  }
  
  .logo-text {
    display: none;
  }
}
</style>