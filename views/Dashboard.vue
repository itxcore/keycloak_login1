<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p class="welcome-message">Welcome back, {{ userDisplayName }}!</p>
    </div>

    <div class="dashboard-content">
      <!-- User Info Card -->
      <div class="card user-card">
        <h2>Your Profile</h2>
        <div class="user-details" v-if="user">
          <div class="user-avatar">
            <img 
              v-if="user.picture" 
              :src="user.picture" 
              :alt="userDisplayName"
              class="avatar-image"
            >
            <div v-else class="avatar-initials">
              {{ userInitials }}
            </div>
          </div>
          
          <div class="user-info">
            <div class="info-item">
              <label>Name:</label>
              <span>{{ user.name || 'Not provided' }}</span>
            </div>
            
            <div class="info-item">
              <label>Email:</label>
              <span>{{ user.email || 'Not provided' }}</span>
            </div>
            
            <div class="info-item">
              <label>Username:</label>
              <span>{{ user.username || 'Not provided' }}</span>
            </div>
            
            <div class="info-item" v-if="user.roles && user.roles.length">
              <label>Roles:</label>
              <div class="roles">
                <span 
                  v-for="role in user.roles" 
                  :key="role" 
                  class="role-badge"
                >
                  {{ role }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="user-actions">
          <button @click="refreshProfile" class="btn btn-secondary" :disabled="isLoading">
            {{ isLoading ? 'Refreshing...' : 'Refresh Profile' }}
          </button>
        </div>
      </div>

      <!-- Token Info Card -->
      <div class="card token-card">
        <h2>Session Information</h2>
        
        <div class="token-info">
          <div class="info-item">
            <label>Authentication Status:</label>
            <span class="status-badge authenticated">
              ✅ Authenticated
            </span>
          </div>
          
          <div class="info-item" v-if="tokenExpiresAt">
            <label>Session Expires:</label>
            <span :class="{'expires-soon': isTokenExpiringSoon}">
              {{ formatExpirationTime(tokenExpiresAt) }}
            </span>
          </div>
          
          <div class="info-item">
            <label>Auto Refresh:</label>
            <span class="status-badge enabled">
              ✅ Enabled
            </span>
          </div>
        </div>
        
        <div class="token-actions">
          <button @click="forceTokenRefresh" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Refreshing...' : 'Refresh Token' }}
          </button>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div class="card actions-card">
        <h2>Quick Actions</h2>
        
        <div class="action-grid">
          <router-link to="/profile" class="action-item">
            <div class="action-icon">👤</div>
            <span>Edit Profile</span>
          </router-link>
          
          <div class="action-item" @click="downloadUserData">
            <div class="action-icon">📄</div>
            <span>Export Data</span>
          </div>
          
          <div class="action-item" @click="showTokenInfo">
            <div class="action-icon">🔑</div>
            <span>View Token</span>
          </div>
          
          <div class="action-item danger" @click="handleLogout">
            <div class="action-icon">🚪</div>
            <span>Sign Out</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Token Modal -->
    <div v-if="showToken" class="modal-overlay" @click="hideTokenInfo">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Access Token Information</h3>
          <button @click="hideTokenInfo" class="close-btn">&times;</button>
        </div>
        <div class="modal-content">
          <div class="token-display">
            <label>Access Token (First 50 chars):</label>
            <code>{{ getAccessToken?.substring(0, 50) }}...</code>
          </div>
          <p class="token-warning">
            ⚠️ Never share your access token with anyone!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

// =============================================
// COMPOSABLE SETUP
// =============================================

const {
  user,
  isLoading,
  userDisplayName,
  userInitials,
  isTokenExpiringSoon,
  getAccessToken,
  refreshProfile,
  forceTokenRefresh,
  logout
} = useAuth()

// =============================================
// REACTIVE STATE
// =============================================

const showToken = ref(false)

// =============================================
// COMPUTED
// =============================================

const tokenExpiresAt = computed(() => {
  // This would come from your auth store
  // For now, returning a placeholder
  return Date.now() + 3600000 // 1 hour from now
})

// =============================================
// METHODS
// =============================================

const formatExpirationTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = date - now
  
  if (diff < 0) return 'Expired'
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}

const showTokenInfo = () => {
  showToken.value = true
}

const hideTokenInfo = () => {
  showToken.value = false
}

const downloadUserData = () => {
  const userData = {
    profile: user.value,
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(userData, null, 2)], { 
    type: 'application/json' 
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user-data.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleLogout = async () => {
  if (confirm('Are you sure you want to sign out?')) {
    await logout()
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.welcome-message {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.card h2 {
  color: #333;
  font-size: 1.25rem;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

/* User Card */
.user-details {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.5rem;
}

.user-info {
  flex: 1;
}

.info-item {
  margin-bottom: 1rem;
}

.info-item label {
  font-weight: 600;
  color: #555;
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.info-item span {
  color: #333;
}

.roles {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.role-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.authenticated {
  background: #d4edda;
  color: #155724;
}

.status-badge.enabled {
  background: #cce5ff;
  color: #004085;
}

.expires-soon {
  color: #f56500 !important;
  font-weight: 600;
}

/* Action Grid */
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: #333;
}

.action-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.action-item.danger:hover {
  background: #fee;
  color: #c33;
}

.action-icon {
  font-size: 1.5rem;
}

/* Buttons */
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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-content {
  padding: 1.5rem;
}

.token-display {
  margin-bottom: 1rem;
}

.token-display label {
  font-weight: 600;
  color: #555;
  display: block;
  margin-bottom: 0.5rem;
}

.token-display code {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  border: 1px solid #e9ecef;
}

.token-warning {
  color: #f56500;
  font-size: 0.875rem;
  margin: 0;
  text-align: center;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .user-details {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>