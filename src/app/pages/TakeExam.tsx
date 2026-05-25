import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
} from '@mui/material';
import { Timer, Warning, CheckCircle, Image as ImageIcon } from '@mui/icons-material';

// Shuffler utility
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TakeExam() {
  const { examId } = useParams();
  const { currentUser, exams, examAttempts, submitExamAttempt } = useAuth();
  const navigate = useNavigate();

  const exam = exams.find((e) => e.id === examId);
  
  // Find or initialize attempt state
  const [attempt, setAttempt] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [preparedAttempt, setPreparedAttempt] = useState<any | null>(null);

  // Initialize randomized subset or load existing attempt
  useEffect(() => {
    if (!exam || !currentUser) return;

    // Look for existing active attempt
    const existing = examAttempts.find(
      (a) => a.examId === exam.id && a.studentId === currentUser.id
    );

    if (existing) {
      setAttempt(existing);
      setAnswers(existing.answers || {});
      setHasStarted(true);
      
      // Calculate remaining time
      const start = new Date(existing.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const totalSec = exam.duration * 60;
      const remaining = Math.max(0, totalSec - elapsed);
      setTimeRemaining(remaining);
      
      if (existing.submittedAt) {
        setSubmitted(true);
      }
    } else {
      // Create a brand new randomized exam subset
      const N = exam.activeQuestionCount || exam.questions.length;
      const pool = exam.questions;
      
      // Randomly select N questions from N+E pool
      const shuffledPool = shuffleArray(pool);
      const selectedQuestions = shuffledPool.slice(0, Math.min(N, pool.length));

      // For each selected question, shuffle the options and adjust correctAnswer
      const finalizedQuestions = selectedQuestions.map((q: any) => {
        if (q.type === 'multiple-choice' && q.options) {
          // Shuffle options, keeping track of where the correct one went
          const originalCorrectIdx = q.correctAnswer;
          const originalCorrectValue = q.options[originalCorrectIdx];
          
          // Zip options, images, and track original index
          const zipped = q.options.map((opt: string, idx: number) => ({
            text: opt,
            img: q.optionsImages?.[idx] || '',
            isCorrect: idx === originalCorrectIdx,
          }));

          const shuffledZipped = shuffleArray(zipped);

          const newOptions = shuffledZipped.map(z => z.text);
          const newOptionsImages = shuffledZipped.map(z => z.img);
          const newCorrectIdx = shuffledZipped.findIndex(z => z.isCorrect);

          return {
            ...q,
            options: newOptions,
            optionsImages: newOptionsImages,
            correctAnswer: newCorrectIdx,
            // Keep a track of original key for verification if needed
            originalCorrectText: originalCorrectValue,
          };
        }
        return q;
      });

      const newAttempt = {
        id: `attempt-${Date.now()}`,
        examId: exam.id,
        studentId: currentUser.id,
        answers: {},
        questions: finalizedQuestions,
      };

      setPreparedAttempt(newAttempt);
    }
  }, [exam, currentUser, examAttempts]);

  const handleStartExam = () => {
    if (preparedAttempt) {
      const attemptToStart = {
        ...preparedAttempt,
        startedAt: new Date().toISOString()
      };
      submitExamAttempt(attemptToStart);
      setAttempt(attemptToStart);
      setTimeRemaining(exam.duration * 60);
      setHasStarted(true);
    }
  };

  // Timer loop
  useEffect(() => {
    if (!hasStarted || submitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  if (!exam || (!attempt && !preparedAttempt)) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading assessment environment...</Typography>
      </Container>
    );
  }

  if (!hasStarted) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {exam.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {exam.description || 'Please read the instructions carefully before starting the assessment.'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, my: 4 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">{exam.duration} Mins</Typography>
              <Typography variant="body2" color="text.secondary">Time Limit</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="h6" fontWeight="bold">{exam.activeQuestionCount || exam.questions.length}</Typography>
              <Typography variant="body2" color="text.secondary">Questions</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="h6" fontWeight="bold">{exam.passingScore || 0}%</Typography>
              <Typography variant="body2" color="text.secondary">Passing Score</Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
            Once you start the assessment, the timer will begin. Do not refresh or leave the page.
          </Alert>

          <Button 
            variant="contained" 
            size="large" 
            onClick={handleStartExam}
            sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
          >
            Start Assessment
          </Button>
        </Paper>
      </Container>
    );
  }

  const activeQuestions = attempt.questions || [];
  const question = activeQuestions[currentQuestionIdx];
  
  if (!question) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>No active questions found in your drawer.</Typography>
      </Container>
    );
  }

  const progress = ((currentQuestionIdx + 1) / activeQuestions.length) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const handleAnswerChange = (value: any) => {
    const updatedAnswers = { ...answers, [question.id]: value };
    setAnswers(updatedAnswers);

    // Save state back to local storage context
    const updatedAttempt = {
      ...attempt,
      answers: updatedAnswers,
    };
    submitExamAttempt(updatedAttempt);
  };

  const handleNext = () => {
    if (currentQuestionIdx < activeQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setOpenSubmitDialog(false);

    // Auto-grader: Calculate score based on answers
    let score = 0;
    activeQuestions.forEach((q: any) => {
      const studentAnswer = answers[q.id];
      if (q.type === 'multiple-choice') {
        if (studentAnswer === q.correctAnswer) {
          score += q.points;
        }
      } else if (q.type === 'true-false') {
        if (String(studentAnswer).toLowerCase() === String(q.correctAnswer).toLowerCase()) {
          score += q.points;
        }
      } else if (q.type === 'short-answer') {
        if (
          String(studentAnswer).trim().toLowerCase() ===
          String(q.correctAnswer).trim().toLowerCase()
        ) {
          score += q.points;
        }
      } else {
        // Essay gets full marks by default in simulator or random grade (say 80% credit)
        score += Math.round(q.points * 0.8);
      }
    });

    const finalizedAttempt = {
      ...attempt,
      answers,
      score,
      submittedAt: new Date().toISOString(),
    };

    submitExamAttempt(finalizedAttempt);

    setTimeout(() => {
      navigate(`/exam/${examId}/results`);
    }, 1500);
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = activeQuestions.length - answeredCount;

  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 6, borderRadius: 3 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Assessment Submitted Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your scores have been logged into the classroom gradebook. Redirecting to breakdown...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {exam.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestionIdx + 1} of {activeQuestions.length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timer color={timeRemaining < 300 ? 'error' : 'primary'} />
              <Typography
                variant="h6"
                fontWeight="bold"
                color={timeRemaining < 300 ? 'error' : 'primary'}
              >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Time Remaining
            </Typography>
          </Box>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />
      </Paper>

      {timeRemaining < 300 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          Less than 5 minutes remaining!
        </Alert>
      )}

      <Paper sx={{ p: 4, mb: 2, borderRadius: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Chip label={`Question ${currentQuestionIdx + 1}`} color="primary" sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {question.question}
          </Typography>
          
          {/* Main Question Image */}
          {question.image && (
            <Box sx={{ my: 2 }}>
              <img
                src={question.image}
                alt="Question diagram"
                style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px' }}
              />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary">
            Value: {question.points} {question.points === 1 ? 'point' : 'points'}
          </Typography>
        </Box>

        {/* Multiple choice selections */}
        {question.type === 'multiple-choice' && question.options && (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answers[question.id] ?? ''}
              onChange={(e) => handleAnswerChange(Number(e.target.value))}
            >
              {question.options.map((option: string, index: number) => {
                const isSelected = answers[question.id] === index;
                return (
                  <FormControlLabel
                    key={index}
                    value={index}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontWeight: isSelected ? 600 : 400 }}>
                          {String.fromCharCode(65 + index)}. {option}
                        </Typography>
                        {question.optionsImages?.[index] && (
                          <img
                            src={question.optionsImages[index]}
                            alt={`Option ${index}`}
                            style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                      </Box>
                    }
                    sx={{
                      border: isSelected ? '2px solid #1565c0' : '1px solid #e2e8f0',
                      bgcolor: isSelected ? '#f0f7ff' : 'transparent',
                      borderRadius: 2,
                      mb: 1.5,
                      mr: 0,
                      p: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isSelected ? '#e0f0ff' : '#f8fafc',
                        borderColor: isSelected ? '#1565c0' : '#cbd5e1',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      },
                    }}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        )}

        {/* True / False selections */}
        {question.type === 'true-false' && (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answers[question.id] ?? ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
            >
              {['true', 'false'].map((val) => {
                const isSelected = String(answers[question.id]) === val;
                return (
                  <FormControlLabel
                    key={val}
                    value={val}
                    control={<Radio />}
                    label={val === 'true' ? 'True' : 'False'}
                    sx={{
                      border: isSelected ? '2px solid #1565c0' : '1px solid #e2e8f0',
                      bgcolor: isSelected ? '#f0f7ff' : 'transparent',
                      borderRadius: 2,
                      mb: 1.5,
                      mr: 0,
                      p: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isSelected ? '#e0f0ff' : '#f8fafc',
                        borderColor: isSelected ? '#1565c0' : '#cbd5e1',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      },
                    }}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        )}

        {/* Short Answer and Essay input */}
        {(question.type === 'short-answer' || question.type === 'essay') && (
          <TextField
            fullWidth
            multiline
            rows={question.type === 'essay' ? 8 : 3}
            value={answers[question.id] ?? ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            variant="outlined"
          />
        )}
      </Paper>

      {/* Button controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentQuestionIdx === 0}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`Answered: ${answeredCount}`} color="success" />
          {unansweredCount > 0 && (
            <Chip label={`Unanswered: ${unansweredCount}`} color="warning" />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {currentQuestionIdx < activeQuestions.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={() => setOpenSubmitDialog(true)}
            >
              Submit Exam
            </Button>
          )}
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={openSubmitDialog} onClose={() => setOpenSubmitDialog(false)}>
        <DialogTitle>Submit Exam?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to submit your exam?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Answered questions: {answeredCount} / {activeQuestions.length}
            </Typography>
            {unansweredCount > 0 && (
              <Typography variant="body2" color="warning.main">
                Warning: You have {unansweredCount} unanswered question(s)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubmitDialog(false)}>Continue Exam</Button>
          <Button onClick={handleSubmit} variant="contained" color="success">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
