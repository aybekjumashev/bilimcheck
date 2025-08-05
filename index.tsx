import { GoogleGenAI, Type } from "@google/genai";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";

const { useState, useEffect } = React;

// --- TYPE DEFINITIONS ---
type Subject = {
  id: number;
  name: string;
  grade: number;
  questions_count: number;
  has_enough_questions: boolean;
};

type GroupedSubject = {
  name: string;
  grades: { grade: number; id: number; has_enough_questions: boolean }[];
};

type QuestionOption = { [key: string]: string };

type TestQuestion = {
  id: number;
  order_number: number;
  question_text: string;
  options: QuestionOption;
};

type TestCreationResponse = {
  test_id: number;
  questions: TestQuestion[];
};

type TestResultDetails = {
  id: number;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  rank: number;
};

type ResultQuestion = TestQuestion & {
  user_answer: string;
  correct_answer: string;
};

type SubjectDetail = {
  id: number;
  name: string;
  grade: number;
  topics: string;
};

type TestSubmissionResponse = {
  result: TestResultDetails;
  questions: ResultQuestion[];
  subject_detail: SubjectDetail;
};

type StudyTopic = {
    name: string;
    desc: string;
};

type StudyPlan = {
    topics: StudyTopic[];
};

type TestResultListItem = {
    id: number;
    test_name: string;
    student_name: string;
    score_percentage: number;
    correct_answers: number;
    total_questions: number;
    completed_at: string;
};

type PaginationInfo = {
    current_page: number;
    total_pages: number;
    total_results: number;
    has_next: boolean;
    has_previous: boolean;
};

type TestResultsResponse = {
    results: TestResultListItem[];
    pagination: PaginationInfo;
};

declare global {
    interface Window {
        jspdf: any;
    }
}

// --- API SERVICE ---
const API_BASE_URL = "https://bilimler-bellesiwi.kozqaras.xyz";

