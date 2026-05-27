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
  CardActionArea,
  CircularProgress,
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
  Description as FileIcon,
  Settings,
  MenuBook,
  ListAlt,
  Tune,
  AccessTime,
  SportsScore,
  TrendingUp,
  Assignment,
  FolderZip,
  Topic,
} from '@mui/icons-material';

const steps = ['Exam Details & Configuration', 'Summary Checklist', 'Review & Generate'];

// Preloaded mock images for simulated select
const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80', // Laptop / Code
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80', // Charts / Work
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80', // Database / Schema
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&q=80', // AI neural net
];

// Database of smart context-aware question alternatives for premium regeneration feedback
const ALTERNATIVE_QUESTIONS: Record<string, any[]> = {
  'multiple-choice': [
    {
      question: 'Which of the following describes the difference between block elements and inline elements in CSS?',
      options: [
        'Block elements start on a new line and take up full width; inline elements do not.',
        'Inline elements can contain block elements, but block elements cannot.',
        'Block elements ignore padding-top and padding-bottom properties completely.',
        'Inline elements are styled using flex container alignment properties only.'
      ],
      correctAnswer: 0,
      points: 2,
    },
    {
      question: 'What is the primary purpose of the React `useEffect` clean-up function?',
      options: [
        'To prevent memory leaks by unsubscribing from event listeners and clearing active timers.',
        'To force the component to re-render immediately with updated state values.',
        'To erase local storage context cache before rendering child nodes.',
        'To validate structural interfaces during static compilation evaluation.'
      ],
      correctAnswer: 0,
      points: 2,
    },
    {
      question: 'Which HTTP status code represents a successful resource creation on a REST server?',
      options: [
        '201 Created',
        '200 OK',
        '204 No Content',
        '302 Found'
      ],
      correctAnswer: 0,
      points: 2,
    },
    {
      question: 'In SQL databases, which statement is used to remove a table structure entirely including its schemas?',
      options: [
        'DROP TABLE table_name;',
        'DELETE TABLE table_name;',
        'TRUNCATE TABLE table_name;',
        'REMOVE TABLE table_name;'
      ],
      correctAnswer: 0,
      points: 2,
    }
  ],
  'true-false': [
    {
      question: 'True or False: In JavaScript, standard array structures can hold multiple data types concurrently.',
      correctAnswer: 'true',
      points: 1,
    },
    {
      question: 'True or False: The CSS grid container flex-basis determines the default aspect-ratio of images.',
      correctAnswer: 'false',
      points: 1,
    },
    {
      question: 'True or False: A standard React component will re-render anytime its parent component re-renders.',
      correctAnswer: 'true',
      points: 1,
    },
    {
      question: 'True or False: TypeScript types are compiled and strictly validated at client-side browser runtime.',
      correctAnswer: 'false',
      points: 1,
    }
  ],
  'short-answer': [
    {
      question: 'What command in Git is used to record project changes in the repository history log?',
      correctAnswer: 'git commit',
      points: 3,
    },
    {
      question: 'What is the standard name of the API method used to fetch data over networks in modern browsers?',
      correctAnswer: 'fetch',
      points: 3,
    },
    {
      question: 'What React hook is used to access the context values stored inside a ContextProvider?',
      correctAnswer: 'useContext',
      points: 3,
    },
    {
      question: 'What markup syntax standard is used by React components to render nested templates?',
      correctAnswer: 'JSX',
      points: 3,
    }
  ],
  'essay': [
    {
      question: 'Discuss the concept of asynchronous execution in JavaScript. Contrast the benefits of using async/await syntax over traditional callbacks or raw promises.',
      points: 5,
    },
    {
      question: 'Elaborate on the structural benefits of using semantic HTML elements over non-semantic divs and spans for modern SEO and web accessibility guidelines.',
      points: 5,
    },
    {
      question: 'Analyze the trade-offs between Client-Side Rendering (CSR) and Server-Side Rendering (SSR) in modern web applications. Highlight their impacts on page-load performance.',
      points: 5,
    }
  ]
};

export default function ExamGenerator() {
  const { classroomId } = useParams();
  const { currentUser, saveExamToRepository } = useAuth();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [regeneratingMap, setRegeneratingMap] = useState<Record<string, boolean>>({});

  // Details
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [totalPoints, setTotalPoints] = useState(50); // Default 50. Limit: count by 10 up to 100.
  const [assessmentType, setAssessmentType] = useState('Midterm Exam'); // 'Midterm Exam', 'Final Exam', 'Other'
  const [customAssessmentType, setCustomAssessmentType] = useState('');

  // Uploads
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [materials, setMaterials] = useState<File[]>([]);
  const [tos, setTos] = useState<File | null>(null);

  // Question Type Allocations
  const [mcCount, setMcCount] = useState(5);
  const [tfCount, setTfCount] = useState(5);
  const [saCount, setSaCount] = useState(0);
  const [essayCount, setEssayCount] = useState(0);
  const [extraCount, setExtraCount] = useState(5); // Extra questions pool size (e.g. 5 extra)
  const [difficulty, setDifficulty] = useState('medium');
  const [topics, setTopics] = useState<string[]>(['General Subject Matter']);
  const [generationPrompt, setGenerationPrompt] = useState('Write an exam covering fundamental web development technologies including HTML5, CSS layout engines, and basic JavaScript dynamics.');

  // Generated list of N + E items
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState('multiple-choice');

  const activeQuestionCount = mcCount + tfCount + saCount + essayCount;
  const totalGeneratedCount = activeQuestionCount + extraCount;

  const handleNext = () => {
    if (activeStep === 1) {
      // Transitioning from Summary step (index 1) to Review & Generate (index 2)
      generateMockQuestions();
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 2) {
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

  // Smart AI Regeneration simulated feature
  const handleRegenerateItem = (index: number, mode: 'full' | 'options' | 'answer') => {
    const q = generatedQuestions[index];
    setRegeneratingMap((prev) => ({ ...prev, [q.id]: true }));

    setTimeout(() => {
      setGeneratedQuestions((prevQuestions) => {
        const updated = [...prevQuestions];
        const currentQ = updated[index];
        const type = currentQ.type;

        if (mode === 'full') {
          // Get lists of alternatives
          const list = ALTERNATIVE_QUESTIONS[type] || [];
          // Pick one that is different from current if possible
          let chosen = list[Math.floor(Math.random() * list.length)];
          if (chosen.question === currentQ.question && list.length > 1) {
            const filtered = list.filter(item => item.question !== currentQ.question);
            chosen = filtered[Math.floor(Math.random() * filtered.length)];
          }
          
          updated[index] = {
            ...currentQ,
            question: chosen.question,
            options: chosen.options ? [...chosen.options] : undefined,
            correctAnswer: chosen.correctAnswer,
            points: chosen.points || currentQ.points,
          };
        } else if (mode === 'options') {
          if (type === 'multiple-choice' && currentQ.options) {
            const originalOptions = [...currentQ.options];
            const correctText = originalOptions[currentQ.correctAnswer];
            
            // Fisher-Yates shuffle
            for (let i = originalOptions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
            }
            
            const newCorrectIdx = originalOptions.indexOf(correctText);
            updated[index] = {
              ...currentQ,
              options: originalOptions,
              correctAnswer: newCorrectIdx >= 0 ? newCorrectIdx : 0,
            };
          } else if (type === 'true-false') {
            const nextAnswer = currentQ.correctAnswer === 'true' ? 'false' : 'true';
            let newText = currentQ.question;
            if (nextAnswer === 'false') {
              if (!newText.includes(' NOT ') && !newText.includes(' not ')) {
                newText = newText.replace('runs in', 'does NOT run in')
                                .replace('supports', 'does NOT support')
                                .replace('is a', 'is NOT a');
              }
            } else {
              newText = newText.replace('does NOT run in', 'runs in')
                              .replace('does NOT support', 'supports')
                              .replace('is NOT a', 'is a');
            }
            updated[index] = {
              ...currentQ,
              question: newText,
              correctAnswer: nextAnswer,
            };
          }
        } else if (mode === 'answer') {
          if (type === 'multiple-choice' && currentQ.options) {
            const newIndex = (currentQ.correctAnswer + 1) % currentQ.options.length;
            updated[index] = {
              ...currentQ,
              correctAnswer: newIndex,
            };
          } else if (type === 'true-false') {
            const nextAnswer = currentQ.correctAnswer === 'true' ? 'false' : 'true';
            let newText = currentQ.question;
            if (nextAnswer === 'false') {
              newText = newText.replace('runs in', 'does NOT run in')
                              .replace('supports', 'does NOT support')
                              .replace('is a', 'is NOT a');
            } else {
              newText = newText.replace('does NOT run in', 'runs in')
                              .replace('does NOT support', 'supports')
                              .replace('is NOT a', 'is a');
            }
            updated[index] = {
              ...currentQ,
              question: newText,
              correctAnswer: nextAnswer,
            };
          } else if (type === 'short-answer') {
            const alternatives: Record<string, string> = {
              'let': 'const',
              'const': 'let',
              'fetch': 'axios',
              'axios': 'fetch',
              'git commit': 'git push',
              'git push': 'git commit',
              'JSX': 'TSX',
              'TSX': 'JSX',
              'Document Object Model': 'DOM',
              'flex-direction': 'justify-content',
              'flexbox': 'grid'
            };
            const currentAns = currentQ.correctAnswer;
            const nextAns = alternatives[currentAns] || 'API Endpoint';
            let newText = currentQ.question;
            if (nextAns === 'const') {
              newText = newText.replace('reassigned', 'reassigned (immutable reference)');
            }
            updated[index] = {
              ...currentQ,
              question: newText,
              correctAnswer: nextAns,
            };
          }
        }

        return updated;
      });

      setRegeneratingMap((prev) => ({ ...prev, [q.id]: false }));
    }, 1500);
  };

  // Save the exam template to the Exam Repository
  const handleSaveExam = () => {
    if (!examTitle.trim()) {
      alert('Please enter an exam title.');
      return;
    }

    const savedType = assessmentType === 'Other' ? (customAssessmentType || 'Custom Assessment') : assessmentType;

    const examTemplate = {
      id: `se-${Date.now()}`,
      title: examTitle,
      type: savedType,
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
        sx={{
          mb: 3,
          fontWeight: 700,
          borderRadius: 2,
          textTransform: 'none',
          color: 'text.secondary',
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        Back to Dashboard
      </Button>

      {/* Modern High-End Banner */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 4,
        p: { xs: 3, md: 4 },
        mb: 4,
        color: 'white',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px -10px rgba(15,23,42,0.3)'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
        }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
          <Box sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            bgcolor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 3,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}>
            <AutoAwesome sx={{ fontSize: 32, color: '#818cf8' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.025em', mb: 0.5, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
              AI Exam Generator
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 500 }}>
              Design syllabus-aligned, high-fidelity exam pools with custom randomized question drawers.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-labelContainer': { display: { xs: 'none', sm: 'block' } } }}>
                <Typography variant="body2" fontWeight={700}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Exam Details & Configuration (Unified Step) */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* Section 1.1: Basic Information */}
            <Card variant="outlined" sx={{ borderRadius: 3, p: 1, borderColor: '#e2e8f0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <ListAlt color="primary" />
                  <Typography variant="h6" fontWeight="bold">1. Basic Exam Details</Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Exam Title"
                      placeholder="e.g. Web Development Mechanics - Midterm Assessment"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      required
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      placeholder="Provide basic instructions or descriptions for the students..."
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      multiline
                      rows={3}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Duration (Minutes)"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Total Points Cap</InputLabel>
                      <Select
                        value={totalPoints}
                        onChange={(e) => setTotalPoints(Number(e.target.value))}
                        label="Total Points Cap"
                        sx={{ borderRadius: 2 }}
                      >
                        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pts) => (
                          <MenuItem key={pts} value={pts}>
                            {pts} Points
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Redesigned Assessment Selection Cards */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                      Assessment Classification
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { title: 'Midterm Exam', desc: 'Official mid-semester benchmark assessment.' },
                        { title: 'Final Exam', desc: 'End-of-semester comprehensive assessment.' },
                        { title: 'Other', desc: 'Create custom quizzes, unit tests, or assessments.' }
                      ].map((option) => {
                        const isSelected = assessmentType === option.title;
                        return (
                          <Grid item xs={12} md={4} key={option.title}>
                            <Card
                              variant="outlined"
                              sx={{
                                borderRadius: 3,
                                border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                bgcolor: isSelected ? 'rgba(99, 102, 241, 0.03)' : 'inherit',
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: isSelected ? '#6366f1' : '#cbd5e1' }
                              }}
                            >
                              <CardActionArea onClick={() => setAssessmentType(option.title)} sx={{ p: 2, height: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {option.title}
                                  </Typography>
                                  <Radio checked={isSelected} size="small" color="primary" />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {option.desc}
                                </Typography>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                    
                    {/* Custom Assessment Input */}
                    {assessmentType === 'Other' && (
                      <Box sx={{ mt: 2, animation: 'fadeIn 0.3s ease' }}>
                        <TextField
                          fullWidth
                          label="Custom Assessment Type Name"
                          placeholder="e.g. Unit Test 3, Dynamic Quiz 2"
                          value={customAssessmentType}
                          onChange={(e) => setCustomAssessmentType(e.target.value)}
                          required
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Section 1.2: Syllabus & Alignment Materials */}
            <Card variant="outlined" sx={{ borderRadius: 3, p: 1, borderColor: '#e2e8f0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <MenuBook color="primary" />
                  <Typography variant="h6" fontWeight="bold">2. Syllabus & Alignment Materials</Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  Attach your Table of Specifications (TOS), course syllabus, or lesson slides. The AI models align generated question difficulty directly with your uploads.
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        borderStyle: 'dashed',
                        borderColor: syllabus ? 'primary.main' : '#cbd5e1',
                        bgcolor: syllabus ? 'rgba(99, 102, 241, 0.01)' : 'inherit',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <FileIcon color={syllabus ? 'primary' : 'disabled'} sx={{ fontSize: 32, mb: 1.5 }} />
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Syllabus</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>PDF, DOC, DOCX files</Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        startIcon={<Upload />}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Choose File
                        <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'syllabus')} />
                      </Button>
                      {syllabus && (
                        <Chip
                          label={syllabus.name}
                          onDelete={() => setSyllabus(null)}
                          sx={{ mt: 2, maxW: '90%' }}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        borderStyle: 'dashed',
                        borderColor: tos ? 'secondary.main' : '#cbd5e1',
                        bgcolor: tos ? 'rgba(156, 39, 176, 0.01)' : 'inherit',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <FileIcon color={tos ? 'secondary' : 'disabled'} sx={{ fontSize: 32, mb: 1.5 }} />
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Table of Specifications</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Spreadsheet, PDF, DOCX</Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        color="secondary"
                        startIcon={<Upload />}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Choose File
                        <input type="file" hidden accept=".pdf,.doc,.docx,.xlsx" onChange={(e) => handleFileUpload(e, 'tos')} />
                      </Button>
                      {tos && (
                        <Chip
                          label={tos.name}
                          onDelete={() => setTos(null)}
                          sx={{ mt: 2, maxW: '90%' }}
                          color="secondary"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: 3,
                        borderStyle: 'dashed',
                        borderColor: materials.length > 0 ? 'success.main' : '#cbd5e1',
                        bgcolor: materials.length > 0 ? 'rgba(46, 125, 50, 0.01)' : 'inherit',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <FileIcon color={materials.length > 0 ? 'success' : 'disabled'} sx={{ fontSize: 32, mb: 1.5 }} />
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Learning Materials</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Course slides, readings, scripts</Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        color="success"
                        startIcon={<Upload />}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Add Slide/Files
                        <input type="file" hidden multiple accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => handleFileUpload(e, 'materials')} />
                      </Button>
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                        {materials.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            onDelete={() => setMaterials(materials.filter((_, i) => i !== index))}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Section 1.3: Smart AI Parameters */}
            <Card variant="outlined" sx={{ borderRadius: 3, p: 1, borderColor: '#e2e8f0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Tune color="primary" />
                  <Typography variant="h6" fontWeight="bold">3. Smart AI Generator Configuration</Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Difficulty Strategy</InputLabel>
                      <Select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        label="Difficulty Strategy"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="easy">Easy (Knowledge checks)</MenuItem>
                        <MenuItem value="medium">Medium (Application target)</MenuItem>
                        <MenuItem value="hard">Hard (Synthesis / Critical evaluating)</MenuItem>
                        <MenuItem value="mixed">Mixed Distribution (TOS proportional)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Tooltip title="Generates an additional pool of randomized items. Instructors shuffle these to prevent cheating; each student receives a randomized selection from the pool.">
                      <TextField
                        fullWidth
                        label="Extra Shuffled Items Pool (Anti-Cheat)"
                        type="number"
                        value={extraCount}
                        onChange={(e) => setExtraCount(Math.max(0, Number(e.target.value)))}
                        helperText="Creates extra alternative items to distribute randomly"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Tooltip>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="AI Core Prompt Instructions"
                      placeholder="Add specific instructions: e.g. 'Concentrate on ES6 arrays, layout differences in flexbox, and semantic HTML accessibility'"
                      value={generationPrompt}
                      onChange={(e) => setGenerationPrompt(e.target.value)}
                      multiline
                      rows={3}
                      helperText="Provides context and themes for the questions generated."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 2 }}>
                      Quantity Distributions (Set quantities by Question Type)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <TextField
                          fullWidth
                          label="Multiple Choice"
                          type="number"
                          value={mcCount}
                          onChange={(e) => setMcCount(Math.max(0, Number(e.target.value)))}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField
                          fullWidth
                          label="True / False"
                          type="number"
                          value={tfCount}
                          onChange={(e) => setTfCount(Math.max(0, Number(e.target.value)))}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField
                          fullWidth
                          label="Short Answer"
                          type="number"
                          value={saCount}
                          onChange={(e) => setSaCount(Math.max(0, Number(e.target.value)))}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField
                          fullWidth
                          label="Essay / Long Response"
                          type="number"
                          value={essayCount}
                          onChange={(e) => setEssayCount(Math.max(0, Number(e.target.value)))}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2.5, p: 2, bgcolor: '#f0fdf4', borderRadius: 2.5, display: 'flex', justifyContent: 'space-between', border: '1px solid #dcfce7' }}>
                      <Typography variant="body2" sx={{ color: '#166534', fontWeight: 'bold' }}>
                        Active Items (N): {activeQuestionCount}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 'bold' }}>
                        Total Pool Size (N + E): {totalGeneratedCount} items
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1 }}>
                      Topics to Highlight
                    </Typography>
                    {topics.map((topic, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={topic}
                          onChange={(e) => updateTopic(index, e.target.value)}
                          placeholder="e.g. Asynchronous execution, Closures, DOM Manipulation"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <IconButton onClick={() => removeTopic(index)} color="error" disabled={topics.length === 1}>
                          <Delete />
                        </IconButton>
                      </Box>
                    ))}
                    <Button startIcon={<Add />} onClick={addTopic} size="small" sx={{ fontWeight: 700 }}>
                      Add Alignment Topic
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Step 2: Summary checklist & Verification (Unified Step) */}
        {activeStep === 1 && (
          <Box sx={{ animation: 'fadeIn 0.3s ease' }}>
            <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircle color="success" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>Verify Assessment Blueprint</Typography>
                <Typography variant="body2" color="text.secondary">Carefully review your configurations and files before the AI generates your question bank.</Typography>
              </Box>
            </Box>

            <Grid container spacing={4}>
              {/* Left Column: Config Profile */}
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  
                  {/* Summary Profile */}
                  <Card variant="outlined" sx={{ borderRadius: 4, borderColor: '#cbd5e1', borderLeft: '6px solid #2563eb', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                    <CardContent sx={{ p: 3.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Assignment color="primary" sx={{ fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.05em' }}>
                          EXAM PROFILE DETAILS
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={900} gutterBottom sx={{ letterSpacing: '-0.025em', color: '#1e293b' }}>
                        {examTitle || '(No title entered)'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, fontStyle: examDescription ? 'normal' : 'italic' }}>
                        {examDescription || 'No description provided.'}
                      </Typography>

                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Assignment sx={{ color: '#2563eb', fontSize: 22 }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.1 }}>TYPE</Typography>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e293b' }}>
                                {assessmentType === 'Other' ? (customAssessmentType || 'Custom') : assessmentType}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <AccessTime sx={{ color: '#6366f1', fontSize: 22 }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.1 }}>DURATION</Typography>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e293b' }}>{duration} mins</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <SportsScore sx={{ color: '#d97706', fontSize: 22 }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.1 }}>CAP LIMIT</Typography>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e293b' }}>{totalPoints} pts</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <TrendingUp sx={{ color: '#059669', fontSize: 22 }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.1 }}>DIFFICULTY</Typography>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e293b', textTransform: 'capitalize' }}>
                                {difficulty}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Summary Files */}
                  <Card variant="outlined" sx={{ borderRadius: 4, borderColor: '#cbd5e1', borderLeft: '6px solid #7c3aed', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                    <CardContent sx={{ p: 3.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <FolderZip color="secondary" sx={{ fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main', letterSpacing: '0.05em' }}>
                          ALIGNED CURRICULUM SOURCES
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileIcon color="primary" sx={{ fontSize: 18 }} />
                            <Typography variant="body2" fontWeight="bold" color="#334155">Syllabus Outline</Typography>
                          </Box>
                          {syllabus ? <Chip label={syllabus.name} color="primary" size="small" variant="outlined" sx={{ fontWeight: 700 }} /> : <Typography variant="caption" color="text.secondary">None attached</Typography>}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileIcon color="secondary" sx={{ fontSize: 18 }} />
                            <Typography variant="body2" fontWeight="bold" color="#334155">Table of Specifications (TOS)</Typography>
                          </Box>
                          {tos ? <Chip label={tos.name} color="secondary" size="small" variant="outlined" sx={{ fontWeight: 700 }} /> : <Typography variant="caption" color="text.secondary">None attached</Typography>}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileIcon color="success" sx={{ fontSize: 18 }} />
                            <Typography variant="body2" fontWeight="bold" color="#334155">Learning materials</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {materials.length > 0 ? `${materials.length} slides / readings` : 'None attached'}
                          </Typography>
                        </Box>
                        {materials.length > 0 && (
                          <Box sx={{ pl: 3, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {materials.map((m, i) => <Chip key={i} label={m.name} size="small" variant="outlined" />)}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Summary Topics */}
                  <Card variant="outlined" sx={{ borderRadius: 4, borderColor: '#cbd5e1', borderLeft: '6px solid #0891b2', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                    <CardContent sx={{ p: 3.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Topic sx={{ color: '#0891b2', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0891b2', letterSpacing: '0.05em' }}>
                          OUTCOME ALIGNMENT (TOPICS)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                        {topics.filter(t => t.trim() !== '').map((t, i) => (
                          <Chip key={i} label={t} color="info" variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }} />
                        ))}
                        {topics.filter(t => t.trim() !== '').length === 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>No custom outline topics provided.</Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                </Box>
              </Grid>

              {/* Sidebar Matrix Manifest (Upgraded Design) */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ borderRadius: 4, borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.01)', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Indigo Mini Header Banner */}
                  <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', p: 3, color: 'white', textAlign: 'center' }}>
                    <AutoAwesome sx={{ fontSize: 28, mb: 1, color: '#e0e7ff' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.08em' }}>
                      AI BLUEPRINT MANIFEST
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 3.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2, mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Multiple Choice:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="#1e293b">{mcCount} items</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>True / False:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="#1e293b">{tfCount} items</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Short Answer:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="#1e293b">{saCount} items</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Essay:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="#1e293b">{essayCount} items</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>Active Selected (N):</Typography>
                          <Typography variant="body2" fontWeight="black" color="primary.main">{activeQuestionCount} Questions</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Anti-Cheat Drawer (E):</Typography>
                          <Typography variant="body2" fontWeight="bold" color="#1e293b">{extraCount} Questions</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.8, bgcolor: 'rgba(99, 102, 241, 0.05)', borderRadius: 3, border: '1px solid rgba(99,102,241,0.1)' }}>
                          <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">Total Pool Size:</Typography>
                          <Typography variant="subtitle2" fontWeight="black" color="primary.dark">{totalGeneratedCount} Questions</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 3: Loading or Reviewing and Editing */}
        {activeStep === 2 && (
          <Box sx={{ animation: 'fadeIn 0.3s ease' }}>
            {generating ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AutoAwesome
                  sx={{
                    fontSize: 70,
                    color: '#6366f1',
                    mb: 3,
                    animation: 'pulseSpinBlue 3s infinite ease-in-out',
                    '@keyframes pulseSpinBlue': {
                      '0%': { transform: 'rotate(0deg) scale(1)', filter: 'drop-shadow(0 0 0px rgba(99,102,241,0))' },
                      '50%': { transform: 'rotate(180deg) scale(1.15)', filter: 'drop-shadow(0 0 15px rgba(99,102,241,0.4))' },
                      '100%': { transform: 'rotate(360deg) scale(1)', filter: 'drop-shadow(0 0 0px rgba(99,102,241,0))' },
                    }
                  }}
                />
                <Typography variant="h5" gutterBottom fontWeight="black" sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Constructing Exam Items Pool...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto', px: 2 }}>
                  Analyzing source files and building {totalGeneratedCount} high-fidelity items ({activeQuestionCount} active drawer items, {extraCount} extra anti-cheat items).
                </Typography>
                <LinearProgress sx={{ maxWidth: 400, mx: 'auto', height: 6, borderRadius: 3 }} />
              </Box>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 3.5, borderRadius: 3, border: '1px solid #bcf0da' }}>
                  Generation complete! Below are all <strong>{generatedQuestions.length} generated items</strong>.
                  You can edit texts, alter point structures, delete items, append custom entries, or invoke **Smart AI Regeneration** to fine-tune specific items.
                </Alert>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Interactive Pool Editor ({generatedQuestions.length} items total)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Type to Add</InputLabel>
                      <Select
                        value={newQuestionType}
                        label="Type to Add"
                        onChange={(e) => setNewQuestionType(e.target.value as string)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                        <MenuItem value="true-false">True / False</MenuItem>
                        <MenuItem value="short-answer">Short Answer</MenuItem>
                        <MenuItem value="essay">Essay</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="outlined" startIcon={<Add />} onClick={() => handleAddNewQuestion(newQuestionType)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                      Add Question
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {isPreviewMode ? 'Switch to Editor' : 'Preview Layout'}
                    </Button>
                  </Box>
                </Box>

                {/* Strictly Vertical Layout Questions Listing */}
                <Grid container spacing={4.5}>
                  {generatedQuestions.map((q, qIdx) => {
                    const isQExtra = q.isExtra || qIdx >= activeQuestionCount;
                    const isQRegenerating = !!regeneratingMap[q.id];

                    return (
                      <Grid item xs={12} key={q.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            border: isQExtra ? '2px dashed #9c27b0' : '1px solid #e2e8f0',
                            borderRadius: 4.5,
                            position: 'relative',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
                            '&:hover': { boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }
                          }}
                        >
                          {/* Smart AI Regenerating Card Glass Overlay */}
                          {isQRegenerating && (
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              bgcolor: 'rgba(255, 255, 255, 0.85)',
                              backdropFilter: 'blur(3px)',
                              zIndex: 10,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 4.5
                            }}>
                              <CircularProgress size={44} thickness={4} sx={{ color: '#6366f1', mb: 2 }} />
                              <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">
                                AI is drafting alternative variations...
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isQExtra ? (
                              <Chip label="EXTRA POOL ITEM" color="secondary" size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                            ) : (
                              <Chip label="ACTIVE STUDENT ITEM" color="primary" size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                            )}
                            <IconButton color="error" onClick={() => handleDeleteQuestion(qIdx)} size="small" title="Delete Question">
                              <Delete />
                            </IconButton>
                          </Box>

                          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2.5 }}>
                              <Typography variant="subtitle2" color="text.secondary" fontWeight="black" sx={{ fontSize: '1.05rem', color: 'primary.main' }}>
                                #{qIdx + 1}
                              </Typography>
                              <Chip label={q.type.toUpperCase()} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                              <Chip label={`${q.points} pts`} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                              {q.topic && <Chip label={q.topic} size="small" variant="outlined" color="info" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />}
                            </Box>

                            {/* Preview Mode Rendering */}
                            {isPreviewMode ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', pr: 14 }}>
                                  {q.question}
                                </Typography>
                                {q.image && (
                                  <Box sx={{ my: 1, display: 'flex' }}>
                                    <img src={q.image} alt="Question Asset" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                                  </Box>
                                )}

                                {/* MC choices */}
                                {q.type === 'multiple-choice' && q.options && (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 1 }}>
                                    {q.options.map((opt: string, optIdx: number) => (
                                      <Box key={optIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Radio checked={q.correctAnswer === optIdx} disabled size="small" />
                                        <Typography variant="body2" sx={{ fontWeight: q.correctAnswer === optIdx ? 'bold' : 'normal' }}>
                                          <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                                        </Typography>
                                        {q.optionsImages?.[optIdx] && (
                                          <img src={q.optionsImages[optIdx]} alt="Option Asset" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                                        )}
                                        {q.correctAnswer === optIdx && (
                                          <Chip label="Correct Answer Key" color="success" size="small" variant="outlined" sx={{ height: 20, fontWeight: 700, fontSize: '0.6rem' }} />
                                        )}
                                      </Box>
                                    ))}
                                  </Box>
                                )}

                                {/* TF choices */}
                                {q.type === 'true-false' && (
                                  <Box sx={{ pl: 1, display: 'flex', gap: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: q.correctAnswer === 'true' ? 'bold' : 'normal', color: q.correctAnswer === 'true' ? 'success.main' : 'inherit' }}>
                                        True
                                      </Typography>
                                      {q.correctAnswer === 'true' && <CheckCircle color="success" sx={{ fontSize: 18 }} />}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: q.correctAnswer === 'false' ? 'bold' : 'normal', color: q.correctAnswer === 'false' ? 'success.main' : 'inherit' }}>
                                        False
                                      </Typography>
                                      {q.correctAnswer === 'false' && <CheckCircle color="success" sx={{ fontSize: 18 }} />}
                                    </Box>
                                  </Box>
                                )}

                                {/* Short Answer */}
                                {q.type === 'short-answer' && (
                                  <Typography variant="body2" sx={{ pl: 1 }}>
                                    Expected Correct Answer Key: <strong style={{ color: '#16a34a' }}>{q.correctAnswer}</strong>
                                  </Typography>
                                )}

                                {/* Essay */}
                                {q.type === 'essay' && (
                                  <Typography variant="body2" color="text.secondary" sx={{ pl: 1, fontStyle: 'italic' }}>
                                    (Instructor will grade manually. Student is provided a multi-line input workspace)
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              /* STACKED VERTICAL EDITOR MODE */
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                                
                                {/* Question Text (Full Width) */}
                                <TextField
                                  fullWidth
                                  label="Question Text"
                                  value={q.question}
                                  onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                                  multiline
                                  rows={2.5}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />

                                {/* Question Image Attachment (Vertical Stack) */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ImageIcon />}
                                    onClick={() => handleAttachMockImage(qIdx)}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
                                  >
                                    Attach Question Image asset
                                  </Button>
                                  {q.image && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                                      <img src={q.image} alt="Thumbnail" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} />
                                      <Typography variant="caption" color="text.secondary">Question Asset Active</Typography>
                                      <IconButton size="small" color="error" onClick={() => handleRemoveImage(qIdx)}>
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>

                                {/* Multiple choice editor (Strictly Vertical option stacking) */}
                                {q.type === 'multiple-choice' && q.options && (
                                  <Box sx={{ pl: { xs: 1.5, md: 3 }, borderLeft: '4px solid #6366f1', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155' }}>
                                      Configure Multiple Choice Keys and Options
                                    </Typography>
                                    
                                    {q.options.map((opt: string, optIdx: number) => {
                                      const isCorrectOpt = q.correctAnswer === optIdx;
                                      return (
                                        <Box key={optIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                                          
                                          {/* Key Selection Indicator Header */}
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Radio
                                              checked={isCorrectOpt}
                                              value={optIdx}
                                              onChange={() => handleUpdateCorrectAnswer(qIdx, optIdx)}
                                              size="small"
                                            />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isCorrectOpt ? 'success.main' : 'text.secondary' }}>
                                              Option {String.fromCharCode(65 + optIdx)} {isCorrectOpt && '(Marked as Correct Answer Key)'}
                                            </Typography>
                                          </Box>

                                          {/* Option text (Full Width) */}
                                          <TextField
                                            fullWidth
                                            size="small"
                                            value={opt}
                                            onChange={(e) => handleUpdateQuestionOption(qIdx, optIdx, e.target.value)}
                                            placeholder={`Enter content statement for Option ${String.fromCharCode(65 + optIdx)}`}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                          />

                                          {/* Option Image uploads (Vertical placement under option text) */}
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                                            <Button
                                              variant="text"
                                              size="small"
                                              startIcon={<ImageIcon />}
                                              onClick={() => handleAttachMockImage(qIdx, optIdx)}
                                              sx={{ fontSize: '0.75rem', py: 0.5 }}
                                            >
                                              Attach Option Image
                                            </Button>
                                            {q.optionsImages?.[optIdx] && (
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, border: '1px solid #f1f5f9', borderRadius: 1.5 }}>
                                                <img src={q.optionsImages[optIdx]} alt="Opt Thumbnail" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                                                <IconButton size="small" color="error" onClick={() => handleRemoveImage(qIdx, optIdx)}>
                                                  <Delete fontSize="small" />
                                                </IconButton>
                                              </Box>
                                            )}
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                )}

                                {/* True / False Editor (Spaced vertically) */}
                                {q.type === 'true-false' && (
                                  <Box sx={{ pl: 3, borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155' }}>
                                      Configure True/False Correct Key
                                    </Typography>
                                    <RadioGroup
                                      value={q.correctAnswer}
                                      onChange={(e) => handleUpdateCorrectAnswer(qIdx, e.target.value)}
                                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                                    >
                                      <FormControlLabel value="true" control={<Radio />} label="True (Statement is factual)" />
                                      <FormControlLabel value="false" control={<Radio />} label="False (Statement is incorrect)" />
                                    </RadioGroup>
                                  </Box>
                                )}

                                {/* Short Answer Editor */}
                                {q.type === 'short-answer' && (
                                  <Box sx={{ pl: 3, borderLeft: '4px solid #f59e0b' }}>
                                    <TextField
                                      fullWidth
                                      label="Expected Correct Answer Statement"
                                      size="small"
                                      value={q.correctAnswer}
                                      onChange={(e) => handleUpdateCorrectAnswer(qIdx, e.target.value)}
                                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                  </Box>
                                )}

                                {/* Item Point & Difficulty Stacked Vertically */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>Item Settings & Weight</Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <TextField
                                        fullWidth
                                        label="Points assigned"
                                        type="number"
                                        size="small"
                                        value={q.points}
                                        onChange={(e) => handleUpdatePoints(qIdx, Number(e.target.value))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Difficulty Tier</InputLabel>
                                        <Select
                                          value={q.difficulty || 'medium'}
                                          label="Difficulty Tier"
                                          onChange={(e) => {
                                            const updated = [...generatedQuestions];
                                            updated[qIdx].difficulty = e.target.value;
                                            setGeneratedQuestions(updated);
                                          }}
                                          sx={{ borderRadius: 2 }}
                                        >
                                          <MenuItem value="easy">Easy</MenuItem>
                                          <MenuItem value="medium">Medium</MenuItem>
                                          <MenuItem value="hard">Hard</MenuItem>
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                  </Grid>
                                </Box>

                                {/* Smart AI Regeneration Tool Box */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1, p: 2, border: '1px solid #e0e7ff', bgcolor: 'rgba(99, 102, 241, 0.01)', borderRadius: 3 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AutoAwesome color="primary" sx={{ fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                                      SMART AI REGENERATION TOOLS
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<AutoAwesome />}
                                      onClick={() => handleRegenerateItem(qIdx, 'full')}
                                      sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                                    >
                                      Regenerate Full Question
                                    </Button>
                                    {q.type === 'multiple-choice' && (
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        color="secondary"
                                        startIcon={<AutoAwesome />}
                                        onClick={() => handleRegenerateItem(qIdx, 'options')}
                                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                                      >
                                        Regenerate Options Only
                                      </Button>
                                    )}
                                    {q.type !== 'essay' && (
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        color="warning"
                                        startIcon={<AutoAwesome />}
                                        onClick={() => handleRegenerateItem(qIdx, 'answer')}
                                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                                      >
                                        Regenerate Answer Key
                                      </Button>
                                    )}
                                  </Box>
                                </Box>

                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Bottom save action control */}
                <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<Save />}
                    onClick={handleSaveExam}
                    sx={{
                      px: 6,
                      py: 1.8,
                      borderRadius: 3.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(46, 125, 50, 0.2)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(46, 125, 50, 0.3)',
                      }
                    }}
                  >
                    Save Template to Repository
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Navigation Step Button Controls */}
        {activeStep < 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 2, borderTop: '1px solid #f1f5f9' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === 0 && !examTitle.trim()}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 3,
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
              }}
            >
              {activeStep === 1 ? 'Generate Question Pool' : 'Next'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
