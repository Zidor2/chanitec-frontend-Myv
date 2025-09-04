import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QuoteProvider } from './contexts/QuoteContext';
import QuotePage from './pages/QuotePage/QuotePage';
import HistoryPage from './pages/HistoryPage/HistoryPage';
import ClientsPage from './pages/ClientsPage/ClientsPage';
import ItemsPage from './pages/ItemsPage/ItemsPage';
import PriceOfferPage from './pages/PriceOfferPage/PriceOfferPage';
import LoginPage from './pages/LoginPage/LoginPage';
import HomePage from './pages/HomePage/HomePage';
import QuoteTest from './pages/QuoteTest/QuoteTest';
import InterventionPage from './pages/interventionPage';
import { storageService } from './services/storage-service';
import OrgChartPage from './pages/orgChartPage';
import EmployeesPage from './pages/employeesPage';
import HelpPage from './pages/HelpPage/HelpPage';
import FinancialPage from './pages/FinancialPage/FinancialPage';

import './App.scss';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#2196f3',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&[type="number"]': {
            '-moz-appearance': 'textfield',
            padding: '8px 12px',
            paddingRight: '20px',
          },
          '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
            height: '100%',
            width: '20px',
            opacity: 1,
            margin: 0,
            padding: 0,
            cursor: 'pointer',
            position: 'absolute',
            right: 0,
            background: 'transparent',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.05)',
            },
            '&:active': {
              background: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Create a wrapper component that uses useNavigate
const AppContent = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  const [priceOfferQuoteId, setPriceOfferQuoteId] = useState<string | undefined>();

  // --- Warm-up logic start ---
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  useEffect(() => {
    const hasWarmedUp = localStorage.getItem('hasWarmedUp') === 'true';
    if (!hasWarmedUp) {
      setIsWarmingUp(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        setIsWarmingUp(false);
        localStorage.setItem('hasWarmedUp', 'true');
      }, 3000); // 3 seconds instead of 30
      fetch('/api/health', { signal: controller.signal })
        .then(() => {
          clearTimeout(timeout);
          setIsWarmingUp(false);
          localStorage.setItem('hasWarmedUp', 'true');
        })
        .catch(() => {
          // Proceed even if error
          setIsWarmingUp(false);
          localStorage.setItem('hasWarmedUp', 'true');
        });
      return () => clearTimeout(timeout);
    }
  }, []);
  // --- Warm-up logic end ---

  // Initialize app data
  useEffect(() => {
    const isInitialized = localStorage.getItem('app_initialized') === 'true';
    const justInitialized = localStorage.getItem('app_just_initialized') !== 'true';

    if (isInitialized && justInitialized) {
      setNotification({
        open: true,
        message: 'Données d\'exemple chargées avec succès',
        severity: 'success'
      });
      localStorage.setItem('app_just_initialized', 'true');
    }
  }, []);

  // Handle login
  const handleLogin = (username: string, password: string) => {
    if (username && password) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      setNotification({
        open: true,
        message: 'Veuillez remplir tous les champs',
        severity: 'error'
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  // Handle navigation
  const handleNavigate = (path: string, quoteId?: string) => {
    if (quoteId) {
      const queryParams = new URLSearchParams(window.location.search);
      const fromHistory = queryParams.get('fromHistory');
      const confirmed = queryParams.get('confirmed');

      let newPath = `${path}?id=${quoteId}`;
      if (fromHistory) newPath += `&fromHistory=${fromHistory}`;
      if (confirmed) newPath += `&confirmed=${confirmed}`;

      setPriceOfferQuoteId(quoteId);
      setCurrentPath(newPath);
      navigate(newPath);
    } else {
      setCurrentPath(path);
      navigate(path);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Warm-up overlay */}
      {isWarmingUp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.95)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}>
          <div className="spinner" style={{ marginBottom: 20 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" stroke="#1976d2" strokeWidth="4" strokeDasharray="100" strokeDashoffset="60"/>
            </svg>
          </div>
          Initialisation du serveur... Veuillez patienter
        </div>
      )}
      {/* App content */}
      {!isWarmingUp && (
        <>


          <QuoteProvider>
            <div>
              <Routes>
                <Route
              path="/login"
              element={
                isAuthenticated ?
                <Navigate to="/home" replace /> :
                <LoginPage onLogin={handleLogin} />
              }
            />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage currentPath="/home" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quote"
              element={
                <ProtectedRoute>
                  <QuotePage currentPath="/quote" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quote-test"
              element={
                <ProtectedRoute>
                  <QuoteTest currentPath="/quote-test" onNavigate={handleNavigate} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage currentPath="/history" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientsPage currentPath="/clients" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/items"
              element={
                <ProtectedRoute>
                  <ItemsPage currentPath="/items" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/price-offer"
              element={
                <ProtectedRoute>
                  <PriceOfferPage
                    currentPath="/price-offer"
                    onNavigate={handleNavigate}
                    quoteId={priceOfferQuoteId}
                    onLogout={handleLogout}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/intervention"
              element={
                <ProtectedRoute>
                  <InterventionPage currentPath="/intervention" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/org-chart"
              element={
                <ProtectedRoute>
                  <OrgChartPage currentPath="/org-chart" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

                        <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeesPage currentPath="/employees" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <HelpPage currentPath="/help" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/financial"
              element={
                <ProtectedRoute>
                  <FinancialPage currentPath="/financial" onNavigate={handleNavigate} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/home" replace />} />
              </Routes>
            </div>
          </QuoteProvider>
        </>
      )}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

// Main App component
function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;