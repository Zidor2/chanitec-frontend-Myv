import React, { useState } from 'react';
import { Box, Container, Paper, TextField, Button, Typography } from '@mui/material';
import logo from '../../logo.png';
import './LoginPage.scss';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <Box className="login-container">
      <Container maxWidth="sm">
        <Paper elevation={3} className="login-paper">
          <Box className="login-logo-container">
            <img
              src={logo}
              alt="Logo"
              className="login-logo"
            />
          </Box>

          <Typography variant="h5" component="h1" className="login-title">
            Connexion
          </Typography>

          <form onSubmit={handleSubmit} className="login-form">
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              className="login-button"
            >
              Se connecter
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;