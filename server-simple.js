// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const debug = require('debug')('keycloak-app');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Import fetch for Node.js versions that don't have it built-in
const fetch = globalThis.fetch || require('node-fetch');

const app = express();
const PORT = 8000;

// Advanced debugging configuration
debug('Starting Keycloak Social Login Application with keycloak-js');

// Memory store for session
const memoryStore = new session.MemoryStore();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://auth.utribe.app", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", "https://auth.utribe.app"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Session configuration
app.use(session({
  secret: 'keycloak-social-login-secret-key',
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax'
  }
}));

// CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan logging for advanced debugging
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      debug('HTTP Request: ' + message.trim());
    }
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve keycloak-js from node_modules
app.use('/js/keycloak.js', express.static(path.join(__dirname, 'node_modules/keycloak-js/dist/keycloak.js')));

// Keycloak configuration endpoint for client-side
app.get('/api/keycloak-config', (req, res) => {
  debug('Providing Keycloak configuration');
  res.json({
    url: 'https://auth.utribe.app',
    realm: 'utribe',
    clientId: 'giftportal',
    // Public client - no secret required
    isPublicClient: true
  });
});

// Routes
app.get('/', (req, res) => {
  debug('Accessing home page');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to exchange authorization code for tokens (server-side)
app.post('/api/token-exchange', async (req, res) => {
  debug('Processing token exchange server-side');
  
  try {
    const { code, codeVerifier, redirectUri } = req.body;
    
    if (!code || !codeVerifier || !redirectUri) {
      return res.status(400).json({ 
        error: 'missing_parameters',
        error_description: 'Missing required parameters: code, codeVerifier, redirectUri' 
      });
    }

    console.log('🔄 Attempting token exchange...');
    console.log('📍 Redirect URI:', redirectUri);
    console.log('🔑 Code length:', code.length);
    console.log('🔑 Client Secret loaded:', process.env.KEYCLOAK_CLIENT_SECRET ? 'YES' : 'NO');
    console.log('🔑 Client Secret length:', process.env.KEYCLOAK_CLIENT_SECRET ? process.env.KEYCLOAK_CLIENT_SECRET.length : 0);

    // For public client - no client secret needed
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'giftportal',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    console.log('🎯 Using public client (no secret required)...');

    const response = await fetch('https://auth.utribe.app/realms/utribe/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenData
    });

    const tokens = await response.json();

    if (!response.ok) {
      console.error('❌ Token exchange failed:', tokens);
      console.error('📊 Response status:', response.status);
      console.error('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      return res.status(response.status).json(tokens);
    }

    console.log('✅ Token exchange successful');

    // Return tokens to client
    res.json(tokens);
  } catch (error) {
    console.error('❌ Token exchange error:', error);
    res.status(500).json({ 
      error: 'server_error',
      error_description: error.message 
    });
  }
});

// API endpoint to verify token server-side (optional)
app.post('/api/verify-token', async (req, res) => {
  debug('Verifying token server-side');
  
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      error: 'Token required',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Verify token with Keycloak
    const response = await fetch('https://auth.utribe.app/realms/utribe/protocol/openid-connect/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Token verification failed');
    }
    
    const userInfo = await response.json();
    debug('Token verified successfully for user:', userInfo.preferred_username);
    
    res.json({
      valid: true,
      user: userInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    debug('Token verification failed:', error);
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  debug('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    keycloak: {
      url: 'https://auth.utribe.app',
      realm: 'utribe',
      clientId: 'giftportal'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  debug('Error occurred:', err);
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  debug('404 - Page not found:', req.url);
  res.status(404).json({
    error: 'Page not found',
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, 'localhost', () => {
  console.log(`🚀 Keycloak Social Login Server (keycloak-js) running on http://localhost:${PORT}`);
  console.log('📊 Debug mode enabled - set DEBUG=keycloak-app for detailed logs');
  console.log('🔐 Keycloak server: https://auth.utribe.app');
  console.log('📝 Available endpoints:');
  console.log('   - GET / (Home page with keycloak-js integration)');
  console.log('   - GET /api/keycloak-config (Keycloak configuration)');
  console.log('   - POST /api/verify-token (Server-side token verification)');
  console.log('   - GET /health (Health check)');
  
  debug('Server started successfully');
  debug('Using client-side keycloak-js for authentication');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  debug('SIGTERM received, shutting down gracefully');
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  debug('SIGINT received, shutting down gracefully');
  console.log('Shutting down gracefully...');
  process.exit(0);
});