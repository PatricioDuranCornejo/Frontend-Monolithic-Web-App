import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Home from './components/Home';
import Navbar from './components/NavBar';
import NotFound from './components/NotFound';
import Packages from './components/Packages';
import { useKeycloak } from "@react-keycloak/web";

function App() {

  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return <div>Cargando...</div>;

  const isLoggedIn = keycloak.authenticated;
  const roles = keycloak.tokenParsed?.realm_access?.roles || [];

  const PrivateRoute = ({ element, rolesAllowed }) => {
    if (!isLoggedIn) {
      keycloak.login();
      return null;
    }
    if (rolesAllowed && !rolesAllowed.some(r => roles.includes(r))) {
      return <h2>No tienes permiso para ver esta página</h2>;
    }
    return element;
  };

  if (!isLoggedIn) { 
    keycloak.login(); 
    return null; 
  }

  if (!isLoggedIn) { 
    console.log(keycloak.token);
    return null; 
  }

  return (
    <Router>
      <div className="container">
        <Navbar/>
        <Routes>
          <Route path="/home" element={<Home/>} />
          <Route path="*" element={<NotFound/>} />
          <Route path="/packages"
          element={<PrivateRoute element={<Packages />} rolesAllowed={["USER","ADMIN"]} />}
          />
        </Routes>
      </div>

    </Router>
  )
}

export default App
