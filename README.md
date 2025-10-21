# Keycloak Social Login

A simple one-page Node.js application for Keycloak social login with advanced debugging capabilities. Runs on localhost:8000.

## Features

- 🚀 Simple one-page interface for social login
- 🔐 Keycloak integration with social providers
- 🐛 Advanced debugging and logging
- 📊 Real-time server health monitoring
- 🔒 Protected routes and session management
- 🎨 Modern, responsive UI design
- 📝 Comprehensive API endpoints

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Keycloak Server** running on `http://localhost:8080`

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

```bash
# Regular mode
npm start

# Development mode with basic debugging
npm run dev

# Development mode with full debugging
npm run debug
```

The application will be available at: **http://localhost:8000**

### 3. Configure Keycloak

1. Access Keycloak Admin Console: http://localhost:8080/auth/admin
2. Create a new client named `keycloak-social-login`
3. Configure the client settings:
   - Client Protocol: `openid-connect`
   - Access Type: `public`
   - Valid Redirect URIs: `http://localhost:8000/*`
   - Web Origins: `http://localhost:8000`

## Configuration

### Keycloak Configuration

Edit the `keycloak.json` file or modify the configuration in `server.js`:

```json
{
  "realm": "master",
  "auth-server-url": "http://localhost:8080/auth",
  "ssl-required": "external",
  "resource": "keycloak-social-login",
  "public-client": true,
  "confidential-port": 0
}
```

### Environment Variables

You can set these environment variables:

- `NODE_ENV`: Environment mode (development/production)
- `DEBUG`: Debug output level (e.g., `keycloak-app`)
- `PORT`: Server port (default: 8000)

## API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/` | GET | Home page | Public |
| `/login` | GET | Initiate login | Public |
| `/logout` | GET | User logout | Public |
| `/protected` | GET | Protected area | Required |
| `/api/userinfo` | GET | User information API | Required |
| `/health` | GET | Health check | Public |

## Advanced Debugging

### Debug Modes

1. **Basic Debug**: `npm run dev`
   - Shows Keycloak application logs
   - Session information
   - Authentication status

2. **Full Debug**: `npm run debug`
   - All basic debug info
   - Express framework logs
   - HTTP request details

### Browser Debug Panel

The web interface includes a built-in debug panel:
- Real-time server status
- Health monitoring
- Request logging
- Browser information

### Debug Output Examples

```bash
# Enable specific debug categories
DEBUG=keycloak-app node server.js
DEBUG=keycloak-app,express:* node server.js
DEBUG=* node server.js  # Enable all debug output
```

## Project Structure

```
keycloak_login1/
├── server.js              # Main application server
├── public/
│   └── index.html         # Single-page interface
├── package.json           # Project configuration
├── keycloak.json          # Keycloak client configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Development

### Running in Development Mode

```bash
# Start with auto-restart (requires nodemon)
npm install -g nodemon
nodemon server.js

# Or use the built-in debug mode
npm run dev
```

### Testing the Application

1. **Health Check**: Visit http://localhost:8000/health
2. **Login Flow**: Click "Login with Keycloak" on the home page
3. **Protected Access**: Try accessing http://localhost:8000/protected
4. **API Testing**: Use curl or Postman to test endpoints

### Troubleshooting

1. **Keycloak Connection Issues**:
   - Ensure Keycloak is running on http://localhost:8080
   - Check client configuration in Keycloak admin console
   - Verify redirect URIs are correct

2. **Authentication Problems**:
   - Clear browser cookies and session data
   - Check Keycloak client settings
   - Verify realm configuration

3. **Debug Information**:
   - Enable full debugging: `npm run debug`
   - Check browser console for client-side errors
   - Use the built-in debug panel

## Security Features

- Session management with secure cookies
- CORS protection
- Input validation and sanitization
- Secure logout handling
- Token expiration management

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use HTTPS (set `secure: true` for cookies)
3. Configure proper session store (Redis recommended)
4. Set up reverse proxy (nginx/Apache)
5. Configure proper CORS settings
6. Use environment variables for sensitive configuration

## License

ISC License - see package.json for details.