import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Tooltip,
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
  QuestionAnswer,
  AccountBalance,
  ManageAccounts,
  ListAlt,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  ChevronLeft,
  ChevronRight,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo512.png';
import './Layout.scss';

const navigationStack: string[] = [];

const pathKey = (pathname: string, search: string) => `${pathname}${search || ''}`;

const pushNavigationPath = (path: string) => {
  if (!path || path.startsWith('/login')) return;
  if (navigationStack[navigationStack.length - 1] === path) return;
  navigationStack.push(path);
  if (navigationStack.length > 40) navigationStack.shift();
};

const getPreviousPath = (current: string) => {
  if (navigationStack[navigationStack.length - 1] === current) {
    navigationStack.pop();
  }
  while (navigationStack.length > 0) {
    const previous = navigationStack[navigationStack.length - 1];
    if (previous && previous !== current && !previous.startsWith('/login')) {
      return previous;
    }
    navigationStack.pop();
  }
  return '/home';
};

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
  const { user, hasAccess } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const currentKey = pathKey(location.pathname, location.search);
  const isHomePage = location.pathname === '/home' || currentPath === '/home';

  useEffect(() => {
    pushNavigationPath(currentKey);
  }, [currentKey]);

  const handleBack = () => {
    const previous = getPreviousPath(currentKey);
    if (previous && previous !== currentKey) {
      navigate(previous);
      return;
    }
    if (location.pathname !== '/home') {
      navigate('/home');
    }
  };

  const getNavItems = () => {
    const allItems = [
      { path: '/home', label: 'Accueil', icon: <HomeOutlined />, page: 'home' as const },
      { path: '/quote', label: 'Nouveau Devis', icon: <AddIcon />, page: 'quote' as const },
      { path: '/history', label: 'Historique', icon: <HistoryOutlined />, page: 'history' as const },
      { path: '/clients', label: 'Clients', icon: <PeopleOutlineOutlined />, page: 'clients' as const },
      { path: '/items', label: 'Gérer les articles', icon: <InventoryOutlined />, page: 'items' as const },
      { path: '/intervention', label: 'Intervention', icon: <AssignmentOutlined />, page: 'intervention' as const },
      { path: '/planning', label: 'Planning', icon: <ScheduleIcon />, page: 'planning' as const },
      { path: '/org-chart', label: 'Organigramme', icon: <BusinessOutlined />, page: 'org-chart' as const },
      { path: '/users', label: 'Utilisateurs', icon: <ManageAccounts />, page: 'users' as const },
      { path: '/logs', label: 'Journal', icon: <ListAlt />, page: 'logs' as const },
      { path: '/financial', label: 'Financier', icon: <AccountBalance />, page: 'financial' as const },
      { path: '/help', label: 'Aide', icon: <QuestionAnswer />, page: 'help' as const }
    ];

    if (!user) return [];

    return allItems.filter(item => hasAccess(item.page));
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
          <Box className="sidebar-header-content">
            {!sidebarCollapsed && (
              <img src={logo} alt="Chanitec Logo" className="sidebar-logo" />
            )}
          </Box>
          <IconButton
            size="small"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="collapse-button"
            sx={{ color: '#1976d2' }}
          >
            {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
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
              sx={{ mr: 1 }}
            >
              <Menu />
            </IconButton>
            {!isHomePage && (
              <Tooltip title="Retour à la page précédente">
                <IconButton
                  color="inherit"
                  aria-label="Retour"
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
            )}
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
        className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
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
          {!isHomePage && (
            <Box className="layout-back-bar">
              <Tooltip title="Retour à la page précédente">
                <Button
                  className="layout-back-button"
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowBack />}
                  onClick={handleBack}
                >
                  Retour
                </Button>
              </Tooltip>
            </Box>
          )}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;