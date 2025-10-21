<template>
  <div id="app">
    <Header />
    
    <main class="main-content">
      <!-- Show loading during initialization -->
      <div v-if="!isInitialized" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Initializing authentication...</p>
      </div>
      
      <!-- Show content after initialization -->
      <router-view v-else />
    </main>
    
    <Footer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

const { initialize, isInitialized } = useAuth()

let initializationStarted = false

onMounted(async () => {
  // Prevent multiple initialization attempts
  if (initializationStarted) {
    console.log('⚠️ APP: Initialization already started, skipping...')
    return
  }
  
  console.log('⏳ APP: Starting initialization...')
  console.log('📍 APP: Current URL:', window.location.href)
  console.log('📍 APP: isInitialized before init:', isInitialized.value)
  
  try {
    initializationStarted = true
    
    await initialize()
    console.log('✅ APP: Initialization completed')
    console.log('📍 APP: isInitialized after init:', isInitialized.value)
    
  } catch (error) {
    console.error('❌ APP: Initialization failed:', error)
    initializationStarted = false
  }
})
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 120px);
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>