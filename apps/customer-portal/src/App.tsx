import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CustomersPage from './pages/CustomersPage';
import Navigation from './components/Navigation';

function App() {
  return (
    <BrowserRouter basename="/portal">
      <div className="min-h-screen bg-white">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/customers" element={<CustomersPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
