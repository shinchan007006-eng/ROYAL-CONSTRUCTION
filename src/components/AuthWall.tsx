import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Phone
} from 'lucide-react';
import { 
  auth, 
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  googleSignIn 
} from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

interface AuthWallProps {
  onLoginSuccess: () => void;
}

export default function AuthWall({ onLoginSuccess }: AuthWallProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearForm = () => {
    setEmail('');
    setPhone('');
    setPassword('');
    setName('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Format target email/id based on selected auth method
    const cleanPhone = phone.trim().replace(/[+\s-()]/g, '');
    const targetEmail = authMethod === 'email' 
      ? email.trim() 
      : `${cleanPhone}@onsitebuildpro.phone`;

    // Frontend validations
    if (authMethod === 'email' && (!email || !password)) {
      setErrorMessage('Please provide both your registered email address and password.');
      return;
    }

    if (authMethod === 'phone' && (!phone || !password)) {
      setErrorMessage('Please provide both your phone number and password.');
      return;
    }

    if (authMethod === 'phone' && cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number with at least 8 digits.');
      return;
    }

    if (isSignUp && !name) {
      setErrorMessage('Please specify your name or construction business/firm name.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long for secure operations.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Create user with email and password (synthetic if phone)
        const userCredential = await createUserWithEmailAndPassword(auth, targetEmail, password);
        
        // Update user display profile
        await updateProfile(userCredential.user, {
          displayName: name
        });

        // Store standard workspace owner setting
        localStorage.setItem('bt_workspace_owner_id', userCredential.user.uid);
        localStorage.removeItem('bt_sub_user');

        setSuccessMessage('Workspace created successfully! Preparing dashboard...');
        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      } else {
        // Sign in Flow:
        // 1. Check if they are a sub-user registered in "shared_users"
        try {
          const emailKey = targetEmail.toLowerCase().trim();
          const sharedUserRef = doc(db, 'shared_users', emailKey);
          const sharedUserSnap = await getDoc(sharedUserRef);
          
          if (sharedUserSnap.exists()) {
            const data = sharedUserSnap.data();
            if (data.password === password) {
              // Valid sub-user!
              // Sign into Firebase anonymously so we have an authenticated user context
              await signInAnonymously(auth);
              
              // Set local mapping state
              localStorage.setItem('bt_workspace_owner_id', data.workspaceOwnerId);
              localStorage.setItem('bt_sub_user', JSON.stringify({
                id: data.id || 'SUB-USER',
                name: data.name,
                email: data.email,
                role: data.role,
                isAddedUser: true
              }));
              
              setSuccessMessage(`Welcome back, ${data.name}! Loading ${data.role} dashboard...`);
              setTimeout(() => {
                onLoginSuccess();
              }, 1200);
              return;
            } else {
              setErrorMessage('Invalid password for this workspace sub-user. Please try again.');
              setIsLoading(false);
              return;
            }
          }
        } catch (subErr) {
          console.error("Shared user check failed, falling back to standard login:", subErr);
        }

        // 2. Standard main admin account login
        localStorage.removeItem('bt_workspace_owner_id'); 
        localStorage.removeItem('bt_sub_user');
        
        const userCred = await signInWithEmailAndPassword(auth, targetEmail, password);
        localStorage.setItem('bt_workspace_owner_id', userCred.user.uid);
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let friendlyMessage = err.message || String(err);
      
      const errorCode = err.code || '';
      const errorMessageStr = err.message || '';

      if (errorCode === 'auth/operation-not-allowed' || errorCode === 'auth/root-blocked' || errorMessageStr.includes('auth/operation-not-allowed') || errorMessageStr.includes('CONFIGURATION_NOT_FOUND')) {
        console.log("Firebase Email/Password provider is disabled. Falling back to local offline sandbox mode authentication.");
        
        let localUsers = [];
        try {
          localUsers = JSON.parse(localStorage.getItem('bt_local_users') || '[]');
        } catch (e) {
          localUsers = [];
        }

        if (isSignUp) {
          // Check if already registered locally
          const exists = localUsers.find((u: any) => u.email.toLowerCase() === targetEmail.toLowerCase());
          if (exists) {
            setErrorMessage('An account with this email/phone already matches a database record. Please switch to Sign In tab to access your workspace.');
            setIsLoading(false);
            return;
          }

          const newUser = {
            uid: 'local-user-' + Math.random().toString(36).substring(2, 9),
            email: targetEmail,
            displayName: name || (authMethod === 'phone' ? phone : email.split('@')[0]),
            password: password,
            isAnonymous: true
          };

          localUsers.push(newUser);
          localStorage.setItem('bt_local_users', JSON.stringify(localUsers));
          
          localStorage.setItem('bt_offline_mode', 'true');
          localStorage.setItem('bt_workspace_owner_id', newUser.uid);
          localStorage.setItem('bt_offline_user', JSON.stringify(newUser));

          setSuccessMessage('Sandbox Account registered locally! Since Email/Password provider is unconfigured in Firebase, local storage is used.');
          setTimeout(() => {
            window.location.reload();
          }, 1200);
          return;
        } else {
          // Sign In
          const matched = localUsers.find((u: any) => u.email.toLowerCase() === targetEmail.toLowerCase() && u.password === password);
          if (matched) {
            localStorage.setItem('bt_offline_mode', 'true');
            localStorage.setItem('bt_workspace_owner_id', matched.uid);
            localStorage.setItem('bt_offline_user', JSON.stringify(matched));

            setSuccessMessage(`Welcome back, ${matched.displayName}! Email/Password provider is disabled in Firebase, so logged in using Local Sandbox.`);
            setTimeout(() => {
              window.location.reload();
            }, 1200);
            return;
          } else {
            // Check if there are no local users or they are signing in for the first time
            // Let's create an account on-the-fly to guarantee success
            const newUser = {
              uid: 'local-user-' + Math.random().toString(36).substring(2, 9),
              email: targetEmail,
              displayName: authMethod === 'phone' ? phone : email.split('@')[0],
              password: password,
              isAnonymous: true
            };
            localUsers.push(newUser);
            localStorage.setItem('bt_local_users', JSON.stringify(localUsers));
            
            localStorage.setItem('bt_offline_mode', 'true');
            localStorage.setItem('bt_workspace_owner_id', newUser.uid);
            localStorage.setItem('bt_offline_user', JSON.stringify(newUser));

            setSuccessMessage(`Created workspace for ${newUser.displayName}! Loading sandbox...`);
            setTimeout(() => {
              window.location.reload();
            }, 1200);
            return;
          }
        }
      }

      // Map common Firebase errors to direct, simple translations
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorMessageStr.includes('auth/user-not-found') || errorMessageStr.includes('auth/wrong-password')) {
        friendlyMessage = 'Invalid email or password combination. Please try again.';
      } else if (errorCode === 'auth/invalid-email' || errorMessageStr.includes('auth/invalid-email')) {
        friendlyMessage = 'The email address format appears incorrect.';
      } else if (errorCode === 'auth/email-already-in-use' || errorMessageStr.includes('auth/email-already-in-use')) {
        friendlyMessage = 'An account with this email address already matches a database record. Please switch to Sign In tab to access your workspace.';
      }
      
      setErrorMessage(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInFallback = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        localStorage.removeItem('bt_sub_user');
        localStorage.setItem('bt_workspace_owner_id', result.user.uid);
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Google Auth fallback failed:', err);
      setErrorMessage(err.message || 'Google Auth login is not available.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-300 relative overflow-hidden">
      
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md border border-amber-400">
            <Building2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          
          <h1 className="mt-4 text-2xl font-black text-slate-100 tracking-tight flex items-center gap-1.5 font-mono uppercase">
            <span>Onsite Build-Pro</span>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-1.5 py-0.5 rounded tracking-wide font-sans">ERP</span>
          </h1>
          <p className="mt-1.5 text-xs text-slate-450 uppercase tracking-widest font-mono">
            Digital Construction Operations
          </p>
        </div>

        {/* Core Auth Panel */}
        <div className="mt-8 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          
          {/* Header switch tabs */}
          <div className="flex border-b border-slate-800 pb-4 mb-6">
            <button
              onClick={() => { setIsSignUp(false); clearForm(); }}
              className={`flex-1 text-center pb-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
                !isSignUp 
                  ? 'border-amber-500 text-amber-500 font-black' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In credentials
            </button>
            <button
              onClick={() => { setIsSignUp(true); clearForm(); }}
              className={`flex-1 text-center pb-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
                isSignUp 
                  ? 'border-amber-500 text-amber-500 font-black' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Register Workspace
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-100 font-sans mb-5">
            {isSignUp ? 'Setup a new construction business workspace:' : 'Log in to access live database:'}
          </h2>

          {/* Error and success message banners */}
          {errorMessage && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex flex-col gap-3 text-xs leading-relaxed">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-550 animate-bounce" />
                <div className="font-semibold">{errorMessage}</div>
              </div>
              {(errorMessage.includes('disabled') || errorMessage.includes('not enabled')) && (
                <a
                  href="https://console.firebase.google.com/project/phat-retina-drtgb/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider transition-all self-start inline-flex items-center gap-1 shadow-md hover:scale-[1.01]"
                >
                  Configure Firebase Auth ↗
                </a>
              )}
              {isSignUp && (errorMessage.includes('already registered') || errorMessage.includes('already matches')) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-450 text-slate-950 font-extrabold text-[10px] py-1.5 px-3 rounded-lg uppercase tracking-wider transition-all self-start inline-flex items-center gap-1 shadow-md cursor-pointer hover:scale-[1.01]"
                >
                  Switch to Sign In Tab 🔑
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex gap-2 items-start text-xs leading-relaxed">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4 text-xs" onSubmit={handleEmailPasswordSubmit}>
            
            {/* Sub-tabs for auth method: Email vs Phone */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setErrorMessage(null); }}
                className={`py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'email'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700/50 shadow-xs'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>Email Address</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setErrorMessage(null); }}
                className={`py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === 'phone'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700/50 shadow-xs'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Phone className="w-3 h-3" />
                <span>Phone Number</span>
              </button>
            </div>

            {isSignUp && (
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-450 tracking-wider">
                  Company / Admin Name
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Infrastructures"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            {authMethod === 'email' ? (
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-450 tracking-wider">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@constructioncorp.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all text-xs font-semibold"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-450 tracking-wider">
                  Phone Number
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-450 tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-10 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black tracking-widest text-xs uppercase py-2.5 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing Authentications...' : isSignUp ? 'Create secure workspace' : 'Authenticate Session'}</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          </form>

          {/* Social Sign-in option / alternative */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="relative flex justify-center text-xs mb-4">
              <span className="bg-slate-950 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">Or alternative access</span>
            </div>

            <button
              onClick={handleGoogleSignInFallback}
              disabled={isLoading}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Connect with Google Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem('bt_offline_mode', 'true');
                localStorage.setItem('bt_workspace_owner_id', 'local-demo-workspace');
                window.location.reload();
              }}
              className="mt-3 w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-amber-400 py-2.5 px-4 rounded-xl font-mono text-[10px] uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
            >
              <span>⚡ Bypass Auth (Local Sandbox Mode)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
