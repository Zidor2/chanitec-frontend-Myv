import React, { ReactNode, useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  HomeOutlined,
  HistoryOutlined,
  PeopleOutlineOutlined,
  InventoryOutlined,
  Menu,
  Logout,
  AssignmentOutlined,
  BusinessOutlined,
  GroupOutlined,
  HelpOutline,
  QuestionAnswer
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Navigation items
  const navItems = [
    { path: '/home', label: 'Accueil', icon: <HomeOutlined /> },
    { path: '/history', label: 'Historique', icon: <HistoryOutlined /> },
    { path: '/clients', label: 'Clients', icon: <PeopleOutlineOutlined /> },
    { path: '/items', label: 'Gérer les articles', icon: <InventoryOutlined /> },
    { path: '/intervention', label: 'Intervention', icon: <AssignmentOutlined /> },
    { path: '/org-chart', label: 'Organigramme', icon: <BusinessOutlined /> },
    { path: '/employees', label: 'Employés', icon: <GroupOutlined /> },
    { path: '/help', label: 'Aide', icon: <QuestionAnswer /> }
  ];

  // Debug: Log navigation items
  console.log('Navigation items:', navItems);

  const handleNavigate = (path: string) => {
    if (path === '/' && onHomeClick) {
      onHomeClick();
    }
    if (onNavigate) {
      onNavigate(path);
    }
    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <>
      {/* Sidebar Header - Only show logo on desktop */}
      {!isMobile && (
        <Box className="sidebar-header">
          <img src={logo} alt="Chanitec Logo" className="sidebar-logo" />
        </Box>
      )}

      <Box className="sidebar-content">
        <List className="sidebar-menu">
          {navItems.map((item) => {
            console.log('Rendering nav item:', item);
            return (
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
            );
          })}
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
    </>
  );

  return (
    <Box className="layout-root">
      <CssBaseline />

      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          className="mobile-app-bar"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            display: { xs: 'flex', md: 'none' }
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Chanitec
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh'
          },
        }}
        className="mobile-sidebar"
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        className="dashboard-sidebar"
        classes={{
          paper: 'sidebar-paper'
        }}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box className={`dashboard-main ${isMobile ? 'mobile-main' : ''}`}>
        {isMobile && <Box className="mobile-toolbar-spacer" />}
        <Box className="dashboard-content">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;