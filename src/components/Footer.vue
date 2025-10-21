<template>
  <footer class="footer">
    <div class="footer-content">
      <p>&copy; 2025 Keycloak Vue Demo - Built with Vue 3 & keycloak-js</p>
      <div class="status" v-if="serverStatus">
        <span class="status-indicator" :class="{ 'online': serverStatus.status === 'healthy' }"></span>
        Server: {{ serverStatus.status || 'Unknown' }}
      </div>
    </div>
  </footer>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Footer',
  setup() {
    const serverStatus = ref(null)

    const checkServerHealth = async () => {
      try {
        const response = await fetch('/health')
        if (response.ok) {
          serverStatus.value = await response.json()
        }
      } catch (error) {
        console.warn('Health check failed:', error)
        serverStatus.value = { status: 'offline' }
      }
    }

    onMounted(() => {
      checkServerHealth()
      
      // Check health every 30 seconds
      const interval = setInterval(checkServerHealth, 30000)
      return () => clearInterval(interval)
    })

    return {
      serverStatus
    }
  }
}
</script>

<style scoped>
.footer {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
  transition: background 0.3s ease;
}

.status-indicator.online {
  background: #28a745;
}

@media (max-width: 600px) {
  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 1rem;
    text-align: center;
  }
}
</style>