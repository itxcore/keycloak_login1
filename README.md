# Keycloak Vue 3 Social Login# Keycloak Social Login



A modern Vue 3 application with serverless Keycloak social login integration. No backend server required - communicates directly with Keycloak for authentication.A simple one-page Node.js application for Keycloak social login with advanced debugging capabilities. Runs on localhost:8000.



## Features## Features



- 🚀 Vue 3 with Composition API- 🚀 Simple one-page interface for social login

- 🔐 Direct Keycloak integration (serverless)- 🔐 Keycloak integration with social providers

- 🏪 Pinia state management- 🐛 Advanced debugging and logging

- 🛣️ Vue Router with authentication guards- 📊 Real-time server health monitoring

- 📱 Responsive design- 🔒 Protected routes and session management

- 🔒 CSP-safe authentication (no iframes)- 🎨 Modern, responsive UI design

- 🎨 Modern UI components- 📝 Comprehensive API endpoints

- ⚡ Vite for fast development

## Prerequisites

## Prerequisites

1. **Node.js** (v14 or higher)

1. **Node.js** (v16 or higher)2. **Keycloak Server** running on `http://localhost:8080`

2. **Keycloak Server** accessible at `https://auth.utribe.app`

## Quick Start

## Quick Start

### 1. Install Dependencies

### 1. Install Dependencies

```bash

```bashnpm install

npm install```

```

### 2. Start the Application

### 2. Start Development Server

```bash

```bash# Regular mode

npm run devnpm start

```

# Development mode with basic debugging

The application will be available at: **http://localhost:5173**npm run dev



### 3. Build for Production# Development mode with full debugging

npm run debug

```bash```

npm run build

```The application will be available at: **http://localhost:8000**



Static files will be generated in the `dist/` directory.### 3. Configure Keycloak



## Keycloak Configuration1. Access Keycloak Admin Console: http://localhost:8080/auth/admin

2. Create a new client named `keycloak-social-login`

The application requires the following Keycloak client configuration:3. Configure the client settings:

   - Client Protocol: `openid-connect`

### Client Settings   - Access Type: `public`

- **Client ID**: `giftportal`   - Valid Redirect URIs: `http://localhost:8000/*`

- **Client Protocol**: `openid-connect`   - Web Origins: `http://localhost:8000`

- **Access Type**: `public`

- **Valid Redirect URIs**: ## Configuration

  - `http://localhost:5173/*` (development)

  - `https://yourdomain.com/*` (production)### Keycloak Configuration

- **Web Origins**: 

  - `http://localhost:5173` (development)Edit the `keycloak.json` file or modify the configuration in `server.js`:

  - `https://yourdomain.com` (production)

- **CORS Enabled**: `true````json

{

### Required Settings for Direct Client Communication  "realm": "master",

- Enable CORS in Keycloak admin console  "auth-server-url": "http://localhost:8080/auth",

- Add your domain to "Web Origins"   "ssl-required": "external",

- Configure proper redirect URIs  "resource": "keycloak-social-login",

  "public-client": true,

## Project Structure  "confidential-port": 0

}

``````

keycloak_login1/

├── src/### Environment Variables

│   ├── components/          # Vue components

│   │   └── AuthButton.vue   # Login/logout buttonYou can set these environment variables:

│   ├── composables/         # Vue composables

│   │   └── useAuth.js       # Authentication composable- `NODE_ENV`: Environment mode (development/production)

│   ├── services/            # Services- `DEBUG`: Debug output level (e.g., `keycloak-app`)

│   │   └── csp-safe-keycloak.js  # Keycloak integration- `PORT`: Server port (default: 8000)

│   ├── stores/              # Pinia stores

│   │   └── authStore.js     # Authentication state## API Endpoints

│   ├── views/               # Page components

│   │   ├── Home.vue| Endpoint | Method | Description | Authentication |

│   │   ├── Login.vue|----------|--------|-------------|----------------|

│   │   ├── Dashboard.vue| `/` | GET | Home page | Public |

│   │   ├── Profile.vue| `/login` | GET | Initiate login | Public |

│   │   ├── AuthCallback.vue| `/logout` | GET | User logout | Public |

│   │   └── NotFound.vue| `/protected` | GET | Protected area | Required |

│   ├── App.vue              # Root component| `/api/userinfo` | GET | User information API | Required |

│   └── main.js              # Application entry point| `/health` | GET | Health check | Public |

├── index.html               # HTML template

├── vite.config.js           # Vite configuration## Advanced Debugging

└── package.json             # Dependencies

```### Debug Modes



