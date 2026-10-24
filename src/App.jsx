import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import News from './pages/News';
import Features from './pages/Features';
import Guides from './pages/Guides';
import Benefits from './pages/Benefits';
import NotFound from './pages/NotFound';
import TrackerPage from './features/green-wallet/TrackerPage';
import DashboardPage from './features/dashboard/DashboardPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import RequireAuth from './features/auth/RequireAuth';

// Every route renders inside <Layout>, which adds the header and footer.
// To make a page members-only, wrap its element in <RequireAuth>.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate replace to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/features" element={<Features />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