const api = {
  getSubjects: async (): Promise<{ subjects: Subject[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/site/subjects/`);
    if (!response.ok) throw new Error("Failed to fetch subjects");
    return response.json();
  },
  getTestResults: async (page: number = 1, subject: string = '', student_name: string = ''): Promise<TestResultsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/site/test-results/?page=${page}&page_size=15&subject_id=${subject}&search=${student_name}`);
    if (!response.ok) throw new Error("Failed to fetch test results");
    return response.json();
  },
  createTest: async (subject_id: number): Promise<TestCreationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/site/create-test/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id, questions_count: 30 }),
    });
    if (!response.ok) throw new Error("Failed to create test");
    return response.json();
  },
  submitTest: async (test_id: number, student_name: string, answers: { [key: number]: string }): Promise<TestSubmissionResponse> => {
    const student_id = localStorage.getItem('student_id') || `user_${generateUUID()}`;
    localStorage.setItem('student_id', student_id);
    const response = await fetch(`${API_BASE_URL}/api/site/submit-test/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_id,
        student_id,
        student_name,
        answers,
      }),
    });
    if (!response.ok) throw new Error("Failed to submit test");
    return response.json();
  },
};

// --- HELPER COMPONENTS ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-accent"></div>
    </div>
);

const Header = () => (
    <header className="bg-brand-primary/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-white hover:text-brand-accent transition-colors flex items-center gap-2">
                <img src="/logo.png" alt="logo" className="w-7 h-7" />
                <span className="md:text-2xl text-base">BilimCheck</span>
            </Link>
            <div className="flex items-center gap-1">
                <Link to="/results" className="text-gray-400 text-center py-1 px-3 rounded-lg hover:bg-brand-secondary transition-colors">
                    Nátiyjeler
                </Link>
                <Link to="/tests" className="bg-brand-accent text-white text-center font-semibold py-1 px-3 rounded-lg hover:opacity-90 transition-opacity">
                    Testler
                </Link>
            </div>
        </nav>
    </header>
);

// --- PAGES ---

const LandingPage = () => (
    <div className="text-center py-20 px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4">
            Bilimińizdi sınań hám<br /> <span className="text-brand-accent">Jasalma intellekt</span> penen ázzi táreplerińizdi anıqlań
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Qálegen pánińizdi saylap, qısqa testten ótiń hám jasalma intellekt dúzip bergen jeke oqıw rejesi menen bilimińizdi toltırıń
        </p>
        <Link to="/tests" className="bg-brand-accent text-white font-bold py-3 px-8 rounded-full text-lg hover:opacity-90 transition-transform transform hover:scale-105 flex items-center justify-center gap-2 mx-auto max-w-xs">
            <span>Testti Baslaw</span>
            <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M20.337 3.664c.213.212.354.486.404.782.294 1.711.657 5.195-.906 6.76-1.77 1.768-8.485 5.517-10.611 6.683a.987.987 0 0 1-1.176-.173l-.882-.88-.877-.884a.988.988 0 0 1-.173-1.177c1.165-2.126 4.913-8.841 6.682-10.611 1.562-1.563 5.046-1.198 6.757-.904.296.05.57.191.782.404ZM5.407 7.576l4-.341-2.69 4.48-2.857-.334a.996.996 0 0 1-.565-1.694l2.112-2.111Zm11.357 7.02-.34 4-2.111 2.113a.996.996 0 0 1-1.69-.565l-.422-2.807 4.563-2.74Zm.84-6.21a1.99 1.99 0 1 1-3.98 0 1.99 1.99 0 0 1 3.98 0Z" clip-rule="evenodd"/>
            </svg>
        </Link>

        <div className="mt-24 max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-brand-primary p-6 rounded-xl border border-brand-secondary transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent">
                <div className="text-brand-accent text-3xl mb-3">1</div>
                <h3 className="text-xl font-bold mb-2">Pán Saylaw</h3>
                <p className="text-gray-400">Pánler hám klasslar arasınan ózińizge kereklisin saylań</p>
            </div>
            <div className="bg-brand-primary p-6 rounded-xl border border-brand-secondary transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent">
                <div className="text-brand-accent text-3xl mb-3">2</div>
                <h3 className="text-xl font-bold mb-2">Test Tapsırıw</h3>
                <p className="text-gray-400">Bilimińizdi bahalaw ushın 30 sorawdan ibarat test penen ózińizdi sınań</p>
            </div>
            <div className="bg-brand-primary p-6 rounded-xl border border-brand-secondary transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent">
                <div className="text-brand-accent text-3xl mb-3">3</div>
                <h3 className="text-xl font-bold mb-2">Nátiyje hám Reje</h3>
                <p className="text-gray-400">Jasalma intellekt siz ushın arnawlı oqıw jobasın dúzedi. Endi ne oqıwdı anıq bilesiz!</p>
            </div>
        </div>
    </div>
);

const SubjectSelectionPage = () => {
    const [subjects, setSubjects] = useState<GroupedSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<{ grade: number, id: number } | null>(null);
    const [isCreatingTest, setIsCreatingTest] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.getSubjects()
            .then(data => {
                const grouped = data.subjects.reduce((acc, subject) => {
                    if (!acc[subject.name]) {
                        acc[subject.name] = { name: subject.name, grades: [] };
                    }
                    acc[subject.name].grades.push({ grade: subject.grade, id: subject.id, has_enough_questions: subject.has_enough_questions });
                    return acc;
                }, {} as { [key: string]: GroupedSubject });
                setSubjects(Object.values(grouped));
            })
            .catch(() => setError("Could not load subjects. Please try again later."))
            .finally(() => setLoading(false));
    }, []);

    const handleStartTest = async () => {
        if (!selectedGrade) return;
        setIsCreatingTest(true);
        try {
            const testData = await api.createTest(selectedGrade.id);
            const subjectFullName = `${selectedSubject} ${selectedGrade.grade}-klass`;
            navigate(`/test/${testData.test_id}`, { state: { questions: testData.questions, subjectName: subjectFullName } });
        } catch (err) {
            setError("Failed to create the test. Please try again.");
            setIsCreatingTest(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center text-red-400 mt-10">{error}</div>;

    return (
        <div className="container mx-auto px-6 py-12">
            <h2 className="text-3xl font-bold text-center mb-2">Pánińizdi Saylań</h2>
            <p className="text-center text-gray-400 mb-10">Testti baslaw ushin pán hám klasıńızdı saylań.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map(subject => {
                    const isAnyGradeAvailable = subject.grades.some(g => g.has_enough_questions);
                    const isSelected = selectedSubject === subject.name;
                    return (
                        <div key={subject.name} className={`bg-brand-primary p-6 rounded-xl border-2 transition-all ${isSelected ? 'border-brand-accent' : 'border-brand-secondary'} ${!isAnyGradeAvailable ? 'opacity-50' : 'cursor-pointer hover:border-brand-accent/70'}`}
                            onClick={() => isAnyGradeAvailable && setSelectedSubject(subject.name)}>
                            <h3 className="text-2xl font-bold mb-4">{subject.name}</h3>
                            {isAnyGradeAvailable ? (
                                <div>
                                    <p className="text-sm text-gray-400 mb-3">Klasıńızdı saylań:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {subject.grades.map(gradeInfo => (
                                            <button key={gradeInfo.id}
                                                disabled={!gradeInfo.has_enough_questions}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (gradeInfo.has_enough_questions) {
                                                        setSelectedSubject(subject.name);
                                                        setSelectedGrade(gradeInfo);
                                                    }
                                                }}
                                                className={`px-5 py-1 text-sm font-semibold rounded-full transition-colors ${selectedGrade?.id === gradeInfo.id ? 'bg-brand-accent text-white' : 'bg-brand-secondary text-gray-200'} ${gradeInfo.has_enough_questions ? 'hover:bg-brand-accent/80' : 'cursor-not-allowed opacity-60'}`}>
                                                {gradeInfo.grade}
                                            </button>
                                        ))}
                                    </div>
                                    {isSelected && selectedGrade && selectedGrade.id && subject.grades.find(g => g.id === selectedGrade.id) && (
                                        <button onClick={handleStartTest} disabled={isCreatingTest} className="w-full mt-6 bg-brand-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                            {isCreatingTest ? `${selectedGrade.grade}-klass Testin Baslaw...` : `${selectedGrade.grade}-klass Testin Baslaw`}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-yellow-400 font-semibold">Tez Arada</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TestPage = () => {
    const { testId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { questions, subjectName } = location.state as { questions: TestQuestion[], subjectName: string } || {};

    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [studentName, setStudentName] = useState('');
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);

    useEffect(() => {
        const savedName = localStorage.getItem('student_name') || '';
        setStudentName(savedName);

        if (!questions || questions.length === 0) {
            navigate('/tests', { replace: true });
        }
    }, [questions, navigate]);

    if (!questions || questions.length === 0) return <LoadingSpinner />;

    const currentQuestion = questions[currentQIndex];

    const handleSelectOption = (questionId: number, optionKey: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionKey }));
        if (currentQIndex < questions.length - 1) {
            setTimeout(() => setCurrentQIndex(i => i + 1), 300);
        }
    };

    const handleOpenSubmitModal = () => {
        if (Object.keys(answers).length !== questions.length) {
            setError("Barlıq sorawlarǵa juwap beriń.");
            return;
        }
        setError(null);
        setIsNameModalOpen(true);
    };

    const handleFinalSubmit = async () => {
        if (!studentName.trim()) {
            setError("Atı-familiyańızdı kiritiń.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            const trimmedName = studentName.trim();
            localStorage.setItem('student_name', trimmedName);
            const resultData = await api.submitTest(Number(testId), trimmedName, answers);
            navigate(`/result/${testId}`, { state: { resultData } });
        } catch (err) {
            setError("Testti juwmaqlawda qátelik júz berdi. Qaytadan urınıp kóriń.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-4 text-center">{subjectName || 'Test'}</h1>
            
            <div className="mb-6 bg-brand-primary/50 p-4 rounded-xl border border-brand-secondary">
                <div className="flex flex-wrap justify-center gap-2">
                    {questions.map((q, index) => {
                        const isActive = currentQIndex === index;
                        const isAnswered = answers.hasOwnProperty(q.id);
                        
                        let buttonClass = 'w-8 h-8 rounded-md flex items-center justify-center font-semibold transition-all duration-200 text-sm focus:outline-none';

                        if (isActive) {
                            buttonClass += ' bg-brand-accent text-white ring-2 ring-offset-2 ring-offset-gray-900 ring-brand-accent scale-110';
                        } else if (isAnswered) {
                            buttonClass += ' bg-green-500/40 text-gray-100 hover:bg-green-500/60';
                        } else {
                            buttonClass += ' bg-brand-secondary text-gray-400 hover:bg-brand-secondary/70';
                        }

                        return (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQIndex(index)}
                                className={buttonClass}
                                aria-label={`Soraw ${index + 1} ge ótiw`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-brand-primary p-8 rounded-2xl shadow-2xl border border-brand-secondary">
                <div>
                    <h2 className="text-2xl font-semibold mb-6 min-h-[96px]">{currentQuestion.question_text}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(currentQuestion.options).map(([key, value]) => (
                            <button key={key}
                                onClick={() => handleSelectOption(currentQuestion.id, key)}
                                className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${answers[currentQuestion.id] === key ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-secondary border-brand-secondary hover:border-brand-accent/50'}`}>
                                <span className="font-bold mr-2">{key}.</span>{value}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button onClick={() => setCurrentQIndex(i => Math.max(0, i-1))} disabled={currentQIndex === 0} className="py-2 px-4 bg-brand-secondary rounded-lg disabled:opacity-50">
                        Aldınǵı
                    </button>
                    {currentQIndex === questions.length - 1 ? (
                        <button onClick={handleOpenSubmitModal} disabled={Object.keys(answers).length !== questions.length} className="py-2 px-6 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            Juwmaqlaw
                        </button>
                    ) : (
                        <button onClick={() => setCurrentQIndex(i => Math.min(questions.length-1, i+1))} disabled={currentQIndex === questions.length-1} className="py-2 px-4 bg-brand-accent text-white rounded-lg disabled:opacity-50">Keyingi</button>
                    )}
                </div>
                {error && !isNameModalOpen && <p className="text-red-400 text-center mt-4">{error}</p>}
            </div>

            {isNameModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100]">
                    <div className="bg-brand-primary p-8 rounded-2xl shadow-2xl border border-brand-secondary w-full max-w-md mx-4">
                        <h2 className="text-2xl font-bold mb-4 text-center">Nátiyjeni saqlaw</h2>
                        
                        <div className="mb-4">
                            <label htmlFor="studentName" className="block text-sm font-medium text-gray-300 mb-2">Atı-familiyańız</label>
                            <input
                                id="studentName"
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder=""
                                className="w-full bg-brand-secondary border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-brand-accent focus:border-brand-accent"
                                autoFocus
                            />
                        </div>

                        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

                        <div className="flex justify-end gap-4 mt-8">
                            <button 
                                onClick={() => { setIsNameModalOpen(false); setError(null); }} 
                                className="py-2 px-6 bg-brand-secondary rounded-lg hover:opacity-80 transition"
                            >
                                Biykarlaw
                            </button>
                            <button 
                                onClick={handleFinalSubmit} 
                                disabled={isSubmitting || !studentName.trim()} 
                                className="py-2 px-6 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Jiberilmekte...' : 'Jiberiw hám Juwmaqlaw'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



const ResultsListContainer = () => {
    const [subjects, setSubjects] = useState<GroupedSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;
    const subject = searchParams.get('subject') || '';
    const studentName = searchParams.get('student_name') || '';

    useEffect(() => {
        api.getSubjects()
            .then(data => {
                setSubjects(Object.values(data.subjects));
            })
            .catch(() => setError("Could not load subjects. Please try again later."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center text-red-400 mt-10">{error}</div>;

    return (
        <div className="container mx-auto px-6 py-10 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-10">Barlıq Nátiyjeler</h2>            
            <div className="sm:flex justify-between items-center">
                {/* Subjects select */}
                <div className="relative mb-3">
                <select
                    className="appearance-none bg-brand-secondary text-gray-200 border border-brand-secondary rounded-lg px-4 py-2 focus:ring-brand-accent focus:border-brand-accent w-full pr-10"
                    value={subject}
                    onChange={(e) => setSearchParams({ subject: e.target.value, page: '1', student_name: studentName })}
                >
                    <option value="">Barlıq pán</option>
                    {subjects.map(subject => (
                    <option key={subject.name} value={subject.id}>
                        {subject.name} {subject.grade}-klass
                    </option>
                    ))}
                </select>

                {/* Custom arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                </div>

                {/* Search input */}
                <div className="relative mb-3">
                    <input
                        type="text"
                        className="bg-brand-secondary text-gray-200 border border-brand-secondary rounded-lg px-4 py-2 focus:ring-brand-accent focus:border-brand-accent w-full"
                        placeholder="Atı-familiyası..."
                        value={studentName}
                        onChange={(e) => setSearchParams({ student_name: e.target.value, page: '1', subject: subject })}
                    />
                </div>
            </div>

            <ResultsListPage />
        </div>
    );
};



const ResultsListPage = () => {
    const [results, setResults] = useState<TestResultListItem[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;
    const subject = searchParams.get('subject') || '';
    const studentName = searchParams.get('student_name') || '';

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.getTestResults(currentPage, subject, studentName)
            .then(data => {
                setResults(data.results);
                setPagination(data.pagination);
            })
            .catch(() => {
                setError("Nátiyjelerdi júklewde qátelik júz berdi. Qaytadan urınıp kóriń.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currentPage, subject, studentName]);

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString(), subject: subject, student_name: studentName });
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center text-red-400 mt-10">{error}</div>;

    return (
        <div className="container mx-auto max-w-3xl">
            <div className="bg-brand-primary rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[300px]">
                        <tbody>
                            {results.map((result) => (
                                <tr key={result.id} className="border-t border-brand-secondary hover:bg-brand-secondary/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>{result.student_name}</div>
                                            <div className="text-brand-accent font-bold">{result.score_percentage.toFixed(1)}%</div>
                                        </div>
                                        <div className="flex items-center justify-between text-gray-400 mt-1 text-xs">
                                            <div>{result.test_name}</div>
                                            <div>{result.completed_at}</div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination && pagination.total_pages > 1 && (
                <div className="flex gap-4 justify-center items-center mt-8">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={!pagination.has_previous} className="py-2 px-4 bg-brand-secondary rounded-lg disabled:opacity-50 hover:bg-brand-secondary/70 transition">
                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7"/>
                        </svg>
                    </button>
                    <span className="text-gray-400">
                        {pagination.current_page} / {pagination.total_pages}
                    </span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={!pagination.has_next} className="py-2 px-4 bg-brand-secondary rounded-lg disabled:opacity-50 hover:bg-brand-secondary/70 transition">
                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

const ResultPage = () => {
    const { testId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { resultData } = location.state as { resultData: TestSubmissionResponse } || {};

    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openTopicIndex, setOpenTopicIndex] = useState<number | null>(null);
    
    useEffect(() => {
        if (!resultData) {
            navigate('/', { replace: true });
        }
    }, [resultData, navigate]);
    
    if (!resultData) return <LoadingSpinner />;

    const { result, questions, subject_detail } = resultData;
    const incorrectQuestions = questions.filter(q => q.user_answer !== q.correct_answer);
    
    const handleGeneratePlan = async () => {
        setIsGeneratingPlan(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const incorrectQuestionsText = incorrectQuestions.map(q => 
              `- Question: "${q.question_text}"\n  - User Answer: "${q.options[q.user_answer]}"\n  - Correct Answer: "${q.options[q.correct_answer]}"`
            ).join('\n');

            const prompt = `
You are an expert tutor. A student has just completed a test. Analyze their results and provide a study plan.

Test data:
- Subject: ${subject_detail.name}
- Grade: ${subject_detail.grade}
${'Topics: ' + subject_detail.topics || ''}
- Final Score: ${result.score_percentage}% (${result.correct_answers} out of ${result.total_questions} correct)
- Incorrectly answered questions:
${incorrectQuestionsText}

Based on these incorrect answers, identify key topics to study. For each topic explanation of the core concept.
Be encouraging and constructive. Return all information only in Karakalpak language (if the subject is related to the language, only in the language of that subject).
            `;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    topics: {
                        type: Type.ARRAY,
                        description: "A list of key topics the student needs to study.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: {
                                    type: Type.STRING,
                                    description: "Name of the topic being studied in the Karakalpak language or, if the subject is related to the language (English or Russian), only in the language of that subject."
                                },
                                desc: {
                                    type: Type.STRING,
                                    description: "Explanation of the core concept of the topic, in Karakalpak language."
                                }
                            },
                            required: ["name", "desc"]
                        }
                    }
                },
                required: ["topics"]
            };

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
              }
            });

            const planData = JSON.parse(response.text);
            setStudyPlan(planData);

        } catch (err) {
            console.error(err);
            setError("Failed to generate AI plan. Please check your API key or network connection and try again.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };


    const handleDownloadPdf = async () => {
        if (!studyPlan) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        try {
            const fontResponse = await fetch('/DejaVuSans.ttf');
            const fontBuffer = await fontResponse.arrayBuffer();
            
            const fontBase64 = btoa(
                new Uint8Array(fontBuffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
            doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
            doc.setFont('DejaVuSans'); 

            const margin = 15;
            const pageWidth = doc.internal.pageSize.getWidth();
            const usableWidth = pageWidth - 2 * margin;
            let y = margin;
        
            doc.setFontSize(18);
            doc.text(`Oqıw rejesi: ${subject_detail.name} ${subject_detail.grade}-klass`, margin, y);
            y += 20;
        
            studyPlan.topics.forEach((topic, index) => {
                if (y > doc.internal.pageSize.getHeight() - 30) {
                    doc.addPage();
                    y = margin;
                    doc.setFont('DejaVuSans'); 
                }
        
                doc.setFontSize(14);
                doc.text(`${index + 1}. ${topic.name}`, margin, y);
                y += 8;
        
                doc.setFontSize(11);
                doc.setFont('DejaVuSans', 'normal');
                const descLines = doc.splitTextToSize(topic.desc, usableWidth);
                doc.text(descLines, margin, y);
                y += descLines.length * 6 + 10;
            });
        
            doc.save(`study-plan-${subject_detail.name.toLowerCase()}-g${subject_detail.grade}.pdf`);

        } catch (e) {
            console.error("Failed to download PDF:", e);
            setError("PDF jiberiwde qátelik júz berdi. Qaytadan urınıp kóriń.");
        }
    };

    const toggleTopic = (index: number) => {
        setOpenTopicIndex(prevIndex => (prevIndex === index ? null : index));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Results Summary */}
            <div className="bg-brand-primary p-8 rounded-2xl shadow-2xl border border-brand-secondary mb-8">
                <h2 className="text-3xl font-bold text-center mb-2">Test Nátiyjesi</h2>
                <p className="text-center text-gray-400 mb-6">{subject_detail.name} {subject_detail.grade}-klass</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-brand-secondary p-6 rounded-lg">
                        <p className="text-gray-400 text-sm">BALL</p>
                        <p className="text-4xl font-bold text-brand-accent">{result.score_percentage.toFixed(1)}%</p>
                    </div>
                    <div className="bg-brand-secondary p-6 rounded-lg">
                        <p className="text-gray-400 text-sm">DURÍS JUWAPLAR</p>
                        <p className="text-4xl font-bold text-white">{result.correct_answers}</p>
                    </div>
                    <div className="bg-brand-secondary p-6 rounded-lg">
                        <p className="text-gray-400 text-sm">SORAWLAR</p>
                        <p className="text-4xl font-bold text-white">{result.total_questions}</p>
                    </div>
                </div>
            </div>

            {/* AI Study Plan */}
            <div className="bg-brand-primary p-8 rounded-2xl shadow-2xl border border-brand-secondary mb-8">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Óz Betinshe Oqıw Rejesi</h3>
                    {studyPlan && (
                        <button onClick={handleDownloadPdf}
                            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Júklew
                        </button>
                    )}
                </div>

                {!studyPlan && (
                    <button onClick={handleGeneratePlan} disabled={isGeneratingPlan || incorrectQuestions.length === 0}
                        className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {isGeneratingPlan ? (
                            <span className="flex items-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>✨ Oqıw Rejesin Alıw...</span>
                        ) : (incorrectQuestions.length === 0 ? "Joqarı nátiyje! Reje shárt emes" : "✨ Oqıw Rejesin Alıw")}
                    </button>
                )}
                {error && <p className="text-red-400 mt-4">{error}</p>}
                {studyPlan && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                             {studyPlan.topics.map((topic, index) => (
                                <div key={index} className="border border-brand-secondary rounded-lg overflow-hidden">
                                    <button onClick={() => toggleTopic(index)} className="w-full flex justify-between items-center p-4 text-left bg-brand-secondary hover:bg-opacity-80 transition-colors">
                                        <span className="font-semibold text-lg">{topic.name}</span>
                                        <svg className={`w-6 h-6 transform transition-transform ${openTopicIndex === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>
                                    {openTopicIndex === index && (
                                        <div className="p-4 bg-brand-primary/50">
                                            <p className="text-gray-300">{topic.desc}</p>
                                        </div>
                                    )}
                                </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Question Review */}
            <div className="bg-brand-primary p-8 rounded-2xl shadow-2xl border border-brand-secondary">
                 <h3 className="text-2xl font-bold mb-6">Sorawdı Qayta Kórip Shıǵıw</h3>
                 <div className="space-y-6">
                    {questions.map((q, index) => {
                        const isCorrect = q.user_answer === q.correct_answer;
                        return (
                            <div key={q.id} className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                                <p className="font-semibold mb-2">{index + 1}. {q.question_text}</p>
                                <p className="text-sm">Juwabıńız: <span className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{q.options[q.user_answer] || 'Not answered'}</span></p>
                                {!isCorrect && <p className="text-sm">Durıs juwap: <span className="font-bold text-green-400">{q.options[q.correct_answer]}</span></p>}
                            </div>
                        )
                    })}
                 </div>
            </div>
        </div>
    );
};


function generateUUID() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const App = () => {
    useEffect(() => {
        if (!localStorage.getItem('student_id')) {
            localStorage.setItem('student_id', `user_${generateUUID()}`);
        }
    }, []);

    return (
        <HashRouter>
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
                <Header />
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/tests" element={<SubjectSelectionPage />} />
                        <Route path="/test/:testId" element={<TestPage />} />
                        <Route path="/result/:testId" element={<ResultPage />} />
                        <Route path="/results" element={<ResultsListContainer />} />
                    </Routes>
                </main>
                <footer className="backdrop-blur-sm py-4">
                    <div className="container mx-auto text-center text-gray-700 text-xs">
                        <p>
                            Developed by{" "}
                            <a href="https://t.me/aybek_jumashev">Aybek Jumashev</a>
                        </p>
                    </div>
                </footer>
            </div>
        </HashRouter>
    );
};


const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}