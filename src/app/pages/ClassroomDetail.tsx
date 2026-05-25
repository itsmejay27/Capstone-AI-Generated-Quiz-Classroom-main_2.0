import { useParams, useNavigate } from 'react-router';
import { useAuth, mockUsers } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Quiz,
  Add,
  Schedule,
  CheckCircle,
  People,
  Assignment,
  Assessment,
  MenuBook,
  Upload,
  Delete,
  PictureAsPdf,
  Description,
  InsertDriveFile,
  Visibility,
} from '@mui/icons-material';
import { useState } from 'react';

// Academic grade converter standard for OMSC (Occidental Mindoro State College)
// Integrated with the Base-65 Transmutation System (65% raw passing -> 75% transmuted passing)
function convertToTransmutedOMSCGrade(score: number, total: number) {
  if (total <= 0) return { rawPct: 0, transmutedPct: 0, grade: '5.00', remark: 'Failed', color: 'error.main' };
  
  const rawPct = (score / total) * 100;
  
  let transmutedPct = 0;
  if (rawPct >= 65) {
    transmutedPct = 75 + ((rawPct - 65) * 25) / 35;
  } else {
    transmutedPct = 50 + (rawPct * 25) / 65;
  }
  
  let grade = '5.00';
  let remark = 'Failed';
  let color = 'error.main';
  
  if (transmutedPct >= 98) {
    grade = '1.00'; remark = 'Excellent'; color = 'success.main';
  } else if (transmutedPct >= 95) {
    grade = '1.25'; remark = 'Very Good'; color = 'success.main';
  } else if (transmutedPct >= 92) {
    grade = '1.50'; remark = 'Very Good'; color = 'success.main';
  } else if (transmutedPct >= 89) {
    grade = '1.75'; remark = 'Good'; color = 'success.main';
  } else if (transmutedPct >= 86) {
    grade = '2.00'; remark = 'Good'; color = 'success.main';
  } else if (transmutedPct >= 83) {
    grade = '2.25'; remark = 'Satisfactory'; color = 'info.main';
  } else if (transmutedPct >= 80) {
    grade = '2.50'; remark = 'Satisfactory'; color = 'info.main';
  } else if (transmutedPct >= 77) {
    grade = '2.75'; remark = 'Fair'; color = 'warning.main';
  } else if (transmutedPct >= 75) {
    grade = '3.00'; remark = 'Passing'; color = 'warning.main';
  }
  
  return { rawPct, transmutedPct, grade, remark, color };
}

function getMaterialIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PictureAsPdf sx={{ fontSize: 32, color: '#e53935' }} />;
  if (ext === 'doc' || ext === 'docx') return <Description sx={{ fontSize: 32, color: '#1565c0' }} />;
  return <InsertDriveFile sx={{ fontSize: 32, color: '#546e7a' }} />;
}

