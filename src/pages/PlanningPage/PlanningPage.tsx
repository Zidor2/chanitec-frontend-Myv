import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import Layout from '../../components/Layout/Layout';
import './PlanningPage.scss';

interface PlanningPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const PlanningPage: React.FC<PlanningPageProps> = ({
  currentPath = '/planning',
  onNavigate,
  onLogout
}) => {
  return (
    <Layout currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout}>
      <Box className="planning-page-container">
        <Box className="planning-page-header">
          <Typography variant="h4" component="h1" gutterBottom>
            Planning
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gérez vos plannings, interventions et ressources depuis cette page.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))'
            }
          }}
        >
          <Box>
            <Card className="planning-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Calendrier des interventions
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Suivez les travaux en cours et planifiez les prochaines interventions.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => onNavigate?.('/intervention')}
                >
                  Aller à Intervention
                </Button>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card className="planning-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Gestion des ressources
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Optimisez l'affectation des équipes et des chantiers.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => onNavigate?.('/employees')}
                >
                  Voir les employés
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default PlanningPage;