## Authentication Flow1. **Basic Debug**: `npm run dev`

   - Shows Keycloak application logs

1. **User clicks login** → Redirects to Keycloak   - Session information

2. **Keycloak authentication** → User logs in with Google/credentials   - Authentication status

3. **OAuth callback** → Returns with authorization code

4. **Token exchange** → Direct call to Keycloak token endpoint2. **Full Debug**: `npm run debug`

5. **Store tokens** → Save in localStorage and Pinia store   - All basic debug info

6. **Authenticated state** → Access protected routes   - Express framework logs

   - HTTP request details

## API Integration

### Browser Debug Panel

The application communicates directly with Keycloak endpoints:

The web interface includes a built-in debug panel:

- **Token Exchange**: `https://auth.utribe.app/realms/utribe/protocol/openid-connect/token`- Real-time server status

- **User Info**: `https://auth.utribe.app/realms/utribe/protocol/openid-connect/userinfo`- Health monitoring

- **Logout**: `https://auth.utribe.app/realms/utribe/protocol/openid-connect/logout`- Request logging

- Browser information

## Development

### Debug Output Examples

### Running in Development Mode

```bash

```bash# Enable specific debug categories

npm run devDEBUG=keycloak-app node server.js

```DEBUG=keycloak-app,express:* node server.js

DEBUG=* node server.js  # Enable all debug output

### Building for Production```



```bash## Project Structure

npm run build

``````

keycloak_login1/

### Testing the Build├── server.js              # Main application server

├── public/

```bash│   └── index.html         # Single-page interface

npm run preview├── package.json           # Project configuration

```├── keycloak.json          # Keycloak client configuration

├── .gitignore            # Git ignore rules

## Deployment└── README.md             # This file

```

Since this is a client-side only application, you can deploy the built files to any static hosting service:

## Development

1. **Build the application**: `npm run build`

2. **Deploy the `dist/` folder** to:### Running in Development Mode

   - Netlify

   - Vercel```bash

   - AWS S3 + CloudFront# Start with auto-restart (requires nodemon)

   - GitHub Pagesnpm install -g nodemon

   - Any static hosting servicenodemon server.js



### Important for Production:# Or use the built-in debug mode

- Update Keycloak client redirect URIs to your production domainnpm run dev

- Configure CORS settings in Keycloak for your production domain```

- Ensure HTTPS is enabled for production deployments

### Testing the Application

## Security Features

1. **Health Check**: Visit http://localhost:8000/health

- PKCE (Proof Key for Code Exchange) flow2. **Login Flow**: Click "Login with Keycloak" on the home page

- CSP-safe authentication (no iframes)3. **Protected Access**: Try accessing http://localhost:8000/protected

- Secure token storage4. **API Testing**: Use curl or Postman to test endpoints

- Automatic token refresh

- Route guards for protected areas### Troubleshooting

- Direct Keycloak communication (no server-side secrets)

1. **Keycloak Connection Issues**:

## Troubleshooting   - Ensure Keycloak is running on http://localhost:8080

   - Check client configuration in Keycloak admin console

1. **CORS Issues**: Ensure your domain is added to Keycloak client's "Web Origins"   - Verify redirect URIs are correct

2. **Redirect Issues**: Check that redirect URIs are configured correctly in Keycloak

3. **Token Issues**: Verify client ID and realm configuration2. **Authentication Problems**:

4. **Build Issues**: Ensure Node.js version is 16 or higher   - Clear browser cookies and session data

   - Check Keycloak client settings

## License   - Verify realm configuration



ISC License - see package.json for details.3. **Debug Information**:
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