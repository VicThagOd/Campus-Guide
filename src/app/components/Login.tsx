import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert02Icon, ArrowLeft01Icon, Cancel01Icon, CheckmarkCircle02Icon, DocumentValidationIcon, GraduationScrollIcon, Loading01Icon, Mail01Icon, Target01Icon } from 'hugeicons-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Mode = 'login' | 'signup' | 'forgot';
type Step = 'role' | 'form';
type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, resetPasswordForEmail } = useAuth();

  const [mode, setMode] = useState<Mode>(location.state?.isSignup ? 'signup' : 'login');
  const [step, setStep] = useState<Step>(location.state?.isSignup ? 'role' : 'form');
  const [userType, setUserType] = useState<'aspirant' | 'student' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [course, setCourse] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>('idle');
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to check username availability against Supabase
  const checkUsernameAvailability = async (targetUsername: string): Promise<AvailabilityStatus> => {
    const trimmed = targetUsername.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      return 'idle';
    }

    try {
      // 1. Try RPC check first if exists
      const { data: rpcData, error: rpcError } = await supabase.rpc('check_username_available', {
        req_username: trimmed,
      });

      if (!rpcError && typeof rpcData === 'boolean') {
        return rpcData ? 'available' : 'taken';
      }

      // 2. Direct query fallback on profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', trimmed)
        .maybeSingle();

      if (error) {
        console.error('Username availability check error:', error);
        return 'error';
      }

      return data ? 'taken' : 'available';
    } catch (err) {
      console.error('Error checking username:', err);
      return 'error';
    }
  };

  // Real-time username availability check effect
  useEffect(() => {
    if (mode !== 'signup') return;

    const trimmed = username.trim().toLowerCase();

    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const status = await checkUsernameAvailability(trimmed);
      setUsernameStatus(status);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, mode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === 'signup') {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setIsLoading(false);
          return;
        }

        const trimmedUsername = username.trim().toLowerCase();
        if (!trimmedUsername || trimmedUsername.length < 3) {
          setError('Please choose a username of at least 3 characters.');
          setIsLoading(false);
          return;
        }

        // Re-check username availability status right before submit
        let currentStatus = usernameStatus;
        if (currentStatus === 'idle' || currentStatus === 'checking') {
          setUsernameStatus('checking');
          currentStatus = await checkUsernameAvailability(trimmedUsername);
          setUsernameStatus(currentStatus);
        }

        if (currentStatus === 'taken') {
          setError('Username exists, use something more unique ;-)');
          setIsLoading(false);
          return;
        }

        if (currentStatus === 'error') {
          setError('Unable to verify username availability. Please try again or choose a different username.');
          setIsLoading(false);
          return;
        }

        const derivedCourse = course || 'Post UTME Candidate';

        const { requiresEmailConfirmation } = await signup({
          name: name.trim(),
          username: trimmedUsername,
          email: normalizedEmail,
          password,
          course: derivedCourse,
          email_opt_in: emailOptIn,
          user_type: userType || 'aspirant',
        });

        if (requiresEmailConfirmation) {
          setSignedUpEmail(normalizedEmail);
          setIsLoading(false);
          return;
        } else {
          navigate('/dashboard');
          return;
        }
      } else if (mode === 'forgot') {
        await resetPasswordForEmail(normalizedEmail);
        setInfo('If an account exists for that email, a secure password-reset link has been sent.');
        setMode('login');
        setPassword('');
      } else {
        await login(normalizedEmail, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message = err?.message || 'Something went wrong';

      if (
        message.toLowerCase().includes('duplicate') ||
        message.toLowerCase().includes('already') ||
        message.toLowerCase().includes('database error') ||
        message.toLowerCase().includes('profiles_username_key') ||
        message.toLowerCase().includes('saving new user')
      ) {
        if (message.toLowerCase().includes('email')) {
          setError('An account already exists with this email address. Please switch to login.');
        } else {
          setError('Username exists, use something more unique ;-)');
          setUsernameStatus('taken');
        }
      } else if (
        message.toLowerCase().includes('invalid login credentials') ||
        message.toLowerCase().includes('invalid password') ||
        message.toLowerCase().includes('wrong password')
      ) {
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
    setStep(next === 'signup' ? 'role' : 'form');
    setUserType(null);
    setError('');
    setInfo('');
    setEmail('');
    setPassword('');
    setUsername('');
    setEmailOptIn(false);
    setUsernameStatus('idle');
    setSignedUpEmail(null);
  };

  const handleRoleSelect = (type: 'aspirant' | 'student') => {
    setUserType(type);
    setStep('form');
  };

  const UsernameIndicator = () => {
    if (usernameStatus === 'idle') return null;
    if (usernameStatus === 'checking') {
      return (
        <span className="flex items-center gap-1 mt-1 text-[#6B7280] font-medium text-[#000000]/70" style={{ fontSize: '0.85rem' }}>
          <Loading01Icon size={14} className="animate-spin text-[#2F4EA2]" /> Checking username availability...
        </span>
      );
    }
    if (usernameStatus === 'available') {
      return (
        <span className="flex items-center gap-1 mt-1 text-emerald-600 font-medium" style={{ fontSize: '0.85rem' }}>
          <CheckmarkCircle02Icon size={14} /> Username is available!
        </span>
      );
    }
    if (usernameStatus === 'taken') {
      return (
        <span className="flex items-center gap-1 mt-1 text-red-600 font-medium" style={{ fontSize: '0.85rem' }}>
          <Cancel01Icon size={14} /> Username exists, use something more unique ;-)
        </span>
      );
    }
    if (usernameStatus === 'error') {
      return (
        <span className="flex items-center gap-1 mt-1 text-amber-600 font-medium" style={{ fontSize: '0.85rem' }}>
          <Alert02Icon size={14} /> Couldn't check availability. Will verify on submit.
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white px-4 py-8">
      {/* Full-Screen Email Confirmation Pop-Up Modal */}
      {signedUpEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl text-center border border-gray-100 transform transition-all">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[#2F4EA2] ring-8 ring-blue-50/50">
              <Mail01Icon size={40} className="text-[#2F4EA2]" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>

            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              An email has been sent to your email address:
              <br />
              <span className="font-semibold text-gray-900 text-base underline decoration-[#2F4EA2]/30">{signedUpEmail}</span>
            </p>

            <div className="mb-6 rounded-xl bg-blue-50 p-4 text-left border border-blue-200/80">
              <div className="flex items-start gap-2.5">
                <Alert02Icon size={18} className="mt-0.5 shrink-0 text-[#2F4EA2]" />
                <p className="text-xs text-[#2F4EA2] font-medium leading-relaxed">
                  Confirm the email and log in with your password.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSignedUpEmail(null);
                setMode('login');
                setPassword('');
                setError('');
                setInfo('An email has been sent to your email address. Confirm the email and log in with your password.');
              }}
              className="w-full rounded-xl py-3.5 font-semibold text-white transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: '#2F4EA2' }}
            >
              Go to Log In
            </button>

            <p className="mt-4 text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try again later.
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
            style={{ color: '#2F4EA2', border: '1px solid #BFC3C6' }}
          >
            <ArrowLeft01Icon size={14} />
            Back to Home
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#2F4EA2', marginBottom: '0.5rem' }}>
            Campus Guide
          </h1>
          <p style={{ color: '#000000', opacity: 0.6 }}>
            {mode === 'signup' && step === 'role' ? 'Join Campus Guide as:' : mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back'}
          </p>
        </div>

        {/* Role Selection Step */}
        {mode === 'signup' && step === 'role' ? (
          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelect('aspirant')}
              className="w-full rounded-xl border bg-white p-6 text-left transition-all duration-200 hover:border-[#2F4EA2] hover:shadow-lg"
              style={{ borderColor: '#BFC3C6' }}
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#EEF2FC' }}>
                  <Target01Icon size={28} color="#2F4EA2" />
                </span>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#111827' }}>Join as Aspirant</h3>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Preparing for JAMB and post-UTME</p>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: '#6B7280' }}>
                <li className="flex items-center gap-2">
                  <DocumentValidationIcon size={14} color="#2F4EA2" />
                  Post-UTME practice with past questions
                </li>
                <li className="flex items-center gap-2">
                  <Target01Icon size={14} color="#2F4EA2" />
                  Requirements and subject combinations
                </li>
                <li className="flex items-center gap-2">
                  <DocumentValidationIcon size={14} color="#2F4EA2" />
                  Aggregate score calculator
                </li>
              </ul>
            </button>

            <button
              onClick={() => handleRoleSelect('student')}
              className="w-full rounded-xl border bg-white p-6 text-left transition-all duration-200 hover:border-[#2F4EA2] hover:shadow-lg"
              style={{ borderColor: '#BFC3C6' }}
            >
              <div className="flex items-center gap-4 mb-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#EEF2FC' }}>
                  <GraduationScrollIcon size={28} color="#2F4EA2" />
                </span>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#111827' }}>Join as Student</h3>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Admitted and starting at UNIPORT</p>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: '#6B7280' }}>
                <li className="flex items-center gap-2">
                  <GraduationScrollIcon size={14} color="#2F4EA2" />
                  Freshers Hub: clearance, fees, registration
                </li>
                <li className="flex items-center gap-2">
                  <GraduationScrollIcon size={14} color="#2F4EA2" />
                  Medical check-in and orientation guides
                </li>
                <li className="flex items-center gap-2">
                  <GraduationScrollIcon size={14} color="#2F4EA2" />
                  Accommodation and campus events
                </li>
              </ul>
            </button>

            <div className="text-center pt-2">
              <button
                onClick={() => switchMode('login')}
                className="font-medium hover:underline text-sm"
                style={{ color: '#2F4EA2' }}
              >
                Already have an account? Log in
              </button>
            </div>
          </div>
        ) : (
        /* Form Step */
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-700 text-sm font-medium">{error}</div>
          )}
          {info && (
            <div className="mb-4 rounded bg-green-100 p-3 text-green-700 text-sm font-medium">{info}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="name" className="mb-2 block text-black font-medium">Full Name</label>
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
                  <label htmlFor="username" className="mb-2 block text-black font-medium">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full rounded-lg border px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 ${
                      usernameStatus === 'taken'
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                        : usernameStatus === 'available'
                        ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/10'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Choose a unique username"
                    required
                  />
                  <UsernameIndicator />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-black font-medium">Email Address</label>
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

            {mode !== 'forgot' && <div>
              <label htmlFor="password" className="mb-2 block text-black font-medium">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Enter your password'}
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
              {mode === 'signup' && password.length > 0 && password.length < 8 && (
                <p className="mt-1 text-sm text-red-600 font-medium">Password must be at least 8 characters.</p>
              )}
            </div>}

            {mode === 'login' && (
              <div className="-mt-2 text-right">
                <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium hover:underline" style={{ color: '#2F4EA2' }}>
                  Forgot password?
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="course" className="mb-2 block text-black font-medium">Course of Study / Faculty</label>
                  <select
                    id="course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select your course / Faculty</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Allied Health Sciences">Allied Health Sciences</option>
                    <option value="Basic Medical Sciences">Basic Medical Sciences</option>
                    <option value="Clinical Sciences">Clinical Sciences</option>
                    <option value="Communication and Media Studies">Communication and Media Studies</option>
                    <option value="Computing">Computing</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Education">Education</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Law">Law</option>
                    <option value="Management Sciences">Management Sciences</option>
                    <option value="Pharmaceutical Sciences">Pharmaceutical Sciences</option>
                    <option value="School of Science Laboratory Technology">School of Science Laboratory Technology</option>
                    <option value="Science">Science</option>
                    <option value="Social Sciences">Social Sciences</option>
                  </select>

                  {course && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <Alert02Icon size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      <p className="text-sm text-amber-700">
                        Choose carefully, your course determines the CBT questions and PDF materials you will receive.{' '}
                        <span className="font-semibold">This cannot be changed after signup.</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="email_opt_in"
                    type="checkbox"
                    checked={emailOptIn}
                    onChange={(e) => setEmailOptIn(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="email_opt_in" className="text-sm" style={{ color: '#6B7280' }}>
                    Send me updates about deadlines, new features and campus news from Campus Guide
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'signup' && (password.length < 8 || !username.trim() || usernameStatus === 'taken' || usernameStatus === 'checking'))}
              className="w-full rounded-lg py-3 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#2F4EA2' }}
            >
              {isLoading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Send Reset Link' : 'Log In'}
            </button>
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
                {mode === 'forgot' ? 'Back to login' : 'Already have an account? Log in'}
              </button>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
