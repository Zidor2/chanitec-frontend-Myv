import React from 'react';
import { Box, Container, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import logo from '../../logo.png';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };

  return (
    <Box className="home-container">
      <Box className="logout-button-container">
        <Button
          color="primary"
          className="logout-button"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Déconnexion
        </Button>
      </Box>
      <Container maxWidth="md">
        <Box className="home-header">
          <img
            src={logo}
            alt="Logo"
            className="home-logo"
          />
          <Typography variant="h4" component="h1" className="home-title">
            Bienvenue sur Chanitec
          </Typography>
        </Box>

        <Box className="home-buttons">
          <Box className="button-container">
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              className="home-button"
              onClick={() => handleNavigate('/quote')}
            >
              Calcul de Prix
            </Button>
          </Box>
          <Box className="button-container">
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              className="home-button"
              onClick={() => handleNavigate('/org-chart')}
            >
              Organigramme
            </Button>
          </Box>
          <Box className="button-container">
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              className="home-button"
              onClick={() => handleNavigate('/intervention')}
            >
              Fiche d'intervention
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;