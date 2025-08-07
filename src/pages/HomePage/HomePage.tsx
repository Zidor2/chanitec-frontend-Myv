import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import logo from '../../assets/logo512.png';
import './HomePage.scss';

interface HomePageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  currentPath = '/home',
  onNavigate,
  onLogout
}) => {
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    totalClients: 0,
    totalSplits: 0
  });

  // Simulate fetching stats (in a real app, this would come from API)
  useEffect(() => {
    // Mock data - replace with actual API calls
    setStats({
      totalQuotes: 156,
      pendingQuotes: 23,
      totalClients: 45,
      totalSplits: 89
    });
  }, []);

  const menuItems = [
    {
      title: 'Nouveau Devis',
      description: 'Créer un nouveau devis et calculer les prix',
      icon: <AddIcon />,
      path: '/quote',
      color: '#1976d2',
      badge: 'Populaire'
    },
    {
      title: 'Historique',
      description: 'Consulter et gérer l\'historique des devis',
      icon: <HistoryIcon />,
      path: '/history',
      color: '#2196f3',
      badge: 'Récents'
    },
    {
      title: 'Clients',
      description: 'Gérer les clients et leurs sites',
      icon: <PeopleIcon />,
      path: '/clients',
      color: '#4caf50'
    },
    {
      title: 'Articles',
      description: 'Gérer le catalogue d\'articles et services',
      icon: <InventoryIcon />,
      path: '/items',
      color: '#ff9800'
    },
    {
      title: 'Intervention',
      description: 'Planifier et suivre les interventions',
      icon: <AssignmentIcon />,
      path: '/intervention',
      color: '#9c27b0'
    },
    {
      title: 'Organigramme',
      description: 'Visualiser la structure organisationnelle',
      icon: <BusinessIcon />,
      path: '/org-chart',
      color: '#607d8b'
    },
    {
      title: 'Employés',
      description: 'Gérer les employés et leurs informations',
      icon: <GroupIcon />,
      path: '/employees',
      color: '#795548'
    }
  ];

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${color}15, ${color}05)`,
      border: `1px solid ${color}30`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${color}20`
      }
    }}>
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Avatar sx={{
          bgcolor: color,
          width: 56,
          height: 56,
          mx: 'auto',
          mb: 2,
          boxShadow: `0 4px 12px ${color}40`
        }}>
          {icon}
        </Avatar>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className="dashboard-container">
        {/* Hero Section */}
        <Box className="hero-section">
          <Container maxWidth="lg">
            <Box sx={{
              textAlign: 'center',
              py: 6,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              borderRadius: 3,
              color: 'white',
              mb: 4,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.3
              }} />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <img src={logo} alt="Chanitec Logo" className="hero-logo" />
                <Typography variant="h2" sx={{
                  fontWeight: 800,
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Bienvenue sur Chanitec
                </Typography>
                <Typography variant="h5" sx={{
                  mb: 3,
                  opacity: 0.9,
                  fontWeight: 300
                }}>
                  Votre plateforme complète de gestion des feuilles de calcul et interventions
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => handleNavigate('/quote')}
                  sx={{
                    bgcolor: 'white',
                    color: '#1976d2',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                    }
                  }}
                  startIcon={<AddIcon />}
                >
                  Créer un nouveau devis
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Statistics Section */}
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            mb: 3,
            textAlign: 'center',
            color: '#1976d2'
          }}>
            Aperçu de votre activité
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3
          }}>
            <StatCard
              title="Devis Total"
              value={stats.totalQuotes}
              icon={<TrendingUpIcon />}
              color="#1976d2"
              subtitle="Tous les devis créés"
            />
            <StatCard
              title="En Attente"
              value={stats.pendingQuotes}
              icon={<ScheduleIcon />}
              color="#ff9800"
              subtitle="Devis à traiter"
            />
            <StatCard
              title="Clients"
              value={stats.totalClients}
              icon={<PeopleIcon />}
              color="#4caf50"
              subtitle="Clients actifs"
            />
            <StatCard
              title="Équipement Frigorifique"
              value={stats.totalSplits}
              icon={<InventoryIcon />}
              color="#9c27b0"
              subtitle="Équipement disponibles"
            />
          </Box>
        </Container>

        {/* Quick Actions Section */}
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            mb: 3,
            textAlign: 'center',
            color: '#1976d2'
          }}>
            Accès rapide
          </Typography>
          <Box className="menu-grid">
            {menuItems.map((item) => (
              <Card
                key={item.path}
                className="menu-card"
                onClick={() => handleNavigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.15)'
                  }
                }}
              >
                {item.badge && (
                  <Chip
                    label={item.badge}
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: 16,
                      zIndex: 1,
                      fontWeight: 600
                    }}
                  />
                )}
                <CardContent className="menu-card-content">
                  <Box
                    className="menu-icon-container"
                    sx={{
                      background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                      color: 'white',
                      borderRadius: '50%',
                      width: 70,
                      height: 70,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                      boxShadow: `0 6px 20px ${item.color}40`
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h6" className="menu-title" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" className="menu-description" color="textSecondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3
            }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Calculs précis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Calculs automatiques des prix avec gestion des taxes et remises
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <StarIcon sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Interface intuitive
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interface moderne et facile à utiliser pour tous les utilisateurs
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Suivi complet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Suivi complet des devis, clients et interventions
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Layout>
  );
};

export default HomePage;