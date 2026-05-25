import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Container, Paper, Typography, Box, Button, Grid, Card, CardContent,
  CardActions, Chip, LinearProgress, Alert, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Radio, RadioGroup,
  FormControlLabel, FormControl, Divider,
} from '@mui/material';
import {
  ArrowBack, AutoAwesome, PlayArrow, Delete, School, CheckCircle,
  Lock, MenuBook, Quiz as QuizIcon, EmojiEvents, Replay, ArrowForward,
  Cancel,
} from '@mui/icons-material';

const PASS_THRESHOLD = 0.8; // 80%

type Phase = 'list' | 'modules' | 'lesson' | 'quiz' | 'result';

export default function Reviewer() {
  const { reviewers, deleteReviewer, updateReviewer } = useAuth();
  const navigate = useNavigate();

  // ── Repository state ──────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Session state ─────────────────────────
  const [activeReviewer, setActiveReviewer] = useState<any | null>(null);
  const [moduleIdx, setModuleIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('list');

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);

  const filteredReviewers = reviewers.filter((r) =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Open a reviewer session ───────────────
  const openReviewer = (rev: any) => {
    setActiveReviewer(rev);
    setPhase('modules');
    setAnswers({});
    setQuizScore(null);
    setShowExplanations(false);
  };

  // ── Start quiz for current module ─────────
  const startQuiz = () => {
    setAnswers({});
    setQuizScore(null);
    setShowExplanations(false);
    setPhase('quiz');
  };

  // ── Submit quiz ───────────────────────────
  const submitQuiz = () => {
    const module = activeReviewer.modules[moduleIdx];
    const questions = module.questions;
    let correct = 0;

    questions.forEach((q: any) => {
      const ans = answers[q.id];
      if (q.type === 'true-false') {
        if (String(ans).toLowerCase() === String(q.correctAnswer).toLowerCase()) correct++;
      } else if (q.type === 'multiple-choice') {
        if (ans === q.correctAnswer) correct++;
      } else if (q.type === 'identification') {
        // Flexible match: student answer contains the key answer or vice versa
        const studentAns = String(ans || '').toLowerCase().trim();
        const keyAns = String(q.correctAnswer).toLowerCase().trim();
        if (studentAns && (studentAns.includes(keyAns) || keyAns.includes(studentAns))) correct++;
      }
    });

    const score = correct;
    const total = questions.length;
    const passed = score / total >= PASS_THRESHOLD;
    setQuizScore(score);
    setShowExplanations(true);

    // Update module progress
    const updatedModules = activeReviewer.modules.map((m: any, i: number) => {
      if (i === moduleIdx) {
        return {
          ...m,
          attempts: (m.attempts || 0) + 1,
          bestScore: m.bestScore === null ? score : Math.max(m.bestScore, score),
          status: passed ? 'passed' : m.status,
        };
      }
      // Unlock next module if current passed
      if (passed && i === moduleIdx + 1 && m.status === 'locked') {
        return { ...m, status: 'unlocked' };
      }
      return m;
    });

    const allPassed = updatedModules.every((m: any) => m.status === 'passed');
    const nextUnpassed = updatedModules.findIndex((m: any, i: number) => i > moduleIdx && m.status !== 'passed');

    const updatedReviewer = {
      ...activeReviewer,
      modules: updatedModules,
      currentModuleIndex: passed ? Math.min(moduleIdx + 1, updatedModules.length - 1) : moduleIdx,
      status: allPassed ? 'completed' : 'in-progress',
      ...(allPassed && { completedAt: new Date().toISOString() }),
    };

    setActiveReviewer(updatedReviewer);
    updateReviewer(updatedReviewer);
    setPhase('result');
  };

  const goToNextModule = () => {
    const next = moduleIdx + 1;
    if (next < activeReviewer.modules.length) {
      setModuleIdx(next);
      setAnswers({});
      setQuizScore(null);
      setShowExplanations(false);
      setPhase('lesson');
    }
  };

  const retryQuiz = () => {
    setAnswers({});
    setQuizScore(null);
    setShowExplanations(false);
    setPhase('lesson');
  };

  const exitModuleSession = () => {
    setAnswers({});
    setQuizScore(null);
    setShowExplanations(false);
    setPhase('modules');
  };

  const exitSession = () => {
    setActiveReviewer(null);
    setPhase('list');
    setAnswers({});
    setQuizScore(null);
    setShowExplanations(false);
  };

  const handleBack = () => {
    if (phase === 'modules') {
      exitSession();
    } else {
      exitModuleSession();
    }
  };

  const currentModule = activeReviewer?.modules?.[moduleIdx];
  const totalModules = activeReviewer?.modules?.length ?? 0;
  const passedCount = activeReviewer?.modules?.filter((m: any) => m.status === 'passed').length ?? 0;
  const totalQ = currentModule?.questions?.length ?? 0;
  const passRequired = Math.ceil(totalQ * PASS_THRESHOLD);

  const diffColor: Record<string, any> = {
    easy:   { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
    normal: { bg: '#fef9c3', color: '#ca8a04', border: '#fde047' },
    hard:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  };

  // ══════════════════════════════════════════
  // REPOSITORY LIST VIEW
  // ══════════════════════════════════════════
  if (phase === 'list') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ mb: 3 }}>
          Back to Dashboard
        </Button>

        {/* Header */}
        <Paper sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 30px rgba(3,105,161,0.12)' }}>
          <Box sx={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', p: { xs: 3, md: 4 }, color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 3, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <School sx={{ fontSize: 30 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ letterSpacing: '-0.01em' }}>My AI Reviewers</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    Complete all modules and pass each quiz to finish a reviewer.
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => navigate('/reviewer-generator')}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Generate New Reviewer
              </Button>
            </Box>
          </Box>
          <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f0f9ff', borderTop: '1px solid rgba(3,105,161,0.1)' }}>
            <TextField
              fullWidth placeholder="Search reviewers by title or subject..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              size="small" sx={{ bgcolor: 'white', borderRadius: 2 }}
            />
          </Box>
        </Paper>

        {filteredReviewers.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(3,105,161,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <School sx={{ fontSize: 40, color: '#0369a1' }} />
            </Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>No reviewers yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Generate your first AI reviewer to start studying with structured modules and quizzes.
            </Typography>
            <Button variant="contained" color="primary" startIcon={<AutoAwesome />} onClick={() => navigate('/reviewer-generator')}>
              Create Reviewer
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredReviewers.map((rev) => {
              const mods = rev.modules || [];
              const passed = mods.filter((m: any) => m.status === 'passed').length;
              const total = mods.length;
              const pct = total > 0 ? (passed / total) * 100 : 0;
              const isCompleted = rev.status === 'completed';
              const dc = diffColor[rev.difficulty] || diffColor.normal;

              return (
                <Grid item xs={12} md={6} key={rev.id}>
                  <Card sx={{
                    height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3,
                    border: isCompleted ? '1.5px solid #86efac' : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: isCompleted ? '0 4px 20px rgba(22,163,74,0.1)' : '0 4px 16px rgba(0,0,0,0.05)',
                    transition: 'all 0.25s ease',
                    '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.10)', transform: 'translateY(-3px)' },
                  }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flexGrow: 1, pr: 1, minWidth: 0 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3 }}>{rev.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {rev.subject}
                          </Typography>
                        </Box>
                        <Tooltip title="Delete reviewer">
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(rev.id)} sx={{ flexShrink: 0, mt: -0.5 }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          size="small" label={rev.difficulty?.toUpperCase() || 'NORMAL'}
                          sx={{ bgcolor: dc.bg, color: dc.color, border: `1px solid ${dc.border}`, fontWeight: 700, fontSize: '0.7rem' }}
                        />
                        <Chip size="small" label={`${total} Modules`} variant="outlined" />
                        <Chip size="small" label={`${rev.itemsPerModule} items/module`} variant="outlined" />
                        {isCompleted && <Chip size="small" label="Completed" icon={<CheckCircle />} color="success" />}
                      </Box>

                      {/* Progress bar */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Progress</Typography>
                          <Typography variant="caption" color="text.secondary">{passed}/{total} modules passed</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate" value={pct}
                          sx={{ height: 7, borderRadius: 4, bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': { background: isCompleted ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #0369a1, #0ea5e9)' } }}
                        />
                      </Box>

                      {rev.source && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Source: {rev.source}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block">
                        Created {new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant={isCompleted ? 'outlined' : 'contained'} fullWidth
                        startIcon={isCompleted ? <EmojiEvents /> : <PlayArrow />}
                        onClick={() => openReviewer(rev)}
                        sx={!isCompleted ? { background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', fontWeight: 'bold' } : { fontWeight: 'bold', color: '#16a34a', borderColor: '#16a34a' }}
                      >
                        {isCompleted ? 'Review Again' : passed > 0 ? 'Continue' : 'Start'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Delete Dialog */}
        <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="xs" fullWidth>
          <DialogTitle fontWeight="bold">Delete Reviewer?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This will permanently remove this reviewer and all your progress. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={() => { if (deleteConfirmId) { deleteReviewer(deleteConfirmId); setDeleteConfirmId(null); } }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // ══════════════════════════════════════════
  // MODULES LIST VIEW
  // ══════════════════════════════════════════
  if (phase === 'modules') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={exitSession} sx={{ mb: 3 }}>
          Back to Reviewer List
        </Button>

        {/* Reviewer Header */}
        <Paper sx={{ mb: 4, borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 30px rgba(3,105,161,0.12)' }}>
          <Box sx={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', p: { xs: 3, md: 4 }, color: 'white' }}>
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: '0.1em' }}>AI STUDY REVIEWER</Typography>
            <Typography variant="h4" fontWeight="bold" gutterBottom>{activeReviewer?.title}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Subject: {activeReviewer?.subject} &bull; Difficulty: {activeReviewer?.difficulty?.toUpperCase()}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
              Created {new Date(activeReviewer?.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>

        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
          Modules
        </Typography>

        <Grid container spacing={2}>
          {activeReviewer?.modules?.map((m: any, idx: number) => {
            const isLocked = m.status === 'locked';
            const isPassed = m.status === 'passed';
            const isUnlocked = m.status === 'unlocked';
            const dc = diffColor[activeReviewer.difficulty] || diffColor.normal;

            return (
              <Grid item xs={12} key={m.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: isLocked ? 'rgba(0,0,0,0.06)' : isPassed ? 'success.light' : 'primary.light',
                    bgcolor: isLocked ? '#f8fafc' : isPassed ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.2s ease',
                    cursor: isLocked ? 'default' : 'pointer',
                    '&:hover': !isLocked ? {
                      borderColor: isPassed ? 'success.main' : 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transform: 'translateY(-1px)',
                    } : {},
                  }}
                  onClick={() => {
                    if (!isLocked) {
                      setModuleIdx(idx);
                      setAnswers({});
                      setQuizScore(null);
                      setShowExplanations(false);
                      setPhase('lesson');
                    }
                  }}
                >
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' }, 
                    p: '20px !important',
                    gap: { xs: 2, sm: 0 }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: isLocked ? '#cbd5e1' : isPassed ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#0369a1,#0ea5e9)',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', mr: 2.5, flexShrink: 0
                      }}>
                        {isPassed ? <CheckCircle sx={{ fontSize: 20 }} /> : isLocked ? <Lock sx={{ fontSize: 18 }} /> : idx + 1}
                      </Box>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight="bold" color={isLocked ? 'text.secondary' : 'text.primary'} sx={{ fontSize: '1rem', mb: 0.5 }}>
                          {m.title || `Module ${idx + 1}: ${m.topic}`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Chip
                            size="small"
                            label={isPassed ? 'Passed' : isLocked ? 'Locked' : 'Available'}
                            color={isPassed ? 'success' : isLocked ? 'default' : 'primary'}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                          {m.bestScore !== null && (
                            <Typography variant="caption" color="text.secondary">
                              Best Score: {m.bestScore} / {m.questions.length}
                            </Typography>
                          )}
                          {m.attempts > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Attempts: {m.attempts}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {!isLocked && (
                      <Button
                        variant={isPassed ? 'outlined' : 'contained'}
                        color={isPassed ? 'success' : 'primary'}
                        size="small"
                        sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 }, flexShrink: 0, fontWeight: 'bold', width: { xs: '100%', sm: 'auto' } }}
                      >
                        {isPassed ? 'Review' : 'Start'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    );
  }

  // ══════════════════════════════════════════
  // SESSION VIEWS (lesson / quiz / result)
  // ══════════════════════════════════════════
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Session top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={exitModuleSession}>
          Back to Modules
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={`${passedCount}/${totalModules} Modules Passed`}
            color={passedCount === totalModules ? 'success' : 'default'}
            icon={passedCount === totalModules ? <EmojiEvents /> : undefined}
          />
          <Chip
            label={activeReviewer?.difficulty?.toUpperCase() || 'NORMAL'}
            size="small"
            sx={{ ...(diffColor[activeReviewer?.difficulty] ? { bgcolor: diffColor[activeReviewer.difficulty].bg, color: diffColor[activeReviewer.difficulty].color } : {}) }}
          />
        </Box>
      </Box>

      {/* Module progress strip */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          {activeReviewer?.title} — Module Progress
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {activeReviewer?.modules?.map((m: any, i: number) => (
            <Box
              key={m.id}
              sx={{
                width: 36, height: 36, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background:
                  m.status === 'passed' ? 'linear-gradient(135deg,#16a34a,#22c55e)' :
                  i === moduleIdx ? 'linear-gradient(135deg,#0369a1,#0ea5e9)' :
                  m.status === 'unlocked' ? '#f1f5f9' : '#e2e8f0',
                color: m.status === 'passed' || i === moduleIdx ? 'white' : m.status === 'unlocked' ? '#475569' : '#94a3b8',
                fontWeight: 700, fontSize: '0.8rem',
                border: i === moduleIdx ? '2px solid #0369a1' : '2px solid transparent',
                transition: 'all 0.2s ease',
                cursor: m.status !== 'locked' ? 'pointer' : 'default',
              }}
              title={m.title}
              onClick={() => {
                if (m.status !== 'locked') {
                  setModuleIdx(i);
                  setAnswers({});
                  setQuizScore(null);
                  setShowExplanations(false);
                  setPhase('lesson');
                }
              }}
            >
              {m.status === 'passed' ? <CheckCircle sx={{ fontSize: 18 }} /> :
               m.status === 'locked' ? <Lock sx={{ fontSize: 16 }} /> : i + 1}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ── LESSON PHASE ──────────────────────── */}
      {phase === 'lesson' && currentModule && (
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          {/* Module header */}
          <Box sx={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', p: 3, color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MenuBook sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.8, lineHeight: 1 }}>Lesson Material</Typography>
                <Typography variant="h6" fontWeight="bold">{currentModule.title}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Lesson content */}
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            {currentModule.lessonContent.split('\n').map((line: string, i: number) => {
              const trimmed = line.trim();
              if (!trimmed) return <Box key={i} sx={{ mb: 1 }} />;
              if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
                return <Typography key={i} variant="h6" fontWeight="bold" sx={{ mt: 2, mb: 1, color: '#1e3a8a' }}>{trimmed.slice(2, -2)}</Typography>;
              }
              if (trimmed === '---') return <Divider key={i} sx={{ my: 2 }} />;
              if (trimmed.startsWith('•')) {
                return (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.75, pl: 1 }}>
                    <Typography variant="body2" color="primary" sx={{ mt: 0.25, flexShrink: 0 }}>•</Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: trimmed.slice(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
                    />
                  </Box>
                );
              }
              return (
                <Typography key={i} variant="body1" sx={{ mb: 1.2, lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
                />
              );
            })}

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Alert severity="info" sx={{ flexGrow: 1, borderRadius: 2 }}>
                <strong>Quiz requirement:</strong> Score at least {Math.round(PASS_THRESHOLD * 100)}% ({passRequired}/{totalQ} correct) to advance.
              </Alert>
              <Button
                variant="contained" startIcon={<QuizIcon />} size="large"
                onClick={startQuiz}
                sx={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', fontWeight: 'bold', flexShrink: 0, px: 3 }}
              >
                Start Quiz
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── QUIZ PHASE ────────────────────────── */}
      {phase === 'quiz' && currentModule && (
        <Box>
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography fontWeight="bold">{currentModule.title} — Quiz</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {Object.keys(answers).length} / {totalQ} answered • Pass: {passRequired}/{totalQ} ({Math.round(PASS_THRESHOLD * 100)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(Object.keys(answers).length / totalQ) * 100}
              sx={{ mt: 1.5, height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
            />
          </Paper>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {currentModule.questions.map((q: any, idx: number) => (
              <Paper key={q.id} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                  <Box sx={{
                    minWidth: 30, height: 30, borderRadius: 2, flexShrink: 0, mt: 0.25,
                    background: answers[q.id] !== undefined ? 'linear-gradient(135deg,#1e3a8a,#3b82f6)' : '#f1f5f9',
                    color: answers[q.id] !== undefined ? 'white' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem',
                  }}>
                    {idx + 1}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Chip
                      size="small" label={q.type === 'true-false' ? 'True / False' : q.type === 'multiple-choice' ? 'Multiple Choice' : 'Identification'}
                      sx={{ mb: 1, bgcolor: q.type === 'identification' ? '#fef3c7' : '#eff6ff', color: q.type === 'identification' ? '#92400e' : '#1e40af', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                    <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.5 }}>{q.question}</Typography>
                  </Box>
                </Box>

                {/* True/False */}
                {q.type === 'true-false' && (
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    >
                      {['true', 'false'].map((val) => (
                        <FormControlLabel
                          key={val} value={val}
                          control={<Radio size="small" />}
                          label={<Typography sx={{ fontWeight: answers[q.id] === val ? 700 : 400 }}>{val === 'true' ? 'True' : 'False'}</Typography>}
                          sx={{
                            mb: 1, p: 1.5, borderRadius: 2, mr: 0,
                            border: answers[q.id] === val ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            bgcolor: answers[q.id] === val ? '#eff6ff' : 'transparent',
                            transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {/* Multiple Choice */}
                {q.type === 'multiple-choice' && q.options && (
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: Number(e.target.value) })}
                    >
                      {q.options.map((opt: string, i: number) => (
                        <FormControlLabel
                          key={i} value={i}
                          control={<Radio size="small" />}
                          label={<Typography sx={{ fontWeight: answers[q.id] === i ? 700 : 400 }}>{String.fromCharCode(65 + i)}. {opt}</Typography>}
                          sx={{
                            mb: 1, p: 1.5, borderRadius: 2, mr: 0,
                            border: answers[q.id] === i ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            bgcolor: answers[q.id] === i ? '#eff6ff' : 'transparent',
                            transition: 'all 0.15s ease',
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {/* Identification */}
                {q.type === 'identification' && (
                  <TextField
                    fullWidth variant="outlined" size="small"
                    placeholder="Type your answer here..."
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              </Paper>
            ))}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="outlined" onClick={() => setPhase('lesson')} startIcon={<ArrowBack />}>
              Back to Lesson
            </Button>
            <Button
              variant="contained" size="large"
              onClick={submitQuiz}
              disabled={Object.keys(answers).length === 0}
              sx={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', fontWeight: 'bold', px: 4 }}
            >
              Submit Quiz ({Object.keys(answers).length}/{totalQ} answered)
            </Button>
          </Box>
        </Box>
      )}

      {/* ── RESULT PHASE ──────────────────────── */}
      {phase === 'result' && quizScore !== null && currentModule && (() => {
        const passed = quizScore / totalQ >= PASS_THRESHOLD;
        const pct = Math.round((quizScore / totalQ) * 100);
        const isLastModule = moduleIdx >= totalModules - 1;
        const allDone = activeReviewer?.status === 'completed';

        return (
          <Box>
            {/* Score card */}
            <Paper sx={{
              p: 4, mb: 3, borderRadius: 4, textAlign: 'center',
              background: passed
                ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
                : 'linear-gradient(135deg, #7c2d12 0%, #ef4444 100%)',
              color: 'white',
              boxShadow: passed ? '0 12px 32px rgba(6,95,70,0.25)' : '0 12px 32px rgba(124,45,18,0.25)',
            }}>
              {passed ? <EmojiEvents sx={{ fontSize: 64, mb: 1 }} /> : <Cancel sx={{ fontSize: 64, mb: 1 }} />}
              <Typography variant="h4" fontWeight="bold">{passed ? 'Module Passed!' : 'Not Passed'}</Typography>
              <Typography variant="h2" fontWeight="bold" sx={{ my: 1 }}>{pct}%</Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {quizScore} / {totalQ} correct &bull; Needed: {passRequired}/{totalQ} ({Math.round(PASS_THRESHOLD * 100)}%)
              </Typography>
              {allDone && (
                <Chip label="🎉 Reviewer Completed!" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 'bold', fontSize: '1rem', height: 36 }} />
              )}
            </Paper>

            {/* Per-question breakdown */}
            {showExplanations && (
              <Paper sx={{ p: 3, mb: 3, borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Answer Review</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {currentModule.questions.map((q: any, i: number) => {
                    const ans = answers[q.id];
                    let isCorrect = false;
                    if (q.type === 'true-false') isCorrect = String(ans).toLowerCase() === String(q.correctAnswer).toLowerCase();
                    else if (q.type === 'multiple-choice') isCorrect = ans === q.correctAnswer;
                    else if (q.type === 'identification') {
                      const sa = String(ans || '').toLowerCase().trim();
                      const ka = String(q.correctAnswer).toLowerCase().trim();
                      isCorrect = sa.length > 0 && (sa.includes(ka) || ka.includes(sa));
                    }
                    return (
                      <Box key={q.id} sx={{ p: 2, borderRadius: 2.5, border: `1.5px solid ${isCorrect ? '#86efac' : '#fca5a5'}`, bgcolor: isCorrect ? '#f0fdf4' : '#fff5f5' }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                          {isCorrect ? <CheckCircle sx={{ color: '#16a34a', mt: 0.25, flexShrink: 0 }} /> : <Cancel sx={{ color: '#dc2626', mt: 0.25, flexShrink: 0 }} />}
                          <Typography variant="body2" fontWeight={600}>{i + 1}. {q.question}</Typography>
                        </Box>
                        <Typography variant="caption" color={isCorrect ? 'success.main' : 'error.main'} display="block" sx={{ ml: 3.5 }}>
                          Your answer: {q.type === 'multiple-choice' && q.options ? `${String.fromCharCode(65 + (ans ?? 0))}. ${q.options[ans]}` : String(ans ?? '(no answer)')}
                        </Typography>
                        {!isCorrect && (
                          <Typography variant="caption" color="success.main" display="block" sx={{ ml: 3.5 }}>
                            Correct: {q.type === 'multiple-choice' && q.options ? `${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}` : String(q.correctAnswer)}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 3.5, mt: 0.5, fontStyle: 'italic' }}>
                          {q.explanation}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            )}

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="outlined" startIcon={<Replay />} onClick={retryQuiz}>
                {passed ? 'Review Lesson' : 'Retry Quiz'}
              </Button>
              {passed && !isLastModule && (
                <Button
                  variant="contained" endIcon={<ArrowForward />} onClick={goToNextModule}
                  sx={{ background: 'linear-gradient(135deg, #065f46, #10b981)', fontWeight: 'bold' }}
                >
                  Next Module
                </Button>
              )}
              {(allDone || (passed && isLastModule)) && (
                <Button
                  variant="contained" startIcon={<EmojiEvents />} onClick={exitModuleSession}
                  sx={{ background: 'linear-gradient(135deg, #065f46, #10b981)', fontWeight: 'bold' }}
                >
                  Finish — Back to Modules
                </Button>
              )}
              {!passed && (
                <Button variant="outlined" onClick={exitModuleSession}>
                  Save Progress & Exit
                </Button>
              )}
            </Box>
          </Box>
        );
      })()}
    </Container>
  );
}
