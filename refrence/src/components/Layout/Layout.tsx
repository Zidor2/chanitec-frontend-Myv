import React, { ReactNode } from 'react';
import { AppBar, Box, Container, Toolbar, Typography, CssBaseline, Button } from '@mui/material';
import {
  HomeOutlined,
  HistoryOutlined,
  PeopleOutlineOutlined,
  InventoryOutlined,
  Menu,
  Logout
} from '@mui/icons-material';

import './Layout.scss';

interface LayoutProps {
  children: ReactNode;
  currentPath: string;
  onNavigate?: (path: string) => void;
  onHomeClick?: () => void;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPath = '/',
  onNavigate,
  onHomeClick,
  onLogout
}) => {
  // Navigation items
  const navItems = [
    { path: '/quote', label: 'Accueil', icon: <HomeOutlined /> },
    { path: '/history', label: 'Historique', icon: <HistoryOutlined /> },
    { path: '/clients', label: 'Clients', icon: <PeopleOutlineOutlined /> },
    { path: '/items', label: 'Gérer les articles', icon: <InventoryOutlined /> }
  ];

  const handleNavigate = (path: string) => {
    if (path === '/' && onHomeClick) {
      onHomeClick();
    }
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <Box className="layout-root">
      <CssBaseline />
      <AppBar position="static" color="primary" className="app-bar">
        <Toolbar>
          <Box className="toolbar-content">
            <Button
              color="inherit"
              className="main-menu-button"
              startIcon={<Menu />}
              onClick={() => handleNavigate('/home')}
            >
              Menu Principal
            </Button>
            <Box className="nav-links">
              {(navItems ?? []).map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  className={`nav-button ${currentPath === item.path ? 'active' : ''}`}
                  startIcon={item.icon}
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
            {onLogout && (
              <Button
                color="inherit"
                className="logout-button"
                startIcon={<Logout />}
                onClick={onLogout}
              >
                Déconnexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container component="main" className="main-content">
        {children}
      </Container>

      <Box component="footer" className="footer">
        <Typography variant="body2" color="textSecondary" align="center">
          © {new Date().getFullYear()} Chanitec
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;