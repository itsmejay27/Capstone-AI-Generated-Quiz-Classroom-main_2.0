import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  CalendarMonth,
  Quiz,
  Image as ImageIcon,
  Save,
} from '@mui/icons-material';

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80',
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&q=80',
];

export default function ExamRepository() {
  const {
    currentUser,
    savedExams,
    classrooms,
    assignExamToClassroom,
    updateExamInRepository,
    deleteExamFromRepository,
  } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Assign modal state
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  
  // Set default post date to now, due date to tomorrow
  const getLocalDateTimeString = (date: Date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };
  const [postDate, setPostDate] = useState(getLocalDateTimeString(new Date()));
  const [dueDate, setDueDate] = useState(getLocalDateTimeString(new Date(Date.now() + 86400000)));

  // Edit modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [newQType, setNewQType] = useState('multiple-choice');

  const filteredExams = savedExams.filter((exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAssign = (examId: string) => {
    setSelectedExamId(examId);
    // Auto-select first class if available
    const myClasses = classrooms.filter((c) => c.instructorId === currentUser?.id);
    if (myClasses.length > 0) {
      setSelectedClassroomId(myClasses[0].id);
    }
    setOpenAssignModal(true);
  };

  const handleAssignConfirm = () => {
    if (!selectedExamId || !selectedClassroomId || !postDate || !dueDate) {
      alert('Please fill out all fields.');
      return;
    }
    assignExamToClassroom(selectedExamId, selectedClassroomId, postDate, dueDate);
    alert('Exam assigned and scheduled successfully!');
    setOpenAssignModal(false);
    setSelectedExamId(null);
  };

  // Open full template editor
  const handleOpenEdit = (exam: any) => {
    // deep clone
    setEditingExam(JSON.parse(JSON.stringify(exam)));
    setOpenEditModal(true);
  };

  const handleSaveEditConfirm = () => {
    if (!editingExam.title.trim()) {
      alert('Title is required');
      return;
    }
    updateExamInRepository(editingExam);
    setOpenEditModal(false);
    setEditingExam(null);
    alert('Exam template updated successfully!');
  };

  // Edit question helpers inside Repository dialog
  const handleUpdateQText = (idx: number, val: string) => {
    if (!editingExam) return;
    const updated = { ...editingExam };
    updated.questions[idx].question = val;
    setEditingExam(updated);
  };

  const handleUpdateQOption = (qIdx: number, oIdx: number, val: string) => {
    if (!editingExam) return;
    const updated = { ...editingExam };
    updated.questions[qIdx].options[oIdx] = val;
    setEditingExam(updated);
  };

  const handleUpdateQCorrectAnswer = (qIdx: number, val: any) => {
    if (!editingExam) return;
    const updated = { ...editingExam };
    updated.questions[qIdx].correctAnswer = val;
    setEditingExam(updated);
  };

  const handleUpdateQPoints = (qIdx: number, val: number) => {
    if (!editingExam) return;
    const updated = { ...editingExam };
    updated.questions[qIdx].points = val;
    setEditingExam(updated);
  };

  const handleAttachImg = (qIdx: number, optIdx?: number) => {
    if (!editingExam) return;
    const randomImg = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
    const updated = { ...editingExam };
    if (optIdx !== undefined) {
      if (!updated.questions[qIdx].optionsImages) {
        updated.questions[qIdx].optionsImages = ['', '', '', ''];
      }
      updated.questions[qIdx].optionsImages[optIdx] = randomImg;
    } else {
      updated.questions[qIdx].image = randomImg;
    }
    setEditingExam(updated);
  };

  const handleRemoveImg = (qIdx: number, optIdx?: number) => {
    if (!editingExam) return;
    const updated = { ...editingExam };
    if (optIdx !== undefined) {
      if (updated.questions[qIdx].optionsImages) {
        updated.questions[qIdx].optionsImages[optIdx] = '';
      }
    } else {
      updated.questions[qIdx].image = '';
    }
    setEditingExam(updated);
  };

  const handleDeleteQ = (qIdx: number) => {
    if (!editingExam) return;
    const updated = { ...editingExam };
    updated.questions = updated.questions.filter((_: any, idx: number) => idx !== qIdx);
    setEditingExam(updated);
  };

  const handleAddQ = (type: string) => {
    if (!editingExam) return;
    const newQ: any = {
      id: `q-rep-new-${Date.now()}`,
      type: type,
      question: `New Template ${type === 'multiple-choice' ? 'Multiple Choice' : type === 'true-false' ? 'True/False' : type === 'short-answer' ? 'Short Answer' : 'Essay'} Question: Enter text...`,
      points: type === 'multiple-choice' ? 2 : type === 'true-false' ? 1 : type === 'short-answer' ? 3 : 5,
      difficulty: 'medium',
      image: '',
    };
    if (type === 'multiple-choice') {
      newQ.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      newQ.correctAnswer = 0;
      newQ.optionsImages = ['', '', '', ''];
    } else if (type === 'true-false') {
      newQ.correctAnswer = 'true';
    } else if (type === 'short-answer') {
      newQ.correctAnswer = 'Answer text';
    }
    const updated = { ...editingExam };
    updated.questions.push(newQ);
    setEditingExam(updated);
  };

  const myClassrooms = classrooms.filter((c) => c.instructorId === currentUser?.id);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Quiz sx={{ fontSize: 40, color: '#9c27b0', mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Exam Repository
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View, modify, and schedule generated template exams to classrooms.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate('/exam-generator')}
          >
            Generate New Exam
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Search template exams by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Grid container spacing={3}>
          {filteredExams.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No saved exam templates found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create one now using the AI Exam Generator.
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/exam-generator')}>
                  Generate Exam
                </Button>
              </Paper>
            </Grid>
          ) : (
            filteredExams.map((exam) => (
              <Grid item xs={12} key={exam.id}>
                <Paper
                  elevation={0}
                  sx={{
                    width: '100%',
                    bgcolor: 'white',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    borderLeft: '6px solid #9c27b0',
                    p: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                      borderColor: '#cbd5e1',
                    },
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 3,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Left Section: Icon + Title & Description */}
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(156,39,176,0.2)',
                    }}>
                      <Quiz sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{
                          color: 'text.primary',
                          lineHeight: 1.25,
                          letterSpacing: '-0.01em',
                          fontSize: '1.05rem',
                          mb: 0.5
                        }}
                      >
                        {exam.title}
                      </Typography>
                      {exam.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            mb: 1.5,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {exam.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`Pool: ${exam.questions.length} items`} size="small" color="secondary" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Chip label={`Set: ${exam.activeQuestionCount || exam.questions.length} items`} size="small" color="primary" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Chip label={`Points Cap: ${exam.totalPoints} pts`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
                        <Chip label={`Time limit: ${exam.duration}m`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
                      </Box>
                    </Box>
                  </Box>

                  {/* Right Section: Edit, Delete, Assign Actions */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexShrink: 0,
                    minWidth: { md: '280px' },
                    width: { xs: '100%', md: 'auto' },
                    justifyContent: { xs: 'space-between', md: 'flex-end' },
                    borderTop: { xs: '1px solid #f1f5f9', md: 'none' },
                    pt: { xs: 1.5, md: 0 },
                    mt: { xs: 1, md: 0 }
                  }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => handleOpenEdit(exam)}
                      sx={{ fontWeight: 700, height: 32 }}
                    >
                      Edit Template
                    </Button>
                    
                    <Button
                      variant="contained"
                      size="small"
                      color="secondary"
                      startIcon={<CalendarMonth />}
                      onClick={() => handleOpenAssign(exam.id)}
                      sx={{ fontWeight: 700, height: 32, px: 2 }}
                    >
                      Assign to Class
                    </Button>

                    <Tooltip title="Delete template">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (confirm('Delete this template from repository?')) {
                            deleteExamFromRepository(exam.id);
                          }
                        }}
                        sx={{
                          bgcolor: '#fef2f2',
                          border: '1px solid #fee2e2',
                          '&:hover': { bgcolor: '#fee2e2' },
                          width: 32,
                          height: 32,
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </Paper>

      {/* Assign / Schedule Modal */}
      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Exam to Classroom & Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Classroom</InputLabel>
              <Select
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                label="Select Classroom"
              >
                {myClassrooms.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.section})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Post Date and Time"
              type="datetime-local"
              fullWidth
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Due Date and Time"
              type="datetime-local"
              fullWidth
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignModal(false)}>Cancel</Button>
          <Button onClick={handleAssignConfirm} variant="contained" color="secondary" disabled={!selectedClassroomId}>
            Schedule Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Template Editor Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Exam Template Pool</DialogTitle>
        <DialogContent dividers>
          {editingExam && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Template Title"
                value={editingExam.title}
                onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
              />
              <TextField
                fullWidth
                label="Template Description"
                value={editingExam.description}
                onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                multiline
                rows={2}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Questions Pool ({editingExam.questions.length} items)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Type to Add</InputLabel>
                    <Select
                      value={newQType}
                      label="Type to Add"
                      onChange={(e) => setNewQType(e.target.value as string)}
                    >
                      <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                      <MenuItem value="true-false">True / False</MenuItem>
                      <MenuItem value="short-answer">Short Answer</MenuItem>
                      <MenuItem value="essay">Essay</MenuItem>
                    </Select>
                  </FormControl>
                  <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => handleAddQ(newQType)}>
                    Add Question Item
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {editingExam.questions.map((q: any, qIdx: number) => (
                  <Grid item xs={12} key={q.id}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', position: 'relative' }}>
                      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                        <IconButton size="small" color="error" onClick={() => handleDeleteQ(qIdx)}>
                          <Delete />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip label={`#${qIdx + 1}`} size="small" />
                        <Chip label={q.type.toUpperCase()} size="small" color="primary" />
                        <Chip label={`${q.points || 0} points`} size="small" variant="outlined" />
                      </Box>

                      <TextField
                        fullWidth
                        label="Question Text"
                        value={q.question}
                        onChange={(e) => handleUpdateQText(qIdx, e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                      />

                      {/* Question image attachment */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ImageIcon />}
                          onClick={() => handleAttachImg(qIdx)}
                        >
                          Attach Question Image
                        </Button>
                        {q.image && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <img src={q.image} alt="Q Thumbnail" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                            <IconButton size="small" color="error" onClick={() => handleRemoveImg(qIdx)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      {/* MC choices */}
                      {q.type === 'multiple-choice' && q.options && (
                        <Box sx={{ pl: 2, borderLeft: '3px solid #1976d2' }}>
                          <RadioGroup
                            value={q.correctAnswer}
                            onChange={(e) => handleUpdateQCorrectAnswer(qIdx, Number(e.target.value))}
                          >
                            {q.options.map((opt: string, optIdx: number) => (
                              <Grid container spacing={1} key={optIdx} alignItems="center" sx={{ mb: 1 }}>
                                <Grid item xs={1}>
                                  <FormControlLabel value={optIdx} control={<Radio />} label={String.fromCharCode(65 + optIdx)} />
                                </Grid>
                                <Grid item xs={8}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={opt}
                                    onChange={(e) => handleUpdateQOption(qIdx, optIdx, e.target.value)}
                                  />
                                </Grid>
                                <Grid item xs={3} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <IconButton size="small" onClick={() => handleAttachImg(qIdx, optIdx)}>
                                    <ImageIcon fontSize="small" />
                                  </IconButton>
                                  {q.optionsImages?.[optIdx] && (
                                    <>
                                      <img src={q.optionsImages[optIdx]} alt="Opt Thumbnail" style={{ width: '25px', height: '25px', objectFit: 'cover', borderRadius: '4px' }} />
                                      <IconButton size="small" color="error" onClick={() => handleRemoveImg(qIdx, optIdx)}>
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Grid>
                              </Grid>
                            ))}
                          </RadioGroup>
                        </Box>
                      )}

                      {/* T/F Choice */}
                      {q.type === 'true-false' && (
                        <Box sx={{ pl: 2, borderLeft: '3px solid #2e7d32' }}>
                          <RadioGroup
                            value={q.correctAnswer}
                            onChange={(e) => handleUpdateQCorrectAnswer(qIdx, e.target.value)}
                            row
                          >
                            <FormControlLabel value="true" control={<Radio />} label="True" />
                            <FormControlLabel value="false" control={<Radio />} label="False" />
                          </RadioGroup>
                        </Box>
                      )}

                      {/* Short answer choice */}
                      {q.type === 'short-answer' && (
                        <TextField
                          fullWidth
                          label="Expected Correct Answer"
                          size="small"
                          value={q.correctAnswer}
                          onChange={(e) => handleUpdateQCorrectAnswer(qIdx, e.target.value)}
                        />
                      )}

                      {/* Essay choice */}
                      {q.type === 'essay' && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                          Essay Question: Students will compose their answer in a multi-line input box. No automated grading key is required.
                        </Typography>
                      )}

                      {/* Points setting for question */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6} md={3}>
                          <TextField
                            fullWidth
                            label="Points"
                            type="number"
                            size="small"
                            value={q.points || 0}
                            onChange={(e) => handleUpdateQPoints(qIdx, Number(e.target.value))}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button onClick={handleSaveEditConfirm} variant="contained" startIcon={<Save />}>
            Save Template Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
