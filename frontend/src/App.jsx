import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import './i18n';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import JoinCommunity from './pages/JoinCommunity';

// Protected pages
import Dashboard from './pages/Dashboard';
import ProfileCreation from './pages/ProfileCreation';
import MatchDetail from './pages/MatchDetail';
import Quiz from './pages/Quiz';
import SavedMatches from './pages/SavedMatches';
import Settings from './pages/Settings';

/** Requires authentication — redirects to /login if not authenticated */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/** Redirect to dashboard if already authenticated */
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* ── Public Routes ─────────────────────────────────── */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/join/:code" element={
            <ProtectedRoute>
              <JoinCommunity />
            </ProtectedRoute>
          } />
          <Route path="/join" element={
            <ProtectedRoute>
              <JoinCommunity />
            </ProtectedRoute>
          } />

          {/* ── Parent Portal ─────────────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile-setup" element={
            <ProtectedRoute>
              <ProfileCreation />
            </ProtectedRoute>
          } />

          <Route path="/profile/edit" element={
            <ProtectedRoute>
              <ProfileCreation />
            </ProtectedRoute>
          } />

          <Route path="/match/:id" element={
            <ProtectedRoute>
              <MatchDetail />
            </ProtectedRoute>
          } />

          <Route path="/saved" element={
            <ProtectedRoute>
              <SavedMatches />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* ── Candidate Portal ──────────────────────────────── */}
          <Route path="/quiz" element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          } />

          {/* ── Fallback ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