export default function ClassroomDetail() {
  const { classroomId } = useParams();
  const { currentUser, classrooms, exams, examAttempts, classroomMaterials, addClassroomMaterial, deleteClassroomMaterial } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [viewMaterial, setViewMaterial] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const classroom = classrooms.find((c) => c.id === classroomId);
  const instructor = mockUsers.find((u) => u.id === classroom?.instructorId);
  const students = mockUsers.filter((u) => classroom?.students.includes(u.id));

  const isInstructor = currentUser?.role === 'instructor';
  const materials = classroomMaterials[classroomId || ''] || [];

  if (!classroom) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Classroom not found</Typography>
      </Container>
    );
  }

  // Filter classroom exams
  const rawClassExams = exams.filter((e) => e.classroomId === classroomId);
  const classExams = isInstructor
    ? rawClassExams
    : rawClassExams.filter((e) => {
        if (!e.postDate) return true;
        return new Date(e.postDate) <= new Date();
      });

  const getExamStatus = (examId: string) => {
    const attempt = examAttempts.find(
      (a) => a.examId === examId && a.studentId === currentUser?.id
    );
    if (attempt?.submittedAt) return 'completed';
    if (attempt?.startedAt) return 'in-progress';
    return 'not-started';
  };

  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classroomId) return;
    const material = {
      id: `mat-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Instructor',
      // In a real app this would be a URL; here we store the filename for display
      content: `This material "${file.name}" has been uploaded by the instructor for classroom study. Students can review this document to prepare for upcoming assessments.`,
    };
    addClassroomMaterial(classroomId, material);
    // Reset input
    e.target.value = '';
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (classroomId) {
      deleteClassroomMaterial(classroomId, materialId);
      setDeleteConfirm(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const tabCount = isInstructor ? 4 : 3;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      {/* Header banner */}
      <Paper
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(30,58,138,0.12)',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            p: { xs: 3, md: 4 },
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
                {classroom.name}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 400 }}>
                {classroom.section} &bull; {classroom.subject}
              </Typography>
              {classroom.description && (
                <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.8, maxWidth: 600 }}>
                  {classroom.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Code: ${classroom.classCode}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', backdropFilter: 'blur(8px)' }}
                />
                <Chip
                  icon={<People sx={{ color: 'white !important' }} />}
                  label={`${classroom.students.length} Students`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)' }}
                />
              </Box>
            </Box>
            {isInstructor && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/exam-generator')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                Generate Exam
              </Button>
            )}
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            '& .MuiTab-root': { fontWeight: 600, minHeight: 52 },
          }}
        >
          <Tab label="Exams & Quizzes" icon={<Quiz />} iconPosition="start" />
          <Tab label="Study Materials" icon={<MenuBook />} iconPosition="start" />
          <Tab label="People" icon={<People />} iconPosition="start" />
          {isInstructor && (
            <Tab label="Grades & Scores" icon={<Assessment />} iconPosition="start" />
          )}
        </Tabs>
      </Paper>

      {/* TAB 0: EXAMS LIST */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {classExams.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: '50%',
                  bgcolor: 'rgba(25,118,210,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                }}>
                  <Assignment sx={{ fontSize: 40, color: '#1976d2' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  No exams or quizzes scheduled yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {isInstructor
                    ? 'Generate a new exam or assign one from your repository.'
                    : 'Your instructor has not posted any exams yet. Check back later.'}
                </Typography>
                {isInstructor && (
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button variant="contained" onClick={() => navigate('/exam-repository')}>
                      Assign from Repository
                    </Button>
                    <Button variant="outlined" onClick={() => navigate('/exam-generator')}>
                      Generate with AI
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          ) : (
            classExams.map((exam) => {
              const status = !isInstructor ? getExamStatus(exam.id) : null;
              const attempt = examAttempts.find(
                (a) => a.examId === exam.id && a.studentId === currentUser?.id
              );
              const isFuture = exam.postDate && new Date(exam.postDate) > new Date();

              const statusColor: any = {
                completed: { bg: '#dcfce7', border: '#16a34a', text: '#15803d', label: 'Completed' },
                'in-progress': { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e', label: 'In Progress' },
                'not-started': { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', label: 'Not Started' },
              };
              const sc = status ? statusColor[status] : null;

              return (
                <Grid item xs={12} md={6} key={exam.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                      transition: 'all 0.25s ease',
                      '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.10)', transform: 'translateY(-3px)' },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 2 }}>
                        <Box sx={{
                          width: 48, height: 48, borderRadius: 2.5,
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Quiz sx={{ fontSize: 26, color: 'white' }} />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3, mb: 0.5 }}>
                            {exam.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {exam.description}
                          </Typography>
                        </Box>
                        {sc && (
                          <Chip
                            size="small"
                            label={sc.label}
                            sx={{ bgcolor: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600, flexShrink: 0 }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip icon={<Schedule />} label={`${exam.duration} mins`} size="small" variant="outlined" />
                        <Chip label={`${exam.totalPoints} pts`} size="small" variant="outlined" />
                        <Chip label={`${exam.activeQuestionCount || exam.questions.length} items`} size="small" variant="outlined" />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {exam.postDate && (
                          <Typography variant="caption" color="text.secondary">
                            Posted: {new Date(exam.postDate).toLocaleString()}
                          </Typography>
                        )}
                        {exam.dueDate && (
                          <Typography variant="caption" color="error.main" fontWeight="bold">
                            Due: {new Date(exam.dueDate).toLocaleString()}
                          </Typography>
                        )}
                      </Box>

                      {!isInstructor && status === 'completed' && attempt?.score !== undefined && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#dcfce7', borderRadius: 2, border: '1px solid #86efac' }}>
                          <Typography variant="body2" fontWeight="bold" color="success.dark">
                            Score: {attempt.score} / {exam.totalPoints}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      {isInstructor ? (
                        <Button size="small" variant="outlined" fullWidth onClick={() => navigate('/exam-repository')}>
                          Manage in Repository
                        </Button>
                      ) : status === 'completed' ? (
                        <Button size="small" variant="outlined" color="success" fullWidth
                          onClick={() => navigate(`/exam/${exam.id}/results`)}>
                          View Submission
                        </Button>
                      ) : (
                        <Button size="small" variant="contained" fullWidth disabled={!!isFuture}
                          onClick={() => navigate(`/exam/${exam.id}/take`)}>
                          {status === 'in-progress' ? 'Continue Exam' : 'Start Exam'}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* TAB 1: STUDY MATERIALS */}
      {activeTab === 1 && (
        <Box>
          {/* Instructor upload section */}
          {isInstructor && (
            <Paper
              sx={{
                p: 3, mb: 3, borderRadius: 4,
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1px solid #bae6fd',
                boxShadow: '0 4px 16px rgba(3,105,161,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="#0c4a6e">
                    Upload Study Materials
                  </Typography>
                  <Typography variant="body2" color="#0369a1">
                    Upload PDFs, Word documents, or text files for students to study before assessments.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<Upload />}
                  sx={{
                    background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                    boxShadow: '0 4px 12px rgba(3,105,161,0.3)',
                    '&:hover': { boxShadow: '0 6px 16px rgba(3,105,161,0.4)' },
                  }}
                >
                  Upload Material
                  <input type="file" hidden accept=".pdf,.doc,.docx,.txt,.ppt,.pptx" onChange={handleMaterialUpload} />
                </Button>
              </Box>
            </Paper>
          )}

          {/* Materials grid */}
          {materials.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: 'rgba(3,105,161,0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
              }}>
                <MenuBook sx={{ fontSize: 40, color: '#0369a1' }} />
              </Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                No study materials yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isInstructor
                  ? 'Upload lecture notes, readings, or slide decks to help students prepare.'
                  : 'Your instructor has not uploaded any materials yet. Check back later.'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {materials.map((mat) => (
                <Grid item xs={12} sm={6} md={4} key={mat.id}>
                  <Card
                    sx={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                      transition: 'all 0.25s ease',
                      '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.1)', transform: 'translateY(-3px)' },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                        {getMaterialIcon(mat.name)}
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {mat.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(mat.size)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Uploaded by {mat.uploadedBy}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(mat.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 1.5, pt: 0, gap: 1 }}>
                      <Button
                        size="small" variant="contained" startIcon={<Visibility />}
                        sx={{ flexGrow: 1, background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)' }}
                        onClick={() => setViewMaterial(mat)}
                      >
                        View
                      </Button>
                      {isInstructor && (
                        <Tooltip title="Delete material">
                          <IconButton
                            size="small" color="error"
                            onClick={() => setDeleteConfirm(mat.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* TAB 2: PEOPLE LIST */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)', color: 'white' }}>
                <Typography variant="subtitle1" fontWeight="bold">Class Instructor</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {instructor && (
                  <ListItem sx={{ px: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ background: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)', fontWeight: 'bold' }}>
                        {instructor.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight="bold">{instructor.name}</Typography>}
                      secondary={instructor.email}
                    />
                  </ListItem>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Class Students ({students.length})
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {students.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No students enrolled yet. Share code <strong>{classroom.classCode}</strong> with students.
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {students.map((student, idx) => (
                      <Box key={student.id}>
                        <ListItem sx={{ px: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', fontWeight: 'bold' }}>
                              {student.name.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography fontWeight="medium">{student.name}</Typography>}
                            secondary={student.email}
                          />
                          <Chip label={`#${idx + 1}`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569' }} />
                        </ListItem>
                        {idx < students.length - 1 && <Divider variant="inset" component="li" />}
                      </Box>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: GRADES MATRIX (INSTRUCTOR ONLY) */}
      {activeTab === 3 && isInstructor && (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 3 },
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
              <TableRow>
                <TableCell style={{ fontWeight: 'bold', color: 'white' }}>Student Name</TableCell>
                <TableCell style={{ fontWeight: 'bold', color: 'white' }}>Email Address</TableCell>
                {rawClassExams.map((exam) => (
                  <TableCell key={exam.id} align="center" style={{ fontWeight: 'bold', color: 'white' }}>
                    {exam.title}<br />
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Cap: {exam.totalPoints} pts)</span>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2 + rawClassExams.length} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No students enrolled to display grades.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    {rawClassExams.map((exam) => {
                      const attempt = examAttempts.find(
                        (a) => a.examId === exam.id && a.studentId === student.id
                      );
                      if (attempt && attempt.submittedAt && attempt.score !== undefined) {
                        const { rawPct, transmutedPct, grade, remark, color } = convertToTransmutedOMSCGrade(attempt.score, exam.totalPoints);
                        return (
                          <TableCell key={exam.id} align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {attempt.score} / {exam.totalPoints}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Raw: {rawPct.toFixed(1)}%
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                Transmuted: {transmutedPct.toFixed(1)}%
                              </Typography>
                              <Chip
                                label={`${grade} (${remark})`}
                                size="small"
                                sx={{ bgcolor: 'white', border: '1px solid', borderColor: color, color: color, fontWeight: 'bold', mt: 0.5 }}
                              />
                            </Box>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={exam.id} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          Not Submitted
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Material Dialog */}
      <Dialog open={!!viewMaterial} onClose={() => setViewMaterial(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', color: 'white', fontWeight: 'bold' }}>
          {viewMaterial?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a preview of the uploaded material. In a production system, this would display the actual file content.
          </Alert>
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            {viewMaterial?.content}
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>File name:</strong> {viewMaterial?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>File size:</strong> {viewMaterial ? formatFileSize(viewMaterial.size) : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Uploaded by:</strong> {viewMaterial?.uploadedBy}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Date:</strong> {viewMaterial ? new Date(viewMaterial.uploadedAt).toLocaleString() : ''}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewMaterial(null)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Material Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Delete Material?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove the material from the classroom. Students will no longer be able to access it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDeleteMaterial(deleteConfirm)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
