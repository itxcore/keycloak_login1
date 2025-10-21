<template>
  <div class="container">
    <div class="welcome-header">
      <h1>👋 Welcome!</h1>
      <p class="subtitle">You are successfully authenticated</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading user profile...</p>
    </div>

    <div v-else-if="error" class="error">
      <h4>❌ Error Loading Profile</h4>
      <p>{{ error }}</p>
      <button @click="loadUserProfile" class="btn btn-secondary">
        🔄 Retry
      </button>
    </div>

    <div v-else-if="userProfile" class="user-info">
      <div class="user-header">
        <img 
          v-if="userProfile.picture || userProfile.attributes?.picture?.[0]" 
          :src="userProfile.picture || userProfile.attributes?.picture?.[0]"
          :alt="userProfile.name"
          class="user-avatar"
        >
        <div v-else class="user-avatar-placeholder">
          {{ getInitials(userProfile.name || userProfile.username) }}
        </div>
        <div class="user-details">
          <h2>{{ userProfile.name || `${userProfile.firstName} ${userProfile.lastName}` || userProfile.username }}</h2>
          <p class="user-email">{{ userProfile.email }}</p>
          <p class="user-username">@{{ userProfile.username }}</p>
        </div>
      </div>

      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">{{ userRoles.length }}</div>
          <div class="stat-label">Roles</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ isTokenValid ? '✅' : '❌' }}</div>
          <div class="stat-label">Token Valid</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ timeUntilExpiry }}</div>
          <div class="stat-label">Token Expires</div>
        </div>
      </div>

      <div class="user-details-expanded">
        <h3>📋 Profile Details</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Full Name:</label>
            <span>{{ userProfile.name || `${userProfile.firstName} ${userProfile.lastName}` || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Email:</label>
            <span>{{ userProfile.email || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Username:</label>
            <span>{{ userProfile.username || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>Email Verified:</label>
            <span>{{ userProfile.emailVerified ? '✅ Yes' : '❌ No' }}</span>
          </div>
          <div class="detail-item">
            <label>User ID:</label>
            <span class="monospace">{{ userProfile.id || tokenData?.sub || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="roles-section" v-if="userRoles.length > 0">
        <h3>🔐 User Roles</h3>
        <div class="roles-list">
          <span v-for="role in userRoles" :key="role" class="role-badge">
            {{ role }}
          </span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="refreshToken" :disabled="refreshing" class="btn btn-secondary">
        <span v-if="refreshing">⏳ Refreshing...</span>
        <span v-else>🔄 Refresh Token</span>
      </button>
      
      <button @click="loadUserProfile" :disabled="loading" class="btn btn-secondary">
        <span v-if="loading">⏳ Loading...</span>
        <span v-else>👤 Reload Profile</span>
      </button>

      <button @click="logout" class="btn btn-danger">
        🚪 Logout
      </button>
    </div>

    <div class="token-info" v-if="showTokenInfo">
      <h3>🎫 Token Information</h3>
      <div class="token-details">
        <div class="detail-item">
          <label>Issued At:</label>
          <span>{{ formatDate(tokenData?.iat) }}</span>
        </div>
        <div class="detail-item">
          <label>Expires At:</label>
          <span>{{ formatDate(tokenData?.exp) }}</span>
        </div>
        <div class="detail-item">
          <label>Issuer:</label>
          <span class="monospace">{{ tokenData?.iss || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>Audience:</label>
          <span class="monospace">{{ tokenData?.aud || '-' }}</span>
        </div>
      </div>
    </div>

    <button @click="toggleTokenInfo" class="btn btn-outline toggle-btn">
      {{ showTokenInfo ? '🙈 Hide Token Info' : '🎫 Show Token Info' }}
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

export default {
  name: 'DashboardView',
  setup() {
    const { user, getAccessToken, isTokenExpired } = useAuth()
    const userProfile = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const refreshing = ref(false)
    const showTokenInfo = ref(false)
    const currentTime = ref(Date.now())

    let timeInterval = null

    const tokenData = computed(() => {
      const token = getAccessToken()
      if (!token) return null
      
      try {
        // Decode JWT token to get payload
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload
      } catch (err) {
        console.error('Failed to decode token:', err)
        return null
      }
    })
    
    const userRoles = computed(() => {
      return user.value?.roles || []
    })
    
    const isTokenValid = computed(() => !isTokenExpired.value)
    
    const timeUntilExpiry = computed(() => {
      if (!tokenData.value?.exp) return 'Unknown'
      
      const expiryTime = tokenData.value.exp * 1000
      const timeLeft = expiryTime - currentTime.value
      
      if (timeLeft <= 0) return 'Expired'
      
      const minutes = Math.floor(timeLeft / 60000)
      const seconds = Math.floor((timeLeft % 60000) / 1000)
      
      return `${minutes}m ${seconds}s`
    })

    const loadUserProfile = async () => {
      loading.value = true
      error.value = null

      try {
        console.log('👤 Loading user profile...')
        // Use the auth store's user data instead of calling Keycloak directly
        const { user, refreshProfile } = useAuth()
        
        if (user.value) {
          userProfile.value = user.value
          console.log('✅ User profile loaded from auth store')
        } else {
          // Try to refresh profile if not available
          await refreshProfile()
          userProfile.value = user.value
          console.log('✅ User profile refreshed and loaded')
        }
      } catch (err) {
        console.error('Failed to load user profile:', err)
        error.value = err.message || 'Failed to load user profile'
      } finally {
        loading.value = false
      }
    }

    const refreshToken = async () => {
      refreshing.value = true

      try {
        console.log('🔄 Refreshing token...')
        const { forceTokenRefresh } = useAuth()
        await forceTokenRefresh()
        console.log('✅ Token refreshed successfully')
      } catch (err) {
        console.error('Token refresh failed:', err)
        error.value = err.message || 'Token refresh failed'
      } finally {
        refreshing.value = false
      }
    }

    const logout = async () => {
      try {
        console.log('🚪 Logging out...')
        const { logout: authLogout } = useAuth()
        await authLogout()
      } catch (err) {
        console.error('Logout failed:', err)
        error.value = err.message || 'Logout failed'
      }
    }

    const toggleTokenInfo = () => {
      showTokenInfo.value = !showTokenInfo.value
    }

    const getInitials = (name) => {
      if (!name) return '??'
      return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Unknown'
      return new Date(timestamp * 1000).toLocaleString()
    }

    onMounted(() => {
      loadUserProfile()
      
      // Update current time every second for token expiry countdown
      timeInterval = setInterval(() => {
        currentTime.value = Date.now()
      }, 1000)
    })

    onUnmounted(() => {
      if (timeInterval) {
        clearInterval(timeInterval)
      }
    })

    return {
      userProfile,
      loading,
      error,
      refreshing,
      showTokenInfo,
      tokenData,
      userRoles,
      isTokenValid,
      timeUntilExpiry,
      loadUserProfile,
      refreshToken,
      logout,
      toggleTokenInfo,
      getInitials,
      formatDate
    }
  }
}
</script>

<style scoped>
.welcome-header {
  margin-bottom: 2rem;
}

.welcome-header h1 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-radius: 50%;
  border-top: 4px solid #667eea;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.user-details h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.user-email {
  color: #666;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.user-username {
  color: #999;
  font-size: 0.9rem;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.user-details-expanded,
.roles-section,
.token-info {
  margin: 2rem 0;
  text-align: left;
}

.user-details-expanded h3,
.roles-section h3,
.token-info h3 {
  color: #333;
  margin-bottom: 1rem;
}

.detail-grid,
.token-details {
  display: grid;
  gap: 0.75rem;
}

.detail-item {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.detail-item label {
  font-weight: 500;
  color: #555;
}

.detail-item span {
  color: #333;
}

.monospace {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.role-badge {
  background: #e7f3ff;
  color: #0066cc;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.actions {
  margin: 2rem 0;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.toggle-btn {
  margin-top: 1rem;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .actions .btn {
    width: 100%;
    max-width: 300px;
  }
  
  .detail-item {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  
  .detail-item label {
    font-size: 0.9rem;
  }
}
</style>