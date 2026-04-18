import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Home from './components/Home';
import Navbar from './components/NavBar';
import NotFound from './components/NotFound';
import Packages from './components/Packages';

function App() {
  return (
    <Router>
      <div className="container">
        <Navbar/>
        <Routes>
          <Route path="/home" element={<Home/>} />
          <Route path="*" element={<NotFound/>} />
          <Route path="/packages" element={<Packages/>} />
        </Routes>
      </div>

    </Router>
  )
}

export default App
