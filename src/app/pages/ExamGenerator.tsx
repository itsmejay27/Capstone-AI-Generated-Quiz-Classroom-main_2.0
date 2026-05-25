import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Upload,
  AutoAwesome,
  Add,
  Delete,
  Save,
  Image as ImageIcon,
  CheckCircle,
  HelpOutline,
} from '@mui/icons-material';

const steps = ['Exam Details', 'Upload Materials', 'Configure Generation', 'Review & Generate'];

// Preloaded mock images for simulated select
const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80', // Laptop / Code
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80', // Charts / Work
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80', // Database / Schema
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&q=80', // AI neural net
];

export default function ExamGenerator() {
  const { classroomId } = useParams();
  const { currentUser, saveExamToRepository, classrooms } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Step 1: Details
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalPoints, setTotalPoints] = useState(50); // Default 50. Limit: count by 10 up to 100.
  const [assessmentType, setAssessmentType] = useState('exam'); // 'quiz' or 'exam'

  // Step 2: Uploads
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [materials, setMaterials] = useState<File[]>([]);
  const [tos, setTos] = useState<File | null>(null);

  // Step 3: Question Type Allocations
  const [mcCount, setMcCount] = useState(5);
  const [tfCount, setTfCount] = useState(5);
  const [saCount, setSaCount] = useState(0);
  const [essayCount, setEssayCount] = useState(0);
  const [extraCount, setExtraCount] = useState(5); // Extra questions pool size (e.g. 5 extra)
  const [difficulty, setDifficulty] = useState('medium');
  const [topics, setTopics] = useState<string[]>(['General Subject Matter']);
  const [generationPrompt, setGenerationPrompt] = useState('Write an exam covering fundamental web development technologies including HTML5, CSS layout engines, and basic JavaScript dynamics.');

  // Step 4: Generated list of N + E items
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState('multiple-choice');

  const activeQuestionCount = mcCount + tfCount + saCount + essayCount;
  const totalGeneratedCount = activeQuestionCount + extraCount;

  const handleNext = () => {
    if (activeStep === 2) {
      // Transitioning to generate step
      generateMockQuestions();
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 4) {
      setIsPreviewMode(false);
    }
    setActiveStep((prev) => prev - 1);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'syllabus' | 'materials' | 'tos'
  ) => {
    const files = e.target.files;
    if (files) {
      if (type === 'materials') {
        setMaterials([...materials, ...Array.from(files)]);
      } else if (type === 'syllabus') {
        setSyllabus(files[0]);
      } else if (type === 'tos') {
        setTos(files[0]);
      }
    }
  };

  const addTopic = () => {
    setTopics([...topics, '']);
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  // Generate N+E mock items based on the configuration input
  const generateMockQuestions = () => {
    setGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const items: any[] = [];
      let idCounter = 1;

      const currentTopic = topics[0] || 'Web Technologies';
      const promptKeyword = generationPrompt.trim() ? `[Topic: ${generationPrompt.length > 40 ? generationPrompt.substring(0, 40) + '...' : generationPrompt}]` : `regarding ${currentTopic}`;

      // 1. Multiple choice
      for (let i = 0; i < mcCount; i++) {
        items.push({
          id: `gq-${idCounter++}`,
          type: 'multiple-choice',
          question: `Generated Multiple Choice Question ${i + 1} ${promptKeyword}: Which component handles layout styling in standard web applications?`,
          options: ['CSS Style Sheets', 'SQL Queries', 'JSON Files', 'C++ Compilers'],
          correctAnswer: 0,
          points: 2,
          difficulty: difficulty,
          topic: currentTopic,
          image: '',
          optionsImages: ['', '', '', ''],
        });
      }

      // 2. True / False
      for (let i = 0; i < tfCount; i++) {
        items.push({
          id: `gq-${idCounter++}`,
          type: 'true-false',
          question: `Generated True/False Question ${i + 1} ${promptKeyword}: JavaScript runs in a single-threaded runtime environment by default.`,
          correctAnswer: 'true',
          points: 1,
          difficulty: difficulty,
          topic: currentTopic,
          image: '',
        });
      }

      // 3. Short Answer
      for (let i = 0; i < saCount; i++) {
        items.push({
          id: `gq-${idCounter++}`,
          type: 'short-answer',
          question: `Generated Short Answer Question ${i + 1} ${promptKeyword}: What does DOM stand for in frontend engineering?`,
          correctAnswer: 'Document Object Model',
          points: 3,
          difficulty: difficulty,
          topic: currentTopic,
          image: '',
        });
      }

      // 4. Essay
      for (let i = 0; i < essayCount; i++) {
        items.push({
          id: `gq-${idCounter++}`,
          type: 'essay',
          question: `Generated Essay Question ${i + 1} ${promptKeyword}: Discuss the architecture of modern single page applications and how state hydration is achieved.`,
          points: 5,
          difficulty: difficulty,
          topic: currentTopic,
          image: '',
        });
      }

      // 5. Extra questions pool
      for (let i = 0; i < extraCount; i++) {
        const types = ['multiple-choice', 'true-false', 'short-answer', 'essay'];
        const chosenType = types[i % types.length];
        
        if (chosenType === 'multiple-choice') {
          items.push({
            id: `gq-${idCounter++}`,
            type: 'multiple-choice',
            question: `Extra Pool Multiple Choice Question ${i + 1} ${promptKeyword}: What protocol is used to fetch web page content securely?`,
            options: ['HTTPS', 'FTP', 'SMTP', 'SSH'],
            correctAnswer: 0,
            points: 2,
            difficulty: difficulty,
            topic: currentTopic,
            image: '',
            optionsImages: ['', '', '', ''],
            isExtra: true,
          });
        } else if (chosenType === 'true-false') {
          items.push({
            id: `gq-${idCounter++}`,
            type: 'true-false',
            question: `Extra Pool True/False Question ${i + 1} ${promptKeyword}: HTML5 supports embedding native video files without Flash plugins.`,
            correctAnswer: 'true',
            points: 1,
            difficulty: difficulty,
            topic: currentTopic,
            image: '',
            isExtra: true,
          });
        } else if (chosenType === 'short-answer') {
          items.push({
            id: `gq-${idCounter++}`,
            type: 'short-answer',
            question: `Extra Pool Short Answer Question ${i + 1} ${promptKeyword}: What CSS flexbox property determines the layout direction of items?`,
            correctAnswer: 'flex-direction',
            points: 3,
            difficulty: difficulty,
            topic: currentTopic,
            image: '',
            isExtra: true,
          });
        } else {
          items.push({
            id: `gq-${idCounter++}`,
            type: 'essay',
            question: `Extra Pool Essay Question ${i + 1} ${promptKeyword}: Elaborate on structural SEO tags and their impacts on search engine crawlers.`,
            points: 5,
            difficulty: difficulty,
            topic: currentTopic,
            image: '',
            isExtra: true,
          });
        }
      }

      setGeneratedQuestions(items);
      setGenerating(false);
    }, 2000);
  };

  // Modify individual question content in editor state
  const handleUpdateQuestionText = (index: number, text: string) => {
    const updated = [...generatedQuestions];
    updated[index].question = text;
    setGeneratedQuestions(updated);
  };

  const handleUpdateQuestionOption = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...generatedQuestions];
    if (updated[qIdx].options) {
      updated[qIdx].options[oIdx] = val;
      setGeneratedQuestions(updated);
    }
  };

  const handleUpdateCorrectAnswer = (index: number, value: any) => {
    const updated = [...generatedQuestions];
    updated[index].correctAnswer = value;
    setGeneratedQuestions(updated);
  };

  const handleUpdatePoints = (index: number, points: number) => {
    const updated = [...generatedQuestions];
    updated[index].points = points;
    setGeneratedQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions(generatedQuestions.filter((_, idx) => idx !== index));
  };

  const handleAddNewQuestion = (type: string) => {
    let newQ: any = {
      id: `gq-new-${Date.now()}`,
      type: type,
      question: `New custom ${type === 'multiple-choice' ? 'Multiple Choice' : type === 'true-false' ? 'True/False' : type === 'short-answer' ? 'Short Answer' : 'Essay'} question: Enter text here...`,
      points: type === 'multiple-choice' ? 2 : type === 'true-false' ? 1 : type === 'short-answer' ? 3 : 5,
      difficulty: 'medium',
      topic: topics[0] || 'Custom Topic',
      image: '',
      isExtra: false,
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

    setGeneratedQuestions([...generatedQuestions, newQ]);
  };

  // Simulate image upload by attaching a random curated image
  const handleAttachMockImage = (qIdx: number, optionIdx?: number) => {
    const randomImg = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
    const updated = [...generatedQuestions];
    if (optionIdx !== undefined) {
      if (!updated[qIdx].optionsImages) {
        updated[qIdx].optionsImages = ['', '', '', ''];
      }
      updated[qIdx].optionsImages[optionIdx] = randomImg;
    } else {
      updated[qIdx].image = randomImg;
    }
    setGeneratedQuestions(updated);
  };

  const handleRemoveImage = (qIdx: number, optionIdx?: number) => {
    const updated = [...generatedQuestions];
    if (optionIdx !== undefined) {
      if (updated[qIdx].optionsImages) {
        updated[qIdx].optionsImages[optionIdx] = '';
      }
    } else {
      updated[qIdx].image = '';
    }
    setGeneratedQuestions(updated);
  };

  // Save the exam template to the Exam Repository
  const handleSaveExam = () => {
    if (!examTitle.trim()) {
      alert('Please enter an exam title.');
      return;
    }

    const examTemplate = {
      id: `se-${Date.now()}`,
      title: examTitle,
      type: assessmentType,
      description: examDescription,
      questions: generatedQuestions,
      activeQuestionCount: activeQuestionCount, // Student takes N questions
      extraQuestionCount: extraCount,           // Drawer has E extra
      totalPoints: totalPoints,                 // Set point cap (e.g. 50)
      duration: duration,
      createdBy: currentUser?.id || 'instructor',
      createdAt: new Date().toISOString(),
    };

    saveExamToRepository(examTemplate);
    alert('Exam template successfully saved in the Exam Repository!');
    navigate('/exam-repository');
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <AutoAwesome sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              AI Exam Generator
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate structured exam pools with randomized question drawers to avoid cheating.
            </Typography>
          </Box>
        </Box>

        {activeStep < 4 && (
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-labelContainer': { display: { xs: 'none', sm: 'block' } } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* Step 1: Exam Details */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Enter Exam Title, Description & General Attributes
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exam Title"
                  placeholder="e.g. Web Development Midterm Exam"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  placeholder="e.g. This exam covers basic syntax, layout engines, and script dynamics."
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                {/* Rule: Total set points count by 10, cannot exceed 100 */}
                <FormControl fullWidth>
                  <InputLabel>Total Points (Multiples of 10, Max 100)</InputLabel>
                  <Select
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    label="Total Points (Multiples of 10, Max 100)"
                  >
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pts) => (
                      <MenuItem key={pts} value={pts}>
                        {pts} Points
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Assessment Type</InputLabel>
                  <Select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value as string)}
                    label="Assessment Type"
                  >
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="exam">Exam</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 2: Upload Materials */}
        {activeStep === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Upload your syllabus, Table of Specifications (TOS), and course readings.
              The AI will read these files to construct syllabus-aligned questions.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Syllabus
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Upload syllabus to anchor scope
                    </Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      fullWidth
                    >
                      Choose PDF/Doc
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e, 'syllabus')}
                      />
                    </Button>
                    {syllabus && (
                      <Chip
                        label={syllabus.name}
                        onDelete={() => setSyllabus(null)}
                        sx={{ mt: 2 }}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Table of Specifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Balanced difficulty criteria (TOS)
                    </Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      fullWidth
                    >
                      Choose Spreadsheet
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx,.xlsx"
                        onChange={(e) => handleFileUpload(e, 'tos')}
                      />
                    </Button>
                    {tos && (
                      <Chip
                        label={tos.name}
                        onDelete={() => setTos(null)}
                        sx={{ mt: 2 }}
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Learning Materials
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Slides, textbooks, or references
                    </Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      fullWidth
                    >
                      Choose Files
                      <input
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={(e) => handleFileUpload(e, 'materials')}
                      />
                    </Button>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                      {materials.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() =>
                            setMaterials(materials.filter((_, i) => i !== index))
                          }
                          size="small"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 3: Configure Generation */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Set Question Distributions, Difficulty, and Anti-Cheat Extra Pools
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>General Difficulty Target</InputLabel>
                  <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    label="General Difficulty Target"
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium (Recommended)</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                    <MenuItem value="mixed">Mixed Distribution</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Tooltip title="How many extra randomized questions to generate. For example, if active exam size is 50, and you generate 30 extra items, the pool is 80. Each student gets 50 randomly pulled from those 80.">
                  <TextField
                    fullWidth
                    label="Extra Items for Random Drawer Pool (Anti-Cheat)"
                    type="number"
                    value={extraCount}
                    onChange={(e) => setExtraCount(Math.max(0, Number(e.target.value)))}
                    helperText="Creates additional sets of items to shuffle and distribute randomly"
                  />
                </Tooltip>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="AI Generation Topic / Prompt"
                  placeholder="Enter specific instructions or topics for the AI (e.g. 'Focus on ES6 features, map/filter/reduce arrays, and asynchronous fetch operations.')"
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  multiline
                  rows={3}
                  helperText="Provide detailed instructions or custom topics to guide the AI's question generation"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                  Set Question Item Quantity by Type:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Multiple Choice"
                      type="number"
                      value={mcCount}
                      onChange={(e) => setMcCount(Math.max(0, Number(e.target.value)))}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="True / False"
                      type="number"
                      value={tfCount}
                      onChange={(e) => setTfCount(Math.max(0, Number(e.target.value)))}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Short Answer"
                      type="number"
                      value={saCount}
                      onChange={(e) => setSaCount(Math.max(0, Number(e.target.value)))}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Essay"
                      type="number"
                      value={essayCount}
                      onChange={(e) => setEssayCount(Math.max(0, Number(e.target.value)))}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f8e9', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#33691e', fontWeight: 'bold' }}>
                    Active Student Items (N): {activeQuestionCount} questions
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                    Total Pool Size (N + E): {totalGeneratedCount} items to generate
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Topics to Target
                </Typography>
                {topics.map((topic, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={topic}
                      onChange={(e) => updateTopic(index, e.target.value)}
                      placeholder="e.g. Object Destructuring, Flexbox Layouts, Closures"
                    />
                    <IconButton onClick={() => removeTopic(index)} color="error" disabled={topics.length === 1}>
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                <Button startIcon={<Add />} onClick={addTopic} size="small" variant="text">
                  Add Target Topic
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 4: Loading or Reviewing and Editing */}
        {activeStep === 3 && (
          <Box>
            {generating ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AutoAwesome
                  sx={{
                    fontSize: 70,
                    color: '#1565c0',
                    mb: 3,
                    animation: 'pulseSpinBlue 3s infinite ease-in-out',
                    '@keyframes pulseSpinBlue': {
                      '0%': { transform: 'rotate(0deg) scale(1)', filter: 'drop-shadow(0 0 0px rgba(21,101,192,0))' },
                      '50%': { transform: 'rotate(180deg) scale(1.2)', filter: 'drop-shadow(0 0 15px rgba(21,101,192,0.5))' },
                      '100%': { transform: 'rotate(360deg) scale(1)', filter: 'drop-shadow(0 0 0px rgba(21,101,192,0))' },
                    }
                  }}
                />
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: '#1e1b4b', letterSpacing: '-0.01em' }}>
                  Constructing Exam Items Pool...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 550, mx: 'auto', px: 2 }}>
                  Analyzing syllabus alignment and generating {totalGeneratedCount} high-fidelity items ({activeQuestionCount} active, {extraCount} extra anti-cheat items).
                </Typography>
                <LinearProgress sx={{ maxWidth: 400, mx: 'auto', height: 6, borderRadius: 3 }} />
              </Box>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Generation complete! Below are all <strong>{generatedQuestions.length} generated items</strong>.
                  You can edit question texts, update choices, change correct answers, delete questions, add new ones, or attach images to make it comprehensive.
                </Alert>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Interactive Pool Editor ({generatedQuestions.length} items total)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Type to Add</InputLabel>
                      <Select
                        value={newQuestionType}
                        label="Type to Add"
                        onChange={(e) => setNewQuestionType(e.target.value as string)}
                      >
                        <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                        <MenuItem value="true-false">True / False</MenuItem>
                        <MenuItem value="short-answer">Short Answer</MenuItem>
                        <MenuItem value="essay">Essay</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Add />} onClick={() => handleAddNewQuestion(newQuestionType)}>
                      Add Question
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                      {isPreviewMode ? 'Switch to Editor' : 'Preview Layout'}
                    </Button>
                  </Box>
                </Box>

                {/* Questions Listing */}
                <Grid container spacing={3}>
                  {generatedQuestions.map((q, qIdx) => {
                    const isQExtra = qIdx >= activeQuestionCount;
                    return (
                      <Grid item xs={12} key={q.id}>
                        <Card variant="outlined" sx={{ border: isQExtra ? '2px dashed #9c27b0' : '1px solid #e0e0e0', position: 'relative' }}>
                          <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isQExtra ? (
                              <Chip label="EXTRA ITEM" color="secondary" size="small" />
                            ) : (
                              <Chip label="ACTIVE STUDENT ITEM" color="primary" size="small" />
                            )}
                            <IconButton color="error" onClick={() => handleDeleteQuestion(qIdx)} size="small">
                              <Delete />
                            </IconButton>
                          </Box>

                          <CardContent>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                #{qIdx + 1}
                              </Typography>
                              <Chip label={q.type.toUpperCase()} size="small" />
                              <Chip label={`${q.points} pts`} size="small" variant="outlined" />
                            </Box>

                            {/* Preview Mode Rendering */}
                            {isPreviewMode ? (
                              <Box>
                                <Typography variant="h6" gutterBottom>
                                  {q.question}
                                </Typography>
                                {q.image && (
                                  <Box sx={{ my: 2 }}>
                                    <img src={q.image} alt="Question Asset" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                                  </Box>
                                )}

                                {/* MC choices */}
                                {q.type === 'multiple-choice' && q.options && (
                                  <Box sx={{ ml: 2 }}>
                                    {q.options.map((opt: string, optIdx: number) => (
                                      <Box key={optIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                                        <Radio checked={q.correctAnswer === optIdx} disabled />
                                        <Typography variant="body2">
                                          {String.fromCharCode(65 + optIdx)}. {opt}
                                        </Typography>
                                        {q.optionsImages?.[optIdx] && (
                                          <img src={q.optionsImages[optIdx]} alt="Option Asset" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginLeft: '10px' }} />
                                        )}
                                        {q.correctAnswer === optIdx && (
                                          <Chip label="Correct" color="success" size="small" variant="outlined" sx={{ height: 20, ml: 1 }} />
                                        )}
                                      </Box>
                                    ))}
                                  </Box>
                                )}

                                {/* TF choices */}
                                {q.type === 'true-false' && (
                                  <Box sx={{ ml: 2, display: 'flex', gap: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: q.correctAnswer === 'true' ? 'bold' : 'normal', color: q.correctAnswer === 'true' ? 'success.main' : 'inherit' }}>
                                        True
                                      </Typography>
                                      {q.correctAnswer === 'true' && <CheckCircle color="success" sx={{ fontSize: 16 }} />}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: q.correctAnswer === 'false' ? 'bold' : 'normal', color: q.correctAnswer === 'false' ? 'success.main' : 'inherit' }}>
                                        False
                                      </Typography>
                                      {q.correctAnswer === 'false' && <CheckCircle color="success" sx={{ fontSize: 16 }} />}
                                    </Box>
                                  </Box>
                                )}

                                {/* Short Answer */}
                                {q.type === 'short-answer' && (
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    Correct Answer: <strong>{q.correctAnswer}</strong>
                                  </Typography>
                                )}

                                {/* Essay */}
                                {q.type === 'essay' && (
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2, fontStyle: 'italic' }}>
                                    (Student will respond in writing)
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              /* Interactive Editor Mode */
                              <Box>
                                <TextField
                                  fullWidth
                                  label="Question Text"
                                  value={q.question}
                                  onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                                  sx={{ mb: 2 }}
                                  multiline
                                  rows={2}
                                />

                                {/* Question Image attachment */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ImageIcon />}
                                    onClick={() => handleAttachMockImage(qIdx)}
                                  >
                                    Attach Question Image
                                  </Button>
                                  {q.image && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <img src={q.image} alt="Thumbnail" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                      <IconButton size="small" color="error" onClick={() => handleRemoveImage(qIdx)}>
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>

                                {/* Multiple choice editor */}
                                {q.type === 'multiple-choice' && q.options && (
                                  <Box sx={{ pl: 2, borderLeft: '3px solid #1976d2', mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                      Configure Options and Key:
                                    </Typography>
                                    <RadioGroup
                                      value={q.correctAnswer}
                                      onChange={(e) => handleUpdateCorrectAnswer(qIdx, Number(e.target.value))}
                                    >
                                      {q.options.map((opt: string, optIdx: number) => (
                                        <Grid container spacing={1} key={optIdx} alignItems="center" sx={{ mb: 1 }}>
                                          <Grid item xs={1}>
                                            <FormControlLabel
                                              value={optIdx}
                                              control={<Radio />}
                                              label={String.fromCharCode(65 + optIdx)}
                                            />
                                          </Grid>
                                          <Grid item xs={7}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              value={opt}
                                              onChange={(e) => handleUpdateQuestionOption(qIdx, optIdx, e.target.value)}
                                            />
                                          </Grid>
                                          <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton size="small" onClick={() => handleAttachMockImage(qIdx, optIdx)} title="Attach option image">
                                              <ImageIcon fontSize="small" />
                                            </IconButton>
                                            {q.optionsImages?.[optIdx] && (
                                              <>
                                                <img src={q.optionsImages[optIdx]} alt="Opt Thumbnail" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                                                <IconButton size="small" color="error" onClick={() => handleRemoveImage(qIdx, optIdx)}>
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

                                {/* True / False Editor */}
                                {q.type === 'true-false' && (
                                  <Box sx={{ pl: 2, borderLeft: '3px solid #2e7d32', mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                      Select Correct Answer:
                                    </Typography>
                                    <RadioGroup
                                      value={q.correctAnswer}
                                      onChange={(e) => handleUpdateCorrectAnswer(qIdx, e.target.value)}
                                      row
                                    >
                                      <FormControlLabel value="true" control={<Radio />} label="True" />
                                      <FormControlLabel value="false" control={<Radio />} label="False" />
                                    </RadioGroup>
                                  </Box>
                                )}

                                {/* Short Answer Editor */}
                                {q.type === 'short-answer' && (
                                  <Box sx={{ mb: 2 }}>
                                    <TextField
                                      fullWidth
                                      label="Expected Correct Answer"
                                      size="small"
                                      value={q.correctAnswer}
                                      onChange={(e) => handleUpdateCorrectAnswer(qIdx, e.target.value)}
                                    />
                                  </Box>
                                )}

                                {/* Points and Difficulty row */}
                                <Grid container spacing={2}>
                                  <Grid item xs={6} md={3}>
                                    <TextField
                                      fullWidth
                                      label="Points for this question"
                                      type="number"
                                      size="small"
                                      value={q.points}
                                      onChange={(e) => handleUpdatePoints(qIdx, Number(e.target.value))}
                                    />
                                  </Grid>
                                </Grid>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Bottom action controls */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<Save />}
                    onClick={handleSaveExam}
                    sx={{ px: 5 }}
                  >
                    Save to Exam Repository
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Navigation Step Button Controls */}
        {activeStep < 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowBack />}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === 0 && !examTitle.trim()}
            >
              {activeStep === 2 ? 'Generate Question Pool' : 'Next'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
