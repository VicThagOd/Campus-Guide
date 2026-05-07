import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Mode = 'login' | 'signup';

export function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>(location.state?.isSignup ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const signupPasswordValid = Object.values(passwordChecks).every(Boolean);

  const validateSignupPassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === 'signup') {
        const passwordError = validateSignupPassword(password);
        if (passwordError) {
          setError(passwordError);
          setIsLoading(false);
          return;
        }

        const derivedUsername = username || name.split(' ')[0] || normalizedEmail.split('@')[0] || 'Student';
        const derivedCourse = course || 'Post UTME Candidate';

        await signup({
          name,
          username: derivedUsername,
          email: normalizedEmail,
          password,
          course: derivedCourse,
        });

        // Success – show message and switch to login
        setInfo('Account created successfully! Please log in with your credentials.');
        setMode('login');
        setEmail('');
        setPassword('');
      } else {
        await login(normalizedEmail, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message = err?.message || 'Something went wrong';
      if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('already registered')) {
        setError('An account already exists with this email. Switch to login or reset your password.');
      } else if (message.toLowerCase().includes('invalid login credentials') ||
                 message.toLowerCase().includes('invalid password') ||
                 message.toLowerCase().includes('wrong password')) {
        setError('Invalid login credentials. Please check your email and password.');
      } else if (message.toLowerCase().includes('user not found') || message.toLowerCase().includes('no user')) {
        setError('No account found with that email address.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setInfo('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:opacity-90"
            style={{ backgroundColor: '#6b7280', color: '#FFFFFF', fontWeight: 500 }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#2F4EA2', marginBottom: '0.5rem' }}>
            Campus Guide - Post UTME
          </h1>
          <p style={{ color: '#000000', opacity: 0.6 }}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-4 rounded bg-green-100 p-3 text-green-700 text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="name" className="mb-2 block text-black">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="username" className="mb-2 block text-black">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label htmlFor="course" className="mb-2 block text-black">Course of Study / Faculty</label>
                  <select
                    id="course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select your course / Faculty</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Medicine and Surgery">Medicine and Surgery</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Law">Law</option>
                    <option value="Sciences">Sciences</option>
                    <option value="Computing">Computing</option>
                    <option value="Anatomy">Anatomy</option>
                    <option value="Physiology">Physiology</option>
                    <option value="SSLT">SSLT</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Geology">Geology</option>
                    <option value="Industrial Chemistry/Physics">Industrial Chemistry/Physics</option>
                    <option value="Humanities/Communication &amp; Media Studies">Humanities/Communication &amp; Media Studies</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Social Sciences">Social Sciences</option>
                    <option value="Management Sciences">Management Sciences</option>
                  </select>

                  {course && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <span className="mt-0.5 text-amber-500">⚠️</span>
                      <p className="text-sm text-amber-700">
                        Choose carefully — your course/faculty determines the CBT questions and PDF study materials you'll receive.{' '}
                        <span className="font-semibold">This cannot be changed after signup.</span>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-black">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-black">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="mb-2 font-medium text-slate-800">Password requirements</p>
                <ul className="space-y-1">
                  <li className={passwordChecks.minLength ? 'text-green-700' : 'text-red-600'}>• At least 8 characters</li>
                  <li className={passwordChecks.lowercase ? 'text-green-700' : 'text-red-600'}>• At least one lowercase letter</li>
                  <li className={passwordChecks.uppercase ? 'text-green-700' : 'text-red-600'}>• At least one uppercase letter</li>
                  <li className={passwordChecks.number ? 'text-green-700' : 'text-red-600'}>• At least one number</li>
                  <li className={passwordChecks.special ? 'text-green-700' : 'text-red-600'}>• At least one special character</li>
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'signup' && !signupPasswordValid)}
              className="w-full rounded-lg py-3 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#2F4EA2' }}
            >
              {isLoading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Log In'}
            </button>

            {mode === 'signup' && !signupPasswordValid && (
              <p className="mt-3 text-sm text-slate-600">
                Complete all password requirements before signing up.
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <button
                onClick={() => switchMode('signup')}
                className="font-medium hover:underline"
                style={{ color: '#2F4EA2' }}
              >
                Don't have an account? Sign up
              </button>
            ) : (
              <button
                onClick={() => switchMode('login')}
                className="font-medium hover:underline"
                style={{ color: '#2F4EA2' }}
              >
                Already have an account? Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
