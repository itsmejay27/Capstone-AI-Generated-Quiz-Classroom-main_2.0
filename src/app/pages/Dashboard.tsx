import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Button,
  Typography,
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Paper,
} from '@mui/material';
import {
  Add,
  People,
  Code,
  School,
} from '@mui/icons-material';

export default function Dashboard() {
  const { currentUser, classrooms, addClassroom, joinClassroom } = useAuth();
  const navigate = useNavigate();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);

  // Create classroom states
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [description, setDescription] = useState('');
  const [classCode, setClassCode] = useState('');

  const isInstructor = currentUser?.role === 'instructor';
  const userClassrooms = classrooms.filter((classroom) =>
    isInstructor
      ? classroom.instructorId === currentUser?.id
      : classroom.students.includes(currentUser?.id || '')
  );

  const handleCreateClassroom = () => {
    if (!className || !subject || !section) return;
    const newClassroom = {
      id: `class-${Date.now()}`,
      name: className,
      subject,
      section,
      instructorId: currentUser?.id || '',
      classCode: `${subject.replace(/\s+/g, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      students: [],
      createdAt: new Date().toISOString(),
      description,
    };
    addClassroom(newClassroom);
    setClassName(''); setSubject(''); setSection(''); setDescription('');
    setOpenCreateDialog(false);
  };

  const handleJoinClassroom = () => {
    const studentId = currentUser?.id || '';
    const success = joinClassroom(classCode, studentId);
    if (success) {
      const targetClass = classrooms.find((c) => c.classCode.toLowerCase() === classCode.trim().toLowerCase());
      if (targetClass) navigate(`/classroom/${targetClass.id}`);
    } else {
      alert('Invalid Class Code. Please check the code and try again.');
    }
    setOpenJoinDialog(false);
    setClassCode('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Welcome back, {currentUser?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isInstructor
            ? 'Manage your classrooms and create AI-powered examinations'
            : 'View your enrolled classes, use AI Reviewers, and take assessments'}
        </Typography>
      </Box>



      {/* ── My Classrooms Section ── */}
      <Box
        id="classrooms-section"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
      >
        <Typography variant="h5" fontWeight="bold">
          My Classrooms
        </Typography>
        {!isInstructor && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenJoinDialog(true)}
          >
            Join Class
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {userClassrooms.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
              <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No classrooms found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isInstructor
                  ? 'Click the (+) button in the bottom right to create a class.'
                  : 'Click "Join Class" above and input the class code.'}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          userClassrooms.map((classroom, idx) => {
            const gradients = [
              'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
              'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
              'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
              'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
              'linear-gradient(135deg, #6b21a8 0%, #d946ef 100%)',
            ];
            const shadows = [
              'rgba(30,58,138,0.22)',
              'rgba(76,29,149,0.22)',
              'rgba(6,95,70,0.22)',
              'rgba(124,45,18,0.22)',
              'rgba(3,105,161,0.22)',
              'rgba(107,33,168,0.22)',
            ];
            const grad = gradients[idx % gradients.length];
            const shadow = shadows[idx % shadows.length];
            return (
              <Grid item xs={12} md={6} lg={4} key={classroom.id}>
                <Paper
                  sx={{
                    p: 3,
                    background: grad,
                    color: 'white',
                    borderRadius: 4,
                    cursor: 'pointer',
                    boxShadow: `0 8px 24px ${shadow}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    height: '100%',
                    boxSizing: 'border-box',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 18px 36px ${shadow}`,
                    },
                  }}
                  onClick={() => navigate(`/classroom/${classroom.id}`)}
                >
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 3,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <School sx={{ fontSize: 26 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                      {classroom.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.82rem', mt: 0.5 }}>
                      {classroom.subject} &bull; {classroom.section}
                    </Typography>
                    {classroom.description && (
                      <Typography variant="body2" sx={{
                        opacity: 0.75, fontSize: '0.8rem', mt: 0.75, lineHeight: 1.4,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {classroom.description}
                      </Typography>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                    <Chip
                      icon={<People sx={{ color: 'white !important', fontSize: '14px !important' }} />}
                      label={`${classroom.students.length} students`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.3)' }}
                    />
                    <Chip
                      icon={<Code sx={{ color: 'white !important', fontSize: '14px !important' }} />}
                      label={classroom.classCode}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.3)' }}
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })
        )}
      </Grid>

      {isInstructor && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          onClick={() => setOpenCreateDialog(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Create Classroom Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Classroom</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Class Name" fullWidth variant="outlined" sx={{ mb: 2 }}
            value={className} onChange={(e) => setClassName(e.target.value)} required />
          <TextField margin="dense" label="Subject" fullWidth variant="outlined" sx={{ mb: 2 }}
            value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <TextField margin="dense" label="Section" fullWidth variant="outlined" sx={{ mb: 2 }}
            value={section} onChange={(e) => setSection(e.target.value)} required />
          <TextField margin="dense" label="Description" fullWidth variant="outlined" multiline rows={3}
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateClassroom} variant="contained" disabled={!className || !subject || !section}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Classroom Dialog */}
      <Dialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Join Classroom</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the class code provided by your instructor
          </Typography>
          <TextField autoFocus margin="dense" label="Class Code" fullWidth variant="outlined"
            value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="e.g., WEB101-2024" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJoinDialog(false)}>Cancel</Button>
          <Button onClick={handleJoinClassroom} variant="contained" disabled={!classCode}>
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
