import React, { useState } from 'react';
import {
  Box,
  Container,
  Button,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Logout as LogoutIcon,
  Calculate as CalculateIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import logo512 from '../../assets/logo512.png';
import './HomePage.scss';

// Import actual page components
import HistoryPage from '../HistoryPage/HistoryPage';
import InterventionPage from '../interventionPage';
import EmployeesPage from '../employeesPage';
import OrgChartPage from '../orgChartPage';
import ClientsPage from '../ClientsPage/ClientsPage';
import ItemsPage from '../ItemsPage/ItemsPage';
import QuotePage from '../QuotePage/QuotePage';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPage, setSelectedPage] = useState('home');

  const handleNavigate = (path: string) => {
    // Map routes to dashboard pages
    switch (path) {
      case '/home':
      case '/':
        setSelectedPage('home');
        break;
      case '/quote':
        setSelectedPage('quote');
        break;
      case '/history':
        setSelectedPage('history');
        break;
      case '/clients':
        setSelectedPage('clients');
        break;
      case '/items':
        setSelectedPage('items');
        break;
      case '/intervention':
        setSelectedPage('intervention');
        break;
      case '/employees':
        setSelectedPage('employees');
        break;
      default:
        // For external routes, use actual navigation
        navigate(path);
        break;
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };



  const handleMenuClick = (pageKey: string) => {
    setSelectedPage(pageKey);
  };

  const menuItems = [
    { text: 'Accueil', icon: <HomeIcon />, key: 'home' },
    { text: 'Calcul de prix', icon: <CalculateIcon />, key: 'history' },
    { text: "Page d'intervention", icon: <AssignmentIcon />, key: 'intervention' },
    { text: 'Employee', icon: <PeopleIcon />, key: 'employees' },
    { text: 'Clients', icon: <BusinessIcon />, key: 'clients' },
    { text: 'Gérer les articles', icon: <InventoryIcon />, key: 'items' }
  ];

  const renderPageContent = () => {
    switch (selectedPage) {
      case 'home':
        return (
          <Box className="welcome-section">
            <img
              src={logo512}
              alt="Chanitec Logo"
              className="welcome-logo"
            />
            <Typography variant="h3" className="welcome-title">
              Bienvenue sur Chanitec
            </Typography>
            <Typography variant="h6" className="welcome-subtitle">
              Votre plateforme de gestion et de calcul de prix
            </Typography>
          </Box>
        );
      case 'history':
        return (
          <Box className="page-wrapper">
            <HistoryPage currentPath="/history" onNavigate={handleNavigate} />
          </Box>
        );
      case 'quote':
        return (
          <Box className="page-wrapper">
            <QuotePage currentPath="/quote" onNavigate={handleNavigate} />
          </Box>
        );
      case 'intervention':
        return (
          <Box className="page-wrapper">
            <InterventionPage />
          </Box>
        );
      case 'employees':
        return (
          <Box className="page-wrapper">
            <OrgChartPage />
          </Box>
        );
      case 'clients':
        return (
          <Box className="page-wrapper">
            <ClientsPage currentPath="/clients" onNavigate={handleNavigate} />
          </Box>
        );
      case 'items':
        return (
          <Box className="page-wrapper">
            <ItemsPage currentPath="/items" onNavigate={handleNavigate} />
          </Box>
        );
      default:
        return (
          <Box className="welcome-section">
            <img
              src={logo512}
              alt="Chanitec Logo"
              className="welcome-logo"
            />
            <Typography variant="h3" className="welcome-title">
              Bienvenue sur Chanitec
            </Typography>
            <Typography variant="h6" className="welcome-subtitle">
              Votre plateforme de gestion et de calcul de prix
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box className="dashboard-container">

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        className="dashboard-sidebar"
        classes={{
          paper: 'sidebar-paper'
        }}
      >
        <Box className="sidebar-header">
          <img
            src={logo512}
            alt="Chanitec Logo"
            className="sidebar-logo"
          />
        </Box>

                 <List className="sidebar-menu">
           {menuItems.map((item) => (
             <ListItem key={item.text} disablePadding>
               <ListItemButton
                 className={`sidebar-menu-item ${selectedPage === item.key ? 'active' : ''}`}
                 onClick={() => handleMenuClick(item.key)}
               >
                 <ListItemIcon className="menu-item-icon">
                   {item.icon}
                 </ListItemIcon>
                 <ListItemText
                   primary={item.text}
                   className="menu-item-text"
                 />
               </ListItemButton>
             </ListItem>
           ))}
         </List>

         <Divider className="sidebar-divider" />

         <List className="sidebar-menu">
           <ListItem disablePadding>
             <ListItemButton
               className="sidebar-menu-item logout-item"
               onClick={handleLogout}
             >
               <ListItemIcon className="menu-item-icon">
                 <LogoutIcon />
               </ListItemIcon>
               <ListItemText
                 primary="Déconnexion"
                 className="menu-item-text"
               />
             </ListItemButton>
           </ListItem>
         </List>
      </Drawer>

             {/* Main Content */}
       <Box className="dashboard-main">
         <Container maxWidth="lg" className="dashboard-content">
           {renderPageContent()}
         </Container>
       </Box>
    </Box>
  );
};

export default HomePage;