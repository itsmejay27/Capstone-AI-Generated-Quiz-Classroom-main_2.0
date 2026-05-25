import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth, mockUsers } from '../context/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
} from '@mui/material';
import { School, Person, Login as LoginIcon } from '@mui/icons-material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login(email, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    if (login(userEmail, userPassword)) {
      navigate('/dashboard');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 30%, #1976d2 60%, #42a5f5 100%)',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            width: '100%',
            maxWidth: 720,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <School sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
              OMSC Exam Generator
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 400 }}>
              AI-Powered Examination System
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              variant="outlined"
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontWeight: 600,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #0d47a1, #1565c0)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0a3d8f, #1258a8)',
                },
              }}
            >
              Sign In
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo Accounts
            </Typography>
          </Divider>

          <Grid container spacing={2}>
            {mockUsers.map((user) => (
              <Grid item xs={12} sm={6} key={user.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e2e8f0',
                    '&:hover': {
                      borderColor: user.role === 'instructor' ? '#7c3aed' : '#1565c0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => quickLogin(user.email, user.password)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: user.role === 'instructor' ? '#7c3aed' : '#1565c0',
                          fontWeight: 600,
                          fontSize: '1rem',
                        }}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.3 }}>
                          {user.email}
                        </Typography>
                      </Box>
                      <Chip
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: user.role === 'instructor' ? '#f5f3ff' : '#eff6ff',
                          color: user.role === 'instructor' ? '#7c3aed' : '#1565c0',
                          border: 'none',
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.6 }}>
              <strong>Research Project:</strong> Development of a Web-based Examination Generator using
              an Open-Source LLM and Retrieval-Augmented Generation
              <br />
              <strong>Institution:</strong> Occidental Mindoro State College - Mamburao Campus
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
