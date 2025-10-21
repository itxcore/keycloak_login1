const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const morgan = require('morgan');
const debug = require('debug')('keycloak-app');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = 8000;

// Advanced debugging configuration
debug('Starting Keycloak Social Login Application');

// Memory store for session (use Redis or similar in production)
const memoryStore = new session.MemoryStore();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
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

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

// Session configuration
app.use(session({
  secret: 'keycloak-social-login-secret-key',
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax' // CSRF protection
  }
}));

// CORS configuration
app.use(cors());

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

// Keycloak configuration
const keycloakConfig = {
  realm: 'master', // Default realm, can be configured
  'auth-server-url': 'http://localhost:8080/auth', // Default Keycloak URL
  'ssl-required': 'external',
  resource: 'keycloak-social-login', // Client ID
  'public-client': true,
  'confidential-port': 0
};

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

// Keycloak middleware
app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

// Debug middleware to log session information
app.use((req, res, next) => {
  debug('Session ID:', req.sessionID);
  debug('User authenticated:', req.kauth && req.kauth.grant ? 'Yes' : 'No');
  if (req.kauth && req.kauth.grant) {
    debug('User info:', JSON.stringify(req.kauth.grant.access_token.content, null, 2));
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  debug('Accessing home page');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Protected route - requires authentication
app.get('/protected', keycloak.protect(), (req, res) => {
  debug('Accessing protected route');
  const userInfo = req.kauth.grant.access_token.content;
  res.json({
    message: 'Welcome to the protected area!',
    user: {
      username: userInfo.preferred_username,
      email: userInfo.email,
      name: userInfo.name,
      roles: userInfo.realm_access ? userInfo.realm_access.roles : []
    },
    sessionId: req.sessionID,
    timestamp: new Date().toISOString()
  });
});

// Login route
app.get('/login', authLimiter, keycloak.protect(), (req, res) => {
  debug('Login successful, redirecting to protected area');
  res.redirect('/protected');
});

// Logout route
app.get('/logout', (req, res) => {
  debug('User logging out');
  req.session.destroy((err) => {
    if (err) {
      debug('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

// User info API endpoint
app.get('/api/userinfo', keycloak.protect(), (req, res) => {
  debug('Fetching user info via API');
  const userInfo = req.kauth.grant.access_token.content;
  res.json({
    authenticated: true,
    user: {
      id: userInfo.sub,
      username: userInfo.preferred_username,
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      name: userInfo.name,
      roles: userInfo.realm_access ? userInfo.realm_access.roles : [],
      groups: userInfo.groups || []
    },
    token: {
      issued: new Date(userInfo.iat * 1000).toISOString(),
      expires: new Date(userInfo.exp * 1000).toISOString()
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  debug('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
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
  console.log(`🚀 Keycloak Social Login Server running on http://localhost:${PORT}`);
  console.log('📊 Debug mode enabled - set DEBUG=keycloak-app for detailed logs');
  console.log('🔐 Make sure Keycloak is running on http://localhost:8080');
  console.log('📝 Available endpoints:');
  console.log('   - GET / (Home page)');
  console.log('   - GET /login (Initiate login)');
  console.log('   - GET /logout (Logout)');
  console.log('   - GET /protected (Protected area)');
  console.log('   - GET /api/userinfo (User info API)');
  console.log('   - GET /health (Health check)');
  
  debug('Server started successfully');
  debug('Keycloak configuration:', JSON.stringify(keycloakConfig, null, 2));
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