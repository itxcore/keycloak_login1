```vue
<template>
  <div class="profile">
    <div class="container">
      <div class="profile-header">
        <h1>User Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div class="profile-content">
        <!-- Profile Information Card -->
        <div class="card profile-info">
          <div class="card-header">
            <h2>Profile Information</h2>
            <button 
              @click="toggleEdit" 
              class="btn btn-secondary"
              :disabled="isLoading"
            >
              {{ isEditing ? 'Cancel' : 'Edit Profile' }}
            </button>
          </div>

          <div class="profile-details">
            <!-- Avatar Section -->
            <div class="avatar-section">
              <div class="current-avatar">
                <img 
                  v-if="user?.picture || user?.attributes?.picture?.[0]" 
                  :src="user.picture || user.attributes?.picture?.[0]"
                  :alt="userDisplayName"
                  class="avatar-image"
                >
                <div v-else class="avatar-placeholder">
                  {{ userInitials }}
                </div>
              </div>
              
              <div class="avatar-info">
                <h3>{{ userDisplayName || 'No name set' }}</h3>
                <p class="user-id">ID: {{ user?.id || 'Unknown' }}</p>
              </div>
            </div>

            <!-- Profile Form -->
            <form @submit.prevent="saveProfile" class="profile-form">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input
                  id="firstName"
                  v-model="profileData.firstName"
                  type="text"
                  class="form-control"
                  :disabled="!isEditing"
                  placeholder="Enter your first name"
                >
              </div>

              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input
                  id="lastName"
                  v-model="profileData.lastName"
                  type="text"
                  class="form-control"
                  :disabled="!isEditing"
                  placeholder="Enter your last name"
                >
              </div>

              <div class="form-group">
                <label for="email">Email Address</label>
                <input
                  id="email"
                  v-model="profileData.email"
                  type="email"
                  class="form-control"
                  disabled
                  placeholder="Email managed by identity provider"
                >
                <small class="form-text">
                  Email address is managed by your identity provider and cannot be changed here.
                </small>
              </div>

              <div class="form-group">
                <label for="username">Username</label>
                <input
                  id="username"
                  v-model="profileData.username"
                  type="text"
                  class="form-control"
                  disabled
                  placeholder="Username is managed by identity provider"
                >
                <small class="form-text">
                  Username is managed by your identity provider and cannot be changed here.
                </small>
              </div>

              <div class="form-actions" v-if="isEditing">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="isLoading"
                >
                  {{ isLoading ? 'Saving...' : 'Save Changes' }}
                </button>
                
                <button 
                  type="button" 
                  @click="cancelEdit"
                  class="btn btn-secondary"
                  :disabled="isLoading"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Account Information Card -->
        <div class="card account-info">
          <div class="card-header">
            <h2>Account Information</h2>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Account Type</label>
              <span class="info-value">Social Login (Google)</span>
            </div>

            <div class="info-item">
              <label>Member Since</label>
              <span class="info-value">{{ formatDate(user?.createdTimestamp) }}</span>
            </div>

            <div class="info-item">
              <label>Last Login</label>
              <span class="info-value">{{ formatDate(Date.now()) }}</span>
            </div>

            <div class="info-item">
              <label>Email Verified</label>
              <span class="info-value">
                <span :class="user?.emailVerified ? 'verified' : 'unverified'">
                  {{ user?.emailVerified ? '✅ Verified' : '❌ Not Verified' }}
                </span>
              </span>
            </div>

            <div class="info-item" v-if="user?.roles?.length">
              <label>Roles</label>
              <div class="roles-list">
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

        <!-- Security Settings Card -->
        <div class="card security-settings">
          <div class="card-header">
            <h2>Security & Privacy</h2>
          </div>

          <div class="security-actions">
            <div class="security-item">
              <div class="security-info">
                <h3>Download Your Data</h3>
                <p>Export all your profile data in JSON format</p>
              </div>
              <button @click="downloadUserData" class="btn btn-secondary">
                Download Data
              </button>
            </div>

            <div class="security-item">
              <div class="security-info">
                <h3>Session Management</h3>
                <p>View and manage your active sessions</p>
              </div>
              <button @click="showSessions" class="btn btn-secondary">
                View Sessions
              </button>
            </div>

            <div class="security-item danger-zone">
              <div class="security-info">
                <h3>Sign Out</h3>
                <p>Sign out from this device and all sessions</p>
              </div>
              <button @click="handleLogout" class="btn btn-danger">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

// =============================================
// COMPOSABLE SETUP
// =============================================

const {
  user,
  isLoading,
  userDisplayName,
  userInitials,
  refreshProfile,
  logout
} = useAuth()

// =============================================
// REACTIVE STATE
// =============================================

const isEditing = ref(false)
const message = ref('')
const messageType = ref('')

const profileData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  username: ''
})

// =============================================
// COMPUTED
// =============================================

const hasChanges = computed(() => {
  if (!user.value) return false
  
  return (
    profileData.firstName !== (user.value.firstName || '') ||
    profileData.lastName !== (user.value.lastName || '')
  )
})

// =============================================
// METHODS
// =============================================

const loadProfileData = () => {
  if (user.value) {
    profileData.firstName = user.value.firstName || user.value.given_name || ''
    profileData.lastName = user.value.lastName || user.value.family_name || ''
    profileData.email = user.value.email || ''
    profileData.username = user.value.username || user.value.preferred_username || ''
  }
}

const toggleEdit = () => {
  if (isEditing.value) {
    cancelEdit()
  } else {
    isEditing.value = true
    loadProfileData()
  }
}

const cancelEdit = () => {
  isEditing.value = false
  loadProfileData() // Reset form data
}

const saveProfile = async () => {
  if (!hasChanges.value) {
    showMessage('No changes to save', 'info')
    return
  }

  try {
    // In a real app, you would send this to your backend
    console.log('Saving profile data:', profileData)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update local user data (in a real app, this would come from the API response)
    if (user.value) {
      user.value.firstName = profileData.firstName
      user.value.lastName = profileData.lastName
      user.value.name = `${profileData.firstName} ${profileData.lastName}`.trim()
    }
    
    isEditing.value = false
    showMessage('Profile updated successfully!', 'success')
  } catch (error) {
    console.error('Failed to save profile:', error)
    showMessage('Failed to save profile. Please try again.', 'error')
  }
}

const downloadUserData = () => {
  const userData = {
    profile: user.value,
    exportedAt: new Date().toISOString(),
    type: 'user-profile-export'
  }
  
  const blob = new Blob([JSON.stringify(userData, null, 2)], { 
    type: 'application/json' 
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `user-profile-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showMessage('User data downloaded successfully', 'success')
}

