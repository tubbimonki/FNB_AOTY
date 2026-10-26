import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Benefits from './pages/Benefits';
import More from './pages/More';
import NotFound from './pages/NotFound';
import TrackerPage from './features/green-wallet/TrackerPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ReadingPage from './features/dashboard/ReadingPage';
import AlertsPage from './features/alerts/AlertsPage';
import MapPage from './features/community/MapPage';
import CommunityPage from './features/community/CommunityPage';
import ReportPage from './features/community/ReportPage';
import ServicesPage from './features/services/ServicesPage';
import EcoPage from './features/eco/EcoPage';
import FootprintPage from './features/eco/FootprintPage';
import WaterPage from './features/water/WaterPage';
import RecyclingPage from './features/recycling/RecyclingPage';
import ImpactPage from './features/impact/ImpactPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import RequireAuth from './features/auth/RequireAuth';

// Every route renders inside <Layout>, which adds the header, footer and tabs.
// To make a page members-only, wrap its element in <RequireAuth>.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate replace to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/benefits" element={<Benefits />} />
        {/* News and guides live on the dashboard. Old links still work. */}
        <Route path="/news" element={<Navigate replace to="/dashboard/news" />} />
        <Route path="/guides" element={<Navigate replace to="/dashboard/guides" />} />

        {/* Nested: one RequireAuth guards the overview and both reading pages. */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Outlet />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="news" element={<ReadingPage view="news" />} />
          <Route path="guides" element={<ReadingPage view="guides" />} />
        </Route>

        {/* Public tools: they work without an account. */}
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/eco" element={<EcoPage />} />
        <Route path="/eco/footprint" element={<FootprintPage />} />
        <Route path="/eco/water" element={<WaterPage />} />
        <Route path="/eco/recycling" element={<RecyclingPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/more" element={<More />} />

        {/* Need an account: the API stores reports per user. */}
        <Route path="/community/report" element={<RequireAuth><ReportPage /></RequireAuth>} />
        <Route path="/impact" element={<RequireAuth><ImpactPage /></RequireAuth>} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
