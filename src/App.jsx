import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Home from './components/Home';
import Navbar from './components/NavBar';
import NotFound from './components/NotFound';
import Packages from './components/Packages';
import Bookings from './components/Bookings';
import SetDiscounts from './components/SetDiscounts';
import AdminPackages from './components/AdminPackages';
import AdminBookings from './components/AdminBookings';
import { useKeycloak } from "@react-keycloak/web";
import Rankings from './components/Rankings';

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
          <Route path="" element={<Home/>} />
          <Route path="*" element={<NotFound/>} />
          <Route path="/packages"
          element={<PrivateRoute element={<Packages />} rolesAllowed={["USER","ADMIN"]} />} />
          <Route path="/bookings"
          element={<PrivateRoute element={<Bookings />} rolesAllowed={["USER","ADMIN"]} />} />
          <Route path="/setDiscounts"
          element={<PrivateRoute element={<SetDiscounts />} rolesAllowed={["ADMIN"]} />} />
          <Route path="/adminPackages"
          element={<PrivateRoute element={<AdminPackages />} rolesAllowed={["ADMIN"]} />} />
          <Route path="/adminBookings"
          element={<PrivateRoute element={<AdminBookings />} rolesAllowed={["ADMIN"]} />} />
          <Route path="/rankings"
          element={<PrivateRoute element={<Rankings />} rolesAllowed={["ADMIN"]} />} />
        </Routes>
      </div>

    </Router>
  )
}

export default App
