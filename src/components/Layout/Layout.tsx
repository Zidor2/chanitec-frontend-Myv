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
  QuestionAnswer,
  AccountBalance,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user, isAdmin, isEditor, isUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Navigation items based on user role
  const getNavItems = () => {
    const allItems = [
      { path: '/home', label: 'Accueil', icon: <HomeOutlined />, roles: ['admin', 'editor', 'viewer', 'user'] },
      { path: '/quote', label: 'Nouveau Devis', icon: <AddIcon />, roles: ['admin', 'editor', 'user'] },
      { path: '/history', label: 'Historique', icon: <HistoryOutlined />, roles: ['admin', 'editor', 'viewer', 'user'] },
      { path: '/clients', label: 'Clients', icon: <PeopleOutlineOutlined />, roles: ['admin', 'editor'] },
      { path: '/items', label: 'Gérer les articles', icon: <InventoryOutlined />, roles: ['admin', 'editor'] },
      { path: '/intervention', label: 'Intervention', icon: <AssignmentOutlined />, roles: ['admin', 'editor'] },
      { path: '/org-chart', label: 'Organigramme', icon: <BusinessOutlined />, roles: ['admin', 'editor'] },
      { path: '/employees', label: 'Employés', icon: <GroupOutlined />, roles: ['admin', 'editor'] },
      { path: '/financial', label: 'Financier', icon: <AccountBalance />, roles: ['admin'] },
      { path: '/help', label: 'Aide', icon: <QuestionAnswer />, roles: ['admin', 'editor', 'viewer', 'user'] }
    ];

    if (!user) return [];

    return allItems.filter(item => item.roles.includes(user.role));
  };

  const navItems = getNavItems();

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