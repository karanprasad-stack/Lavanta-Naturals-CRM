import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LavantaLogo } from '../components/ui/LavantaLogo';
import '../styles/login.css';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Determine active mode from URL or prop
  const currentMode = initialMode || (location.pathname === '/register' ? 'register' : 'login');
  const isRegister = currentMode === 'register';

  // --------------------------------------------------------------------------
  // Login Form States
  // --------------------------------------------------------------------------
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // --------------------------------------------------------------------------
  // Register Form States
  // --------------------------------------------------------------------------
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // --------------------------------------------------------------------------
  // Shared UI Interaction States
  // --------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load remembered login identifier on mount
  useEffect(() => {
    try {
      const savedIdentifier = localStorage.getItem('lavanta_remembered_identifier');
      const savedRemember = localStorage.getItem('lavanta_remember_me');
      if (savedRemember !== null) {
        setRememberMe(savedRemember === 'true');
      }
      if (savedIdentifier) {
        setLoginIdentifier(savedIdentifier);
      }
    } catch {
      // LocalStorage access may be restricted
    }
  }, []);

  // Clear messages & field errors on mode change
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});
  }, [isRegister]);

  // Password requirements calculation for Register
  const hasMinLength = regPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasLowercase = /[a-z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);

  // --------------------------------------------------------------------------
  // Mode Switch Handlers (Preserves static layout, updates URL)
  // --------------------------------------------------------------------------
  const switchToRegister = () => {
    navigate('/register');
  };

  const switchToLogin = () => {
    navigate('/login');
  };

  // --------------------------------------------------------------------------
  // Login Submit Handler
  // --------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const errors: Record<string, string> = {};
    const trimmedId = loginIdentifier.trim();

    if (!trimmedId) {
      errors.loginIdentifier = 'Please enter your email or mobile number.';
    } else {
      const isEmail = trimmedId.includes('@');
      const cleanDigits = trimmedId.replace(/[^0-9]/g, '');

      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedId)) {
          errors.loginIdentifier = 'Please enter a valid email address.';
        }
      } else {
        if (cleanDigits.length < 10) {
          errors.loginIdentifier = 'Please enter a valid 10-digit mobile number or email.';
        }
      }
    }

    if (!loginPassword) {
      errors.loginPassword = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await login(trimmedId, loginPassword);

      try {
        if (rememberMe) {
          localStorage.setItem('lavanta_remembered_identifier', trimmedId);
          localStorage.setItem('lavanta_remember_me', 'true');
        } else {
          localStorage.removeItem('lavanta_remembered_identifier');
          localStorage.setItem('lavanta_remember_me', 'false');
        }
      } catch {
        // Ignore localStorage restrictions
      }

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('disabled')) {
        setErrorMessage('Your account is currently inactive. Please contact your administrator.');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
        setErrorMessage('Unable to connect to the authentication service. Please check your network connection.');
      } else {
        setErrorMessage('Invalid email/mobile number or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Register Submit Handler
  // --------------------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const errors: Record<string, string> = {};

    if (!regName.trim()) {
      errors.regName = 'Please enter your full name.';
    }

    const cleanMobile = regMobile.replace(/[^0-9]/g, '');
    if (!regMobile.trim()) {
      errors.regMobile = 'Please enter your mobile number.';
    } else if (cleanMobile.length < 10) {
      errors.regMobile = 'Please enter a valid 10-digit mobile number.';
    }

    if (regEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(regEmail.trim())) {
        errors.regEmail = 'Please enter a valid email address.';
      }
    }

    if (!regPassword) {
      errors.regPassword = 'Please create a password.';
    } else if (!hasMinLength || !hasUppercase || !hasNumber) {
      errors.regPassword = 'Please create a stronger password meeting all requirements.';
    }

    if (!regConfirmPassword) {
      errors.regConfirmPassword = 'Please confirm your password.';
    } else if (regPassword !== regConfirmPassword) {
      errors.regConfirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // SECURITY: Public registration sets the default controlled role on the backend
      await register({
        name: regName.trim(),
        mobile: regMobile.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword
      });

      setSuccessMessage('Account created successfully. Accessing workspace...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 600);
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('in use')
      ) {
        setErrorMessage('An account with these details already exists.');
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
        setErrorMessage('Unable to connect to the registration service. Please check your network connection.');
      } else {
        setErrorMessage(msg || 'Failed to create account. Please verify your details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-root">
      {/* Top-Right Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-btn"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun size={18} className="theme-toggle-icon" aria-hidden="true" />
        ) : (
          <Moon size={18} className="theme-toggle-icon" aria-hidden="true" />
        )}
      </button>

      {/* ======================================================================
          LEFT SIDE: Brand & Workspace Introduction (100% STATIC & UNCHANGED)
          ====================================================================== */}
      <div className="login-showcase-column">
        <div className="showcase-container">
          {/* Brand Header */}
          <div className="showcase-header">
            <div className="showcase-logo-badge">
              <LavantaLogo variant="brand-image" size="sm" />
            </div>
            <div>
              <div className="showcase-brand-name">
                Lavanta Naturals
              </div>
              <div className="showcase-tagline-badge">
                Clean Skincare HQ
              </div>
            </div>
          </div>

          {/* Central Content */}
          <div className="showcase-content">
            <h1 className="showcase-title">
              Your workspace, all in one place.
            </h1>

            <p className="showcase-description">
              Securely access the Lavanta Naturals internal workspace for your team, operations, communication and daily work.
            </p>

            {/* Abstract Botanical & Workspace Visual Graphic */}
            <div className="showcase-visual-card">
              <div className="showcase-visual-row">
                <div className="showcase-feature-item">
                  <div className="showcase-feature-icon">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <div className="showcase-feature-title">Botanical Formulations & Inventory</div>
                    <div className="showcase-feature-subtitle">Real-time batch tracking & raw material controls</div>
                  </div>
                </div>
                <CheckCircle2 size={16} className="showcase-feature-check" />
              </div>

              <div className="showcase-visual-row">
                <div className="showcase-feature-item">
                  <div className="showcase-feature-icon">
                    <Shield size={15} />
                  </div>
                  <div>
                    <div className="showcase-feature-title">Enterprise Role-Governed Access</div>
                    <div className="showcase-feature-subtitle">Centralized permissions & end-to-end audit security</div>
                  </div>
                </div>
                <CheckCircle2 size={16} className="showcase-feature-check" />
              </div>

              <div className="showcase-visual-row">
                <div className="showcase-feature-item">
                  <div className="showcase-feature-icon">
                    <Lock size={15} />
                  </div>
                  <div>
                    <div className="showcase-feature-title">Encrypted Workspace Operations</div>
                    <div className="showcase-feature-subtitle">Multi-department collaboration & live reporting</div>
                  </div>
                </div>
                <CheckCircle2 size={16} className="showcase-feature-check" />
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="showcase-footer">
            <div className="showcase-security-dot" />
            <span>Internal workspace • Secure access</span>
          </div>
        </div>
      </div>

      {/* ======================================================================
          RIGHT SIDE: Authentication Form (NO TOP LOGO, IDENTICAL POSITIONING)
          ====================================================================== */}
      <div className="login-form-column">
        <div className="login-form-container">
          {/* ------------------------------------------------------------------
              STATE A: LOGIN VIEW
              ------------------------------------------------------------------ */}
          {!isRegister ? (
            <div key="auth-login" className="auth-form-enter">
              {/* Header (No logo above this!) */}
              <div className="login-header-group">
                <h2 className="login-heading">Welcome back</h2>
                <p className="login-subheading">Sign in to your Lavanta workspace</p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="login-error-banner" role="alert" aria-live="polite">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} noValidate>
                {/* Email or Mobile Number */}
                <div className="login-field-group">
                  <label htmlFor="login-identifier" className="login-field-label">
                    Email or Mobile Number
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="login-identifier"
                      type="text"
                      name="username"
                      autoComplete="username"
                      className={`login-input ${fieldErrors.loginIdentifier ? 'has-error' : ''}`}
                      placeholder="Enter your email or mobile number"
                      value={loginIdentifier}
                      disabled={isLoading}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        if (fieldErrors.loginIdentifier) {
                          setFieldErrors(prev => ({ ...prev, loginIdentifier: '' }));
                        }
                        if (errorMessage) setErrorMessage('');
                      }}
                      required
                    />
                  </div>
                  {fieldErrors.loginIdentifier && (
                    <div className="login-field-error-text" role="alert">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.loginIdentifier}</span>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="login-field-group">
                  <label htmlFor="login-password" className="login-field-label">
                    Password
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      className={`login-input ${fieldErrors.loginPassword ? 'has-error' : ''}`}
                      placeholder="Enter your password"
                      value={loginPassword}
                      disabled={isLoading}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (fieldErrors.loginPassword) {
                          setFieldErrors(prev => ({ ...prev, loginPassword: '' }));
                        }
                        if (errorMessage) setErrorMessage('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle-btn"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.loginPassword && (
                    <div className="login-field-error-text" role="alert">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.loginPassword}</span>
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="login-options-row">
                  <label className="login-remember-label">
                    <input
                      type="checkbox"
                      className="login-remember-checkbox"
                      checked={rememberMe}
                      disabled={isLoading}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="login-forgot-btn"
                    onClick={() => setIsForgotModalOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="login-spinner" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Register */}
              <div className="auth-switch-prompt">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={switchToRegister}
                >
                  Create account
                </button>
              </div>

              {/* Authorized Note */}
              <div className="login-authorized-note">
                <Lock size={12} />
                <span>Authorized Lavanta team members only.</span>
              </div>
            </div>
          ) : (
            /* ------------------------------------------------------------------
               STATE B: REGISTER VIEW (EXACT SAME COMPOSITION & BALANCED SPACING)
               ------------------------------------------------------------------ */
            <div key="auth-register" className="auth-form-enter register-form-block">
              {/* Header */}
              <div className="register-header-group">
                <h2 className="register-heading">Create your account</h2>
                <p className="register-subheading">Set up your account to access the Lavanta Naturals workspace.</p>
              </div>

              {/* Success Banner */}
              {successMessage && (
                <div className="register-success-banner">
                  <CheckCircle2 size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="register-error-banner" role="alert" aria-live="polite">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleRegisterSubmit} noValidate>
                {/* Full Name */}
                <div className="register-field-group">
                  <label htmlFor="reg-name" className="register-field-label">
                    Full Name
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="reg-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      className={`register-input ${fieldErrors.regName ? 'has-error' : ''}`}
                      placeholder="Enter your full name"
                      value={regName}
                      disabled={isLoading}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (fieldErrors.regName) setFieldErrors(prev => ({ ...prev, regName: '' }));
                        if (errorMessage) setErrorMessage('');
                      }}
                      required
                    />
                  </div>
                  {fieldErrors.regName && (
                    <div className="register-field-error-text" role="alert">
                      <AlertCircle size={11} />
                      <span>{fieldErrors.regName}</span>
                    </div>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="register-field-group">
                  <label htmlFor="reg-mobile" className="register-field-label">
                    Mobile Number
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="reg-mobile"
                      type="tel"
                      name="tel"
                      autoComplete="tel"
                      className={`register-input ${fieldErrors.regMobile ? 'has-error' : ''}`}
                      placeholder="Enter your mobile number"
                      value={regMobile}
                      disabled={isLoading}
                      onChange={(e) => {
                        setRegMobile(e.target.value);
                        if (fieldErrors.regMobile) setFieldErrors(prev => ({ ...prev, regMobile: '' }));
                        if (errorMessage) setErrorMessage('');
                      }}
                      required
                    />
                  </div>
                  {fieldErrors.regMobile && (
                    <div className="register-field-error-text" role="alert">
                      <AlertCircle size={11} />
                      <span>{fieldErrors.regMobile}</span>
                    </div>
                  )}
                </div>

                {/* Work Email (Optional) */}
                <div className="register-field-group">
                  <div className="register-label-row">
                    <label htmlFor="reg-email" className="register-field-label" style={{ marginBottom: 0 }}>
                      Work Email
                    </label>
                    <span className="register-optional-tag">
                      Optional
                    </span>
                  </div>
                  <div className="login-input-wrapper">
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      className={`register-input ${fieldErrors.regEmail ? 'has-error' : ''}`}
                      placeholder="Enter your work email"
                      value={regEmail}
                      disabled={isLoading}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (fieldErrors.regEmail) setFieldErrors(prev => ({ ...prev, regEmail: '' }));
                        if (errorMessage) setErrorMessage('');
                      }}
                    />
                  </div>
                  {fieldErrors.regEmail && (
                    <div className="register-field-error-text" role="alert">
                      <AlertCircle size={11} />
                      <span>{fieldErrors.regEmail}</span>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="register-field-group">
                  <label htmlFor="reg-password" className="register-field-label">
                    Password
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      className={`register-input ${fieldErrors.regPassword ? 'has-error' : ''}`}
                      placeholder="Create a password"
                      value={regPassword}
                      disabled={isLoading}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (fieldErrors.regPassword) setFieldErrors(prev => ({ ...prev, regPassword: '' }));
                        if (errorMessage) setErrorMessage('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle-btn"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {/* Password requirements indicators */}
                  <div className="register-password-requirements">
                    <span className={`req-pill ${hasMinLength ? 'valid' : ''}`}>
                      {hasMinLength ? <Check size={10} /> : null} 8+ chars
                    </span>
                    <span className={`req-pill ${hasUppercase ? 'valid' : ''}`}>
                      {hasUppercase ? <Check size={10} /> : null} 1 uppercase
                    </span>
                    <span className={`req-pill ${hasLowercase ? 'valid' : ''}`}>
                      {hasLowercase ? <Check size={10} /> : null} 1 lowercase
                    </span>
                    <span className={`req-pill ${hasNumber ? 'valid' : ''}`}>
                      {hasNumber ? <Check size={10} /> : null} 1 number
                    </span>
                  </div>

                  {fieldErrors.regPassword && (
                    <div className="register-field-error-text" role="alert">
                      <AlertCircle size={11} />
                      <span>{fieldErrors.regPassword}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="register-field-group register-field-group-last">
                  <label htmlFor="reg-confirm-password" className="register-field-label">
                    Confirm Password
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      id="reg-confirm-password"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      className={`register-input ${fieldErrors.regConfirmPassword ? 'has-error' : ''}`}
                      placeholder="Confirm your password"
                      value={regConfirmPassword}
                      disabled={isLoading}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        if (fieldErrors.regConfirmPassword) setFieldErrors(prev => ({ ...prev, regConfirmPassword: '' }));
                        if (errorMessage) setErrorMessage('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle-btn"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.regConfirmPassword && (
                    <div className="register-field-error-text" role="alert">
                      <AlertCircle size={11} />
                      <span>{fieldErrors.regConfirmPassword}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="register-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={17} className="login-spinner" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Login */}
              <div className="register-switch-prompt">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={switchToLogin}
                >
                  Sign in
                </button>
              </div>

              {/* Authorized Note */}
              <div className="login-authorized-note">
                <Lock size={12} />
                <span>Authorized Lavanta team members only.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================================
          Forgot Password Info Modal
          ====================================================================== */}
      {isForgotModalOpen && (
        <div
          className="login-modal-overlay"
          onClick={() => setIsForgotModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div
            className="login-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} className="login-modal-shield" />
                <h3 id="forgot-modal-title" className="login-modal-title">
                  Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="login-modal-close-btn"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className="login-modal-desc">
              For internal security and compliance, Lavanta CRM authentication credentials are managed directly by workspace administrators.
            </p>

            <div className="login-modal-support-box">
              <div className="login-modal-support-title">
                Assistance & Support Contact
              </div>
              <div className="login-modal-support-text">
                Please reach out to your HR operations partner or email IT administration at <strong className="login-modal-email">support@lavantanaturals.com</strong> with your staff ID.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="login-submit-btn"
              style={{ height: '42px', fontSize: '0.9rem' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