const showSessions = () => {
  showMessage('Session management coming soon!', 'info')
}

const handleLogout = async () => {
  if (confirm('Are you sure you want to sign out from all sessions?')) {
    try {
      await logout()
    } catch (error) {
      showMessage('Logout failed. Please try again.', 'error')
    }
  }
}

const showMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type
  
  setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 5000)
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// =============================================
// LIFECYCLE
// =============================================

onMounted(() => {
  loadProfileData()
})
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 3rem;
}

.profile-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.profile-header p {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  color: #333;
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

/* Avatar Section */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.current-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 2rem;
}

.avatar-info h3 {
  color: #333;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.user-id {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
  font-family: monospace;
}

/* Form Styles */
.profile-form {
  display: grid;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-control:disabled {
  background: #f8f9fa;
  color: #666;
}

.form-text {
  color: #666;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* Info Grid */
.info-grid {
  display: grid;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 600;
  color: #555;
  font-size: 0.875rem;
}

.info-value {
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

.verified {
  color: #28a745;
}

.unverified {
  color: #dc3545;
}

.roles-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.role-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Security Settings */
.security-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.security-item.danger-zone {
  background: #fff5f5;
  border: 1px solid #fed7d7;
}

.security-info h3 {
  color: #333;
  font-size: 1rem;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.security-info p {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

/* Messages */
.message {
  padding: 1rem;
  border-radius: 6px;
  margin-top: 2rem;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.info {
  background: #cce5ff;
  color: #004085;
  border: 1px solid #b3d7ff;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .info-value {
    text-align: left;
    margin-left: 0;
  }
  
  .roles-list {
    justify-content: flex-start;
  }
  
  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
```