import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Citizens from './pages/Citizens';
import Cases from './pages/Cases';
import Projects from './pages/Projects';
import MapView from './pages/MapView';
import Communications from './pages/Communications';
import Events from './pages/Events';
import Documents from './pages/Documents';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="citizens" element={<Citizens />} />
          <Route path="cases" element={<Cases />} />
          <Route path="projects" element={<Projects />} />
          <Route path="map" element={<MapView />} />
          <Route path="communications" element={<Communications />} />
          <Route path="events" element={<Events />} />
          <Route path="documents" element={<Documents />} />
        </Route>
      </Routes>
    </Router>
  );
}
