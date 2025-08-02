import React, { ReactNode, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  CssBaseline,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import {
  HomeOutlined,
  HistoryOutlined,
  PeopleOutlineOutlined,
  InventoryOutlined,
  Menu,
  Logout,
  ChevronLeft
} from '@mui/icons-material';
import logo512 from '../../assets/logo512.png';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const sidebarWidth = 240;

  return (
    <Box className="layout-root">
      <CssBaseline />

      {/* Mobile menu button */}
      <Box className="mobile-menu-button">
        <IconButton
          color="primary"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ display: { sm: 'none' } }}
        >
          <Menu />
        </IconButton>
      </Box>

      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={toggleSidebar}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarWidth,
            backgroundColor: '#1976d2',
            color: 'white'
          },
        }}
      >
        <Box className="sidebar-content">
          <Box className="sidebar-header">
            <Box className="logo-container" onClick={() => handleNavigate('/home')}>
              <img src={logo512} alt="Chanitec Logo" className="sidebar-logo" />
            </Box>
            <IconButton onClick={toggleSidebar} sx={{ color: 'white' }}>
              <ChevronLeft />
            </IconButton>
          </Box>
          <Typography variant="subtitle2" className="sidebar-subtitle">
            Calcul de Prix
          </Typography>
          <List className="sidebar-nav">
            {navItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  className={`sidebar-nav-item ${currentPath === item.path ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {onLogout && (
            <>
              <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '1rem 0' }} />
              <List>
                <ListItem disablePadding>
                  <ListItemButton
                    className="sidebar-nav-item logout-item"
                    onClick={onLogout}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText primary="Déconnexion" />
                  </ListItemButton>
                </ListItem>
              </List>
            </>
          )}
        </Box>
      </Drawer>

      {/* Permanent sidebar for desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarWidth,
            backgroundColor: '#1976d2',
            color: 'white'
          },
        }}
        open
      >
        <Box className="sidebar-content">
          <Box className="sidebar-header">
            <Box className="logo-container" onClick={() => handleNavigate('/home')}>
              <img src={logo512} alt="Chanitec Logo" className="sidebar-logo" />
            </Box>
          </Box>
          <Typography variant="subtitle2" className="sidebar-subtitle">
            Calcul de Prix
          </Typography>
          <List className="sidebar-nav">
            {navItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  className={`sidebar-nav-item ${currentPath === item.path ? 'active' : ''}`}
                  onClick={() => handleNavigate(item.path)}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {onLogout && (
            <>
              <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '1rem 0' }} />
              <List>
                <ListItem disablePadding>
                  <ListItemButton
                    className="sidebar-nav-item logout-item"
                    onClick={onLogout}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText primary="Déconnexion" />
                  </ListItemButton>
                </ListItem>
              </List>
            </>
          )}
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        className="main-content"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          ml: { sm: `${sidebarWidth}px` },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box className="content-container">
          {children}
        </Box>
      </Box>

      <Box component="footer" className="footer">
        <Box className="footer-content">
          <Typography variant="body2" color="textSecondary" align="center" className="footer-text">
            © {new Date().getFullYear()} Chanitec
          </Typography>
          <Typography variant="caption" color="textSecondary" align="center" className="footer-version">
            Version 1.65
          </Typography>
          <Box className="footer-watermark">
            <Typography variant="h6" className="watermark-text">
              CHANITEC
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;