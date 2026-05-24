import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./services/keycloak";

const eventLogger = (event, error) => {
  console.log('Keycloak Event:', event);
  if (error) {
    console.error('Keycloak Error:', error);
  }
};

const keycloakInitOptions = {
  onLoad: 'login-required',
  checkLoginIframe: false,
  pkceMethod: 'S256',
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <ReactKeycloakProvider 
    authClient={keycloak}
    initOptions={keycloakInitOptions}
    onEvent={eventLogger}
    LoadingComponent={
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <h2>Cargando...</h2>
      </div>
    }
  >
    <App />
  </ReactKeycloakProvider>
)