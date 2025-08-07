import React, { ReactNode } from 'react';
import { AppBar, Box, Container, Toolbar, Typography, CssBaseline, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  HomeOutlined,
  HistoryOutlined,
  PeopleOutlineOutlined,
  InventoryOutlined,
  Menu,
  Logout,
  AssignmentOutlined,
  BusinessOutlined,
  GroupOutlined
} from '@mui/icons-material';
import logo from '../../assets/logo512.png';
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
    { path: '/home', label: 'Accueil', icon: <HomeOutlined /> },
    { path: '/history', label: 'Historique', icon: <HistoryOutlined /> },
    { path: '/clients', label: 'Clients', icon: <PeopleOutlineOutlined /> },
    { path: '/items', label: 'Gérer les articles', icon: <InventoryOutlined /> },
    { path: '/intervention', label: 'Intervention', icon: <AssignmentOutlined /> },
    { path: '/org-chart', label: 'Organigramme', icon: <BusinessOutlined /> },
    { path: '/employees', label: 'Employés', icon: <GroupOutlined /> }
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

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        className="dashboard-sidebar"
        classes={{
          paper: 'sidebar-paper'
        }}
        sx={{
          '& .MuiDrawer-paper': {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh'
          }
        }}
      >
        <Box className="sidebar-header">
          <img src={logo} alt="Chanitec Logo" className="sidebar-logo" />
        </Box>

        <Box className="sidebar-content">
          <List className="sidebar-menu">
            {navItems.map((item) => (
              <ListItem
                key={item.path}
                className={`sidebar-menu-item ${currentPath === item.path ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
              >
                <ListItemIcon className="menu-item-icon">
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  className="menu-item-text"
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box className="sidebar-footer">
          <Divider className="sidebar-divider" />
          <ListItem
            className="sidebar-menu-item logout-item"
            onClick={onLogout}
            sx={{ cursor: 'pointer' }}
          >
            <ListItemIcon className="menu-item-icon">
              <Logout />
            </ListItemIcon>
            <ListItemText
              primary="Déconnexion"
              className="menu-item-text"
            />
          </ListItem>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box className="dashboard-main">
        <Box className="dashboard-content">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;