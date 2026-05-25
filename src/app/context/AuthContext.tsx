import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { mockUsers, mockClassrooms, mockExams, mockQuestionBank, mockExamAttempts } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchAccount: (userId: string) => void;
  isAuthenticated: boolean;
  
  // Custom reactive localStorage state
  classrooms: any[];
  exams: any[];
  savedExams: any[];
  examAttempts: any[];
  reviewers: any[];
  classroomMaterials: Record<string, any[]>; // classroomId -> materials[]
  
  // Mutators
  addClassroom: (classroom: any) => void;
  joinClassroom: (classCode: string, studentId: string) => boolean;
  saveExamToRepository: (exam: any) => void;
  assignExamToClassroom: (examId: string, classroomId: string, postDate: string, dueDate: string) => void;
  submitExamAttempt: (attempt: any) => void;
  saveReviewer: (reviewer: any) => void;
  deleteReviewer: (reviewerId: string) => void;
  updateReviewer: (reviewer: any) => void;
  updateExamInRepository: (exam: any) => void;
  deleteExamFromRepository: (examId: string) => void;
  addClassroomMaterial: (classroomId: string, material: any) => void;
  deleteClassroomMaterial: (classroomId: string, materialId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem('currentUserId');
    if (savedId) {
      return mockUsers.find((u) => u.id === savedId) || null;
    }
    return null;
  });

  // Local storage state initialization
  const [classrooms, setClassrooms] = useState<any[]>(() => {
    const stored = localStorage.getItem('classrooms');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    localStorage.setItem('classrooms', JSON.stringify(mockClassrooms));
    return mockClassrooms;
  });

  const [exams, setExams] = useState<any[]>(() => {
    const stored = localStorage.getItem('exams');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Revive date objects if any
        return parsed.map((e: any) => ({
          ...e,
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
          dueDate: e.dueDate ? new Date(e.dueDate) : undefined,
          postDate: e.postDate ? new Date(e.postDate) : undefined,
        }));
      } catch (e) {
        // Fallback
      }
    }
    localStorage.setItem('exams', JSON.stringify(mockExams));
    return mockExams;
  });

  const [savedExams, setSavedExams] = useState<any[]>(() => {
    const stored = localStorage.getItem('savedExams');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    // Seed with a mock saved exam template in the repository
    const initialSaved = [
      {
        id: 'se-template-1',
        title: 'Diagnostic Quiz - JavaScript Mechanics',
        description: 'Comprehensive diagnostic exam covering scope, hoisting, closures, and async event loops.',
        questions: [
          {
            id: 'q-seq-1',
            type: 'multiple-choice',
            question: 'What is the output of console.log(typeof NaN)?',
            options: ['"number"', '"NaN"', '"undefined"', '"object"'],
            correctAnswer: 0,
            points: 10,
            difficulty: 'easy',
            topic: 'JS Types'
          },
          {
            id: 'q-seq-2',
            type: 'true-false',
            question: 'Strict equality (===) performs type coercion before comparison.',
            correctAnswer: 'false',
            points: 10,
            difficulty: 'easy',
            topic: 'JS Scope'
          },
          {
            id: 'q-seq-3',
            type: 'short-answer',
            question: 'What keyword was introduced in ES6 to declare block-scoped variable that can be reassigned?',
            correctAnswer: 'let',
            points: 10,
            difficulty: 'medium',
            topic: 'ES6 Syntax'
          },
          {
            id: 'q-seq-4',
            type: 'essay',
            question: 'Describe how closure works in JavaScript and give a practical use case.',
            points: 20,
            difficulty: 'hard',
            topic: 'Closures'
          }
        ],
        totalPoints: 50,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem('savedExams', JSON.stringify(initialSaved));
    return initialSaved;
  });

  const [examAttempts, setExamAttempts] = useState<any[]>(() => {
    const stored = localStorage.getItem('examAttempts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((a: any) => ({
          ...a,
          submittedAt: a.submittedAt ? new Date(a.submittedAt) : undefined,
          startedAt: a.startedAt ? new Date(a.startedAt) : new Date(),
        }));
      } catch (e) {
        // Fallback
      }
    }
    localStorage.setItem('examAttempts', JSON.stringify(mockExamAttempts));
    return mockExamAttempts;
  });

  const [reviewers, setReviewers] = useState<any[]>(() => {
    const stored = localStorage.getItem('reviewers');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    // Seed with a default student reviewer
    const initialReviewers = [
      {
        id: 'rev-1',
        title: 'Reviewer: Web Technologies Study Aid',
        subject: 'Computer Science',
        questions: [
          {
            id: 'rq-1',
            type: 'multiple-choice',
            question: 'Which of the following describes the purpose of a CSS Media Query?',
            options: [
              'To query the database for styling values',
              'To apply styles based on the device characteristics such as screen width',
              'To play media files in the background',
              'To configure structural HTML tags'
            ],
            correctAnswer: 1,
            explanation: 'Media queries allow web developers to apply different CSS rules depending on the rendering device screen width, orientation, and resolution.'
          },
          {
            id: 'rq-2',
            type: 'true-false',
            question: 'The DOM (Document Object Model) is a built-in compiler for JS code.',
            correctAnswer: 'false',
            explanation: 'The DOM is an API representation of the HTML document structure, permitting JavaScript scripts to access and manipulate page nodes dynamically.'
          }
        ],
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem('reviewers', JSON.stringify(initialReviewers));
    return initialReviewers;
  });

  const [classroomMaterials, setClassroomMaterials] = useState<Record<string, any[]>>(() => {
    const stored = localStorage.getItem('classroomMaterials');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return {};
  });

  // Keep localStorage in sync when states change
  useEffect(() => {
    localStorage.setItem('classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('savedExams', JSON.stringify(savedExams));
  }, [savedExams]);

  useEffect(() => {
    localStorage.setItem('examAttempts', JSON.stringify(examAttempts));
  }, [examAttempts]);

  useEffect(() => {
    localStorage.setItem('reviewers', JSON.stringify(reviewers));
  }, [reviewers]);

  useEffect(() => {
    localStorage.setItem('classroomMaterials', JSON.stringify(classroomMaterials));
  }, [classroomMaterials]);

  const login = (email: string, password: string): boolean => {
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
  };

  const switchAccount = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', user.id);
    }
  };

  const addClassroom = (classroom: any) => {
    setClassrooms((prev) => [...prev, classroom]);
  };

  const joinClassroom = (classCode: string, studentId: string): boolean => {
    const target = classrooms.find((c) => c.classCode.toLowerCase() === classCode.trim().toLowerCase());
    if (target) {
      if (!target.students.includes(studentId)) {
        setClassrooms((prev) => prev.map((c) => {
          if (c.id === target.id) {
            return { ...c, students: [...c.students, studentId] };
          }
          return c;
        }));
      }
      return true;
    }
    return false;
  };

  const saveExamToRepository = (exam: any) => {
    setSavedExams((prev) => {
      // Check if already exists, then overwrite/update
      const idx = prev.findIndex((e) => e.id === exam.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = exam;
        return updated;
      }
      return [...prev, exam];
    });
  };

  const updateExamInRepository = (exam: any) => {
    saveExamToRepository(exam);
  };

  const deleteExamFromRepository = (examId: string) => {
    setSavedExams((prev) => prev.filter((e) => e.id !== examId));
  };

  const assignExamToClassroom = (examId: string, classroomId: string, postDate: string, dueDate: string) => {
    const repoExam = savedExams.find((e) => e.id === examId);
    if (repoExam) {
      const activeExam = {
        ...repoExam,
        id: `exam-${Date.now()}`,
        classroomId,
        isPublished: true,
        allowedAttempts: 1,
        postDate: new Date(postDate),
        dueDate: new Date(dueDate),
        createdAt: new Date(),
      };
      setExams((prev) => [...prev, activeExam]);
    }
  };

  const submitExamAttempt = (attempt: any) => {
    setExamAttempts((prev) => {
      const idx = prev.findIndex((a) => a.id === attempt.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = attempt;
        return updated;
      }
      return [...prev, attempt];
    });
  };

  const saveReviewer = (reviewer: any) => {
    setReviewers((prev) => [...prev, reviewer]);
  };

  const deleteReviewer = (reviewerId: string) => {
    setReviewers((prev) => prev.filter((r) => r.id !== reviewerId));
  };

  const updateReviewer = (reviewer: any) => {
    setReviewers((prev) => prev.map((r) => r.id === reviewer.id ? reviewer : r));
  };

  const addClassroomMaterial = (classroomId: string, material: any) => {
    setClassroomMaterials((prev) => ({
      ...prev,
      [classroomId]: [...(prev[classroomId] || []), material],
    }));
  };

  const deleteClassroomMaterial = (classroomId: string, materialId: string) => {
    setClassroomMaterials((prev) => ({
      ...prev,
      [classroomId]: (prev[classroomId] || []).filter((m: any) => m.id !== materialId),
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchAccount,
        isAuthenticated: !!currentUser,
        
        classrooms,
        exams,
        savedExams,
        examAttempts,
        reviewers,
        classroomMaterials,
        
        addClassroom,
        joinClassroom,
        saveExamToRepository,
        assignExamToClassroom,
        submitExamAttempt,
        saveReviewer,
        deleteReviewer,
        updateReviewer,
        updateExamInRepository,
        deleteExamFromRepository,
        addClassroomMaterial,
        deleteClassroomMaterial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { mockUsers, mockClassrooms, mockExams, mockQuestionBank, mockExamAttempts };
