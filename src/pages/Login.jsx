import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoginStatus } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

// ─── 3D Tilt Card wrapper ───────────────────────────────────────
function TiltCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01,1.01,1.01)`,
      transition: 'transform 0.1s ease-out',
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      transition: 'transform 0.5s ease-out',
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// ─── Typewriter heading ─────────────────────────────────────────
function TypewriterText({ text, delay = 0 }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeout;
    timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 1500);
        }
      }, 80);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span>
      {displayed}
      {showCursor && <span className="login-cursor">|</span>}
    </span>
  );
}

// ─── Ripple Button ──────────────────────────────────────────────
function RippleButton({ children, className, onClick, disabled, id, style: btnStyle }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
    onClick?.(e);
  };

  return (
    <button
      type="submit"
      className={className}
      onClick={handleClick}
      disabled={disabled}
      id={id}
      style={{ ...btnStyle, position: 'relative', overflow: 'hidden' }}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="login-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      {children}
    </button>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('owner');
  const [loading, setLoading] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => setTimeout(() => setMounted(true), 50));
  }, []);

  const { data: statusData } = useLoginStatus(pendingRequestId, {
    refetchInterval: pendingRequestId && timeLeft > 0 ? 3000 : false,
  });

  useEffect(() => {
    if (!pendingRequestId) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setPendingRequestId(null); toast.error('Login request timed out.'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingRequestId]);

  useEffect(() => {
    if (statusData?.status === 'approved') { loginWithToken(statusData); toast.success('Login approved by Owner!'); navigate('/entry'); setPendingRequestId(null); }
    else if (statusData?.status === 'rejected') { setPendingRequestId(null); toast.error('Login request rejected by Owner.'); }
  }, [statusData, loginWithToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Please enter username and password'); return; }
    
    // Start suck-in animation
    setIsProcessing(true);
    setLoading(true);

    // Wait for the card to be fully sucked into the printer (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const res = await login(username, password, loginType);
      if (res?.status === 'pending') { 
        setPendingRequestId(res.request_id); 
        setTimeLeft(120); 
        toast.success('Login request sent. Waiting for approval...'); 
        setIsProcessing(false); // Pop back out to show pending UI
      } else { 
        toast.success(`Welcome, ${res.full_name || res.username}!`); 
        // Small delay so toast is visible before navigating
        setTimeout(() => {
          navigate(res.role === 'owner' ? '/dashboard' : '/entry');
        }, 300);
      }
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Login failed. Check your credentials.';
      toast.error(msg);
      setIsProcessing(false); // Pop back out to show error
    } finally { 
      setLoading(false); 
    }
  };

  const isOwner = loginType === 'owner';

  // Bright, vibrant palette
  const palette = isOwner
    ? { bg1: '#fffdf7', bg2: '#fff8e1', accent: '#f59e0b', accentLight: '#fbbf24', accentSoft: 'rgba(251,191,36,0.12)', grad: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f97316 100%)', text: '#92400e', textSoft: '#b45309', blob1: 'rgba(251,191,36,0.25)', blob2: 'rgba(249,115,22,0.18)', blob3: 'rgba(254,243,199,0.6)' }
    : { bg1: '#f0f7ff', bg2: '#e8f4fd', accent: '#3b82f6', accentLight: '#60a5fa', accentSoft: 'rgba(96,165,250,0.12)', grad: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #818cf8 100%)', text: '#1e3a8a', textSoft: '#2563eb', blob1: 'rgba(96,165,250,0.22)', blob2: 'rgba(129,140,248,0.18)', blob3: 'rgba(219,234,254,0.6)' };

  return (
    <div
      className={`login-root ${isOwner ? 'theme-owner' : ''}`}
      style={{ '--accent': palette.accent, '--accent-light': palette.accentLight }}
    >
      {/* ── Animated background ── */}
      <div className="login-bg" style={{ background: `linear-gradient(160deg, ${palette.bg1} 0%, ${palette.bg2} 50%, white 100%)` }}>
        {/* Morphing blobs */}
        <div className="login-blob login-blob-1" style={{ background: palette.blob1 }} />
        <div className="login-blob login-blob-2" style={{ background: palette.blob2 }} />
        <div className="login-blob login-blob-3" style={{ background: palette.blob3 }} />

        {/* Grid pattern */}
        <div className="login-grid-pattern" />

        {/* Floating dots */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="login-dot"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: palette.accent,
              opacity: Math.random() * 0.2 + 0.05,
              animationDuration: `${Math.random() * 15 + 10}s`,
              animationDelay: `${Math.random() * -15}s`,
            }}
          />
        ))}

        {/* Wave SVG at bottom */}
        <svg className="login-wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,40 1440,60 L1440,120 L0,120 Z"
            fill={palette.accentSoft}
          />
          <path
            d="M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z"
            fill={isOwner ? 'rgba(251,191,36,0.06)' : 'rgba(96,165,250,0.06)'}
            className="login-wave-path-2"
          />
        </svg>
      </div>

      {/* ── Content ── */}
      <div className={`login-content ${mounted ? 'login-content--visible' : ''}`}>

        {/* Logo */}
        <div className={`login-logo-wrap ${mounted ? 'login-logo-wrap--visible' : ''}`}>
          <div className="login-logo-ring">
            <div className="login-logo-ring-inner" style={{ background: palette.grad }}>
              <span className="login-logo-letter">V</span>
            </div>
            <div className="login-logo-ring-glow" style={{ background: palette.grad }} />
            {/* Orbiting dots */}
            <div className="login-orbit">
              <div className="login-orbit-dot" style={{ background: palette.accent }} />
            </div>
            <div className="login-orbit login-orbit-2">
              <div className="login-orbit-dot" style={{ background: palette.accentLight }} />
            </div>
          </div>

          <h1 className="login-title" style={{ color: palette.text }}>
            <TypewriterText text="VINO Browsing" delay={400} />
          </h1>
          <p className="login-subtitle" style={{ color: palette.textSoft }}>
            Service Center Management System
          </p>
        </div>

        {/* Real Printer Machine */}
        <div className={`login-real-printer ${mounted ? 'login-real-printer--visible' : ''} ${isProcessing ? 'login-real-printer--processing' : ''}`}>
          <svg viewBox="0 0 460 160" xmlns="http://www.w3.org/2000/svg" className="login-printer-svg">
            <defs>
              <linearGradient id="printerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
            </defs>
            {/* Back Paper Tray */}
            <path d="M140 60 L160 10 L300 10 L320 60 Z" fill="#64748b" />
            <path d="M150 20 L310 20 L318 60 L142 60 Z" fill="#f8fafc" />
            <path d="M150 20 L310 20 L310 25 L148 25 Z" fill="#e2e8f0" />
            <line x1="155" y1="35" x2="305" y2="35" stroke="#cbd5e1" strokeWidth="1.5" />
            
            {/* Main Printer Body */}
            <path d="M30 110 L70 50 L390 50 L430 110 Z" fill="url(#printerGrad)" />
            
            {/* Control Panel */}
            <path d="M310 50 L320 50 L400 100 L320 100 Z" fill="#e2e8f0" opacity="0.5" />
            <rect x="320" y="65" width="80" height="30" rx="4" fill="#1e293b" />
            <rect x="325" y="68" width="45" height="24" rx="2" fill="#0ea5e9" className="printer-screen-anim" />
            
            {/* Logo */}
            <text x="80" y="85" fontFamily="'Inter', sans-serif" fontSize="20" fontWeight="900" fill="#94a3b8" letterSpacing="3">VINO</text>
            
            {/* Status Lights */}
            <circle cx="385" cy="80" r="5" fill="#22c55e" className="printer-green-light-real" />
            <circle cx="385" cy="80" r="3" fill="#ffffff" opacity="0.3" />
            
            {/* Base */}
            <rect x="10" y="110" width="440" height="40" rx="12" fill="#334155" />
            <rect x="10" y="110" width="440" height="15" rx="6" fill="#475569" />
            
            {/* Output Tray / Slit */}
            <path d="M20 130 L440 130 L425 150 L35 150 Z" fill="#0f172a" />
            <rect x="30" y="145" width="400" height="5" fill="#020617" />
          </svg>
        </div>

        {/* Card */}
        <div className={`login-print-wrap ${mounted && !isProcessing ? 'login-print-wrap--visible' : ''} ${isProcessing ? 'login-print-wrap--sucked-in' : ''}`}>
          <TiltCard className="login-card-wrap">
            {/* Glass highlight */}
            <div className="login-card-highlight" />

          <div className="login-card">
            {pendingRequestId ? (
              /* ── Approval Waiting State ── */
              <div className="login-pending">
                <div className="login-pending-spinner">
                  <svg className="login-pending-svg" viewBox="0 0 50 50">
                    <circle className="login-pending-track" cx="25" cy="25" r="20" fill="none" strokeWidth="3" stroke={isOwner ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.15)'} />
                    <circle className="login-pending-progress" cx="25" cy="25" r="20" fill="none" strokeWidth="3" stroke={palette.accent} strokeLinecap="round" />
                  </svg>
                  <span className="login-pending-emoji">⏳</span>
                </div>
                <h2 className="login-pending-title">Waiting for Approval</h2>
                <p className="login-pending-desc">Your login request has been sent to the owner.</p>
                <div className="login-pending-timer" style={{ color: palette.accent }}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="login-pending-bar-bg">
                  <div className="login-pending-bar" style={{ width: `${(timeLeft / 120) * 100}%`, background: palette.grad }} />
                </div>
                <button onClick={() => setPendingRequestId(null)} className="login-pending-cancel" style={{ color: palette.accent }}>
                  Cancel Request
                </button>
              </div>
            ) : (
              /* ── Login Form ── */
              <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} />
                <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} />

                {/* Tab Switcher */}
                <div className={`login-anim-item ${mounted ? 'login-anim-item--visible' : ''}`} style={{ '--delay': '0.35s' }}>
                  <div className="login-tabs">
                    <div
                      className="login-tab-indicator"
                      style={{
                        transform: loginType === 'owner' ? 'translateX(0)' : 'translateX(100%)',
                        background: palette.grad,
                      }}
                    />
                    <button type="button" className={`login-tab ${loginType === 'owner' ? 'login-tab--active' : ''}`} onClick={() => setLoginType('owner')}>
                      <span className="login-tab-icon">👑</span> Owner
                    </button>
                    <button type="button" className={`login-tab ${loginType === 'staff' ? 'login-tab--active' : ''}`} onClick={() => setLoginType('staff')}>
                      <span className="login-tab-icon">👤</span> Staff
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div className={`login-anim-item ${mounted ? 'login-anim-item--visible' : ''}`} style={{ '--delay': '0.45s' }}>
                  <label className="login-label" htmlFor="username">Username</label>
                  <div className={`login-input-wrap ${focusedField === 'username' ? 'login-input-wrap--focused' : ''}`}
                    style={{ '--ring-color': palette.accent }}>
                    <div className="login-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'username' ? palette.accent : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      type="text"
                      className="login-input"
                      placeholder={`Enter ${loginType} username`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div className={`login-anim-item ${mounted ? 'login-anim-item--visible' : ''}`} style={{ '--delay': '0.55s' }}>
                  <label className="login-label" htmlFor="password">Password</label>
                  <div className={`login-input-wrap ${focusedField === 'password' ? 'login-input-wrap--focused' : ''}`}
                    style={{ '--ring-color': palette.accent }}>
                    <div className="login-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedField === 'password' ? palette.accent : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="login-input"
                      placeholder={`Enter ${loginType} password`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="new-password"
                    />
                    <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className={`login-anim-item ${mounted ? 'login-anim-item--visible' : ''}`} style={{ '--delay': '0.65s' }}>
                  <RippleButton
                    id="login-btn"
                    disabled={loading}
                    className="login-btn"
                    style={{ background: palette.grad }}
                  >
                    <span className="login-btn-content">
                      {loading ? (
                        <>
                          <span className="login-btn-spinner" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                          Sign In
                        </>
                      )}
                    </span>
                  </RippleButton>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className={`login-footer ${mounted ? 'login-footer--visible' : ''}`}>
              <span className="login-footer-dot" style={{ background: '#34d399' }} />
              vinobrowsing.com
            </div>
          </div>
          </TiltCard>
        </div>

        <p className={`login-powered ${mounted ? 'login-powered--visible' : ''}`} style={{ color: palette.textSoft }}>
          Powered by VINO • Premium Service Management
        </p>
      </div>

      {/* ── All animations ── */}
      <style>{`
        /* ============ ROOT ============ */
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ============ BACKGROUND ============ */
        .login-bg {
          position: absolute; inset: 0;
          transition: background 0.7s ease;
        }

        /* Grid */
        .login-grid-pattern {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: loginGridMove 20s linear infinite;
        }
        @keyframes loginGridMove {
          0% { transform: translate(0,0); }
          100% { transform: translate(60px,60px); }
        }

        /* Morphing blobs */
        .login-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          transition: background 0.7s ease;
        }
        .login-blob-1 {
          width: 500px; height: 500px;
          top: -15%; left: -10%;
          animation: loginBlob1 22s ease-in-out infinite;
        }
        .login-blob-2 {
          width: 420px; height: 420px;
          bottom: -10%; right: -8%;
          animation: loginBlob2 26s ease-in-out infinite;
        }
        .login-blob-3 {
          width: 350px; height: 350px;
          top: 40%; left: 45%;
          animation: loginBlob3 18s ease-in-out infinite;
        }
        @keyframes loginBlob1 {
          0%,100% { transform: translate(0,0) scale(1); border-radius: 50%; }
          25% { transform: translate(60px,40px) scale(1.15); border-radius: 40% 60% 55% 45%; }
          50% { transform: translate(30px,80px) scale(0.9); border-radius: 55% 45% 50% 50%; }
          75% { transform: translate(-20px,50px) scale(1.08); border-radius: 45% 55% 60% 40%; }
        }
        @keyframes loginBlob2 {
          0%,100% { transform: translate(0,0) scale(1); border-radius: 50%; }
          25% { transform: translate(-50px,-30px) scale(1.1); border-radius: 60% 40% 45% 55%; }
          50% { transform: translate(-30px,-70px) scale(0.95); border-radius: 45% 55% 50% 50%; }
          75% { transform: translate(40px,-40px) scale(1.12); border-radius: 50% 50% 40% 60%; }
        }
        @keyframes loginBlob3 {
          0%,100% { transform: translate(-50%,-50%) scale(1); border-radius: 50%; }
          33% { transform: translate(-50%,-50%) scale(1.25); border-radius: 40% 60% 50% 50%; }
          66% { transform: translate(-50%,-50%) scale(0.85); border-radius: 55% 45% 60% 40%; }
        }

        /* Floating dots */
        .login-dot {
          position: absolute;
          border-radius: 50%;
          animation: loginDotFloat ease-in-out infinite;
        }
        @keyframes loginDotFloat {
          0%,100% { transform: translate(0,0); }
          25% { transform: translate(25px,-40px); }
          50% { transform: translate(-15px,-80px); }
          75% { transform: translate(35px,-40px); }
        }

        /* Wave */
        .login-wave {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 120px;
        }
        .login-wave-path-2 {
          animation: loginWaveMove 8s ease-in-out infinite;
        }
        @keyframes loginWaveMove {
          0%,100% { d: path("M0,80 C360,40 720,100 1080,60 C1260,40 1380,80 1440,70 L1440,120 L0,120 Z"); }
          50% { d: path("M0,70 C360,100 720,30 1080,80 C1260,60 1380,50 1440,60 L1440,120 L0,120 Z"); }
        }

        /* ============ CONTENT ============ */
        .login-content {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          opacity: 0; transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-content--visible {
          opacity: 1; transform: translateY(0);
        }

        /* ============ LOGO ============ */
        .login-logo-wrap {
          text-align: center;
          margin-bottom: 2rem;
          opacity: 0; transform: translateY(-20px) scale(0.9);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
        }
        .login-logo-wrap--visible {
          opacity: 1; transform: translateY(0) scale(1);
        }

        .login-logo-ring {
          position: relative;
          display: inline-block;
          width: 80px; height: 80px;
        }
        .login-logo-ring-inner {
          width: 80px; height: 80px;
          border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 2;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15);
          animation: loginLogoBreath 4s ease-in-out infinite;
        }
        @keyframes loginLogoBreath {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        .login-logo-ring-glow {
          position: absolute; inset: -6px;
          border-radius: 26px;
          filter: blur(20px);
          opacity: 0.35;
          z-index: 1;
          animation: loginGlowPulse 3s ease-in-out infinite;
        }
        @keyframes loginGlowPulse {
          0%,100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        .login-logo-letter {
          font-size: 2rem; font-weight: 900;
          color: white;
          text-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        /* Orbiting dots */
        .login-orbit {
          position: absolute; inset: -12px;
          animation: loginOrbitSpin 6s linear infinite;
        }
        .login-orbit-2 {
          inset: -18px;
          animation-duration: 9s;
          animation-direction: reverse;
        }
        .login-orbit-dot {
          position: absolute;
          width: 6px; height: 6px;
          border-radius: 50%;
          top: 50%; left: 0;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 8px currentColor;
        }
        @keyframes loginOrbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-title {
          font-size: 1.9rem;
          font-weight: 800;
          margin: 1.2rem 0 0.3rem;
          letter-spacing: -0.02em;
        }
        .login-cursor {
          animation: loginBlink 0.7s step-end infinite;
          font-weight: 300;
          opacity: 0.6;
        }
        @keyframes loginBlink {
          0%,100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .login-subtitle {
          font-size: 0.85rem;
          font-weight: 500;
          opacity: 0.65;
          letter-spacing: 0.02em;
        }

        /* ============ REAL PRINTER MACHINE ============ */
        .login-real-printer {
          width: calc(100% + 40px);
          max-width: 460px;
          margin: 0 auto -20px auto; /* Overlaps the card by 20px */
          position: relative;
          z-index: 20;
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }
        .login-real-printer--visible {
          opacity: 1;
          transform: translateY(0);
        }
        .login-printer-svg {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.15));
        }

        /* Screen Glow & Pulse */
        .printer-screen-anim {
          animation: printerScreenPulse 2s ease-in-out infinite;
        }
        @keyframes printerScreenPulse {
          0%, 100% { fill: #0ea5e9; }
          50% { fill: #38bdf8; }
        }

        /* Status Light */
        .printer-green-light-real {
          animation: printerGreenBlink 0.5s ease-in-out infinite alternate 0.8s;
        }
        @keyframes printerGreenBlink {
          0% { fill: #22c55e; filter: drop-shadow(0 0 2px #22c55e); }
          100% { fill: #4ade80; filter: drop-shadow(0 0 6px #4ade80); }
        }

        /* Printer shaking slightly while printing */
        .login-real-printer--visible .login-printer-svg {
          animation: printerShake 0.1s linear 8 0.8s; /* Shakes for 0.8s */
        }
        .login-real-printer--processing .login-printer-svg {
          animation: printerShake 0.1s linear infinite !important;
        }
        @keyframes printerShake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          25% { transform: translate(-1px, -2px) rotate(-1deg); }
          50% { transform: translate(-2px, 0px) rotate(1deg); }
          75% { transform: translate(2px, 1px) rotate(0deg); }
          100% { transform: translate(1px, -1px) rotate(0deg); }
        }

        /* ============ CARD PRINTING POP ============ */
        .login-print-wrap {
          position: relative;
          opacity: 0;
          clip-path: inset(0 0 100% 0);
          transform: translateY(-80px);
          padding-top: 5px; /* Ensure TiltCard has top padding for shadows */
        }
        .login-print-wrap--visible {
          /* Using bouncy bezier for a "pop out" effect */
          animation: printCardPop 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards;
        }
        .login-print-wrap--sucked-in {
          /* Quick suck back in effect */
          animation: suckCardIn 0.8s cubic-bezier(0.5, 0, 0.2, 1) forwards;
        }
        @keyframes printCardPop {
          0% {
            opacity: 1;
            clip-path: inset(0 0 100% 0);
            transform: translateY(-80px) scale(0.95);
          }
          100% {
            opacity: 1;
            clip-path: inset(-50% -50% -50% -50%); /* generous bounds */
            transform: translateY(0) scale(1);
          }
        }
        @keyframes suckCardIn {
          0% {
            opacity: 1;
            clip-path: inset(-50% -50% -50% -50%);
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 1;
            clip-path: inset(0 0 100% 0);
            transform: translateY(-80px) scale(0.95);
          }
        }

        /* ============ CARD ============ */
        .login-card-wrap {
          position: relative;
        }

        .login-card-highlight {
          position: absolute;
          top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          z-index: 3;
        }

        .login-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px) saturate(1.5);
          -webkit-backdrop-filter: blur(24px) saturate(1.5);
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.7);
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.04),
            0 20px 50px -12px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.6);
        }

        /* ============ FORM ============ */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Staggered entrance */
        .login-anim-item {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--delay, 0s);
        }
        .login-anim-item--visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Tabs */
        .login-tabs {
          display: flex;
          position: relative;
          background: #f1f5f9;
          border-radius: 16px;
          padding: 4px;
        }
        .login-tab-indicator {
          position: absolute;
          top: 4px; bottom: 4px;
          width: calc(50% - 4px);
          left: 4px;
          border-radius: 12px;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .login-tab {
          flex: 1;
          padding: 0.75rem;
          background: none;
          border: none;
          font-weight: 700;
          font-size: 0.875rem;
          color: #64748b;
          cursor: pointer;
          position: relative;
          z-index: 2;
          transition: color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-family: inherit;
        }
        .login-tab--active {
          color: white;
        }
        .login-tab-icon {
          font-size: 1rem;
        }

        /* Label */
        .login-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
          letter-spacing: 0.01em;
        }

        /* Input wrapper */
        .login-input-wrap {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          padding: 0 1rem;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .login-input-wrap--focused {
          background: white;
          border-color: var(--ring-color, #3b82f6);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--ring-color, #3b82f6) 12%, transparent);
        }
        .login-input-icon {
          flex-shrink: 0;
          display: flex;
          margin-right: 0.6rem;
          transition: all 0.3s;
        }
        .login-input {
          flex: 1;
          padding: 0.85rem 0;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          color: #1e293b;
          outline: none;
          font-family: inherit;
        }
        .login-input:focus, .login-input:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus,
        .login-input:-webkit-autofill:active {
          transition: background-color 5000s ease-in-out 0s;
          -webkit-text-fill-color: #1e293b !important;
        }
        .login-input::placeholder { color: #94a3b8; }
        .login-eye {
          flex-shrink: 0;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
          display: flex;
        }
        .login-eye:hover { color: #475569; }

        /* ============ BUTTON ============ */
        .login-btn {
          width: 100%;
          padding: 0.95rem;
          border: none;
          border-radius: 14px;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 8px 30px -8px rgba(0,0,0,0.2);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
        }
        .login-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px -8px rgba(0,0,0,0.25);
        }
        .login-btn:not(:disabled):active {
          transform: translateY(0) scale(0.98);
        }
        .login-btn:disabled {
          opacity: 0.6; cursor: not-allowed;
        }
        .login-btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          z-index: 2;
        }
        .login-btn-spinner {
          width: 20px; height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Ripple */
        .login-ripple {
          position: absolute;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.45);
          transform: translate(-50%,-50%) scale(0);
          animation: loginRippleOut 0.7s ease-out forwards;
          pointer-events: none;
        }
        @keyframes loginRippleOut {
          to { transform: translate(-50%,-50%) scale(25); opacity: 0; }
        }

        /* ============ PENDING STATE ============ */
        .login-pending {
          text-align: center;
          padding: 1.5rem 0;
          animation: fadeSlideIn 0.5s ease-out;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-pending-spinner {
          width: 70px; height: 70px;
          margin: 0 auto 1.2rem;
          position: relative;
        }
        .login-pending-svg {
          width: 100%; height: 100%;
          animation: spin 1.5s linear infinite;
        }
        .login-pending-progress {
          stroke-dasharray: 50 80;
        }
        .login-pending-emoji {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
        }
        .login-pending-title {
          font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.4rem;
        }
        .login-pending-desc {
          font-size: 0.85rem; color: #64748b; margin-bottom: 1.2rem;
        }
        .login-pending-timer {
          font-size: 3rem; font-weight: 900; line-height: 1;
          margin-bottom: 0.8rem;
          animation: loginTimerBounce 1s ease-in-out infinite;
        }
        @keyframes loginTimerBounce {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .login-pending-bar-bg {
          width: 80%; margin: 0 auto 1.2rem;
          height: 4px; border-radius: 2px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .login-pending-bar {
          height: 100%; border-radius: 2px;
          transition: width 1s linear;
        }
        .login-pending-cancel {
          background: none; border: none;
          font-weight: 700; font-size: 0.85rem;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          font-family: inherit;
          transition: opacity 0.2s;
        }
        .login-pending-cancel:hover { opacity: 0.7; }

        /* ============ FOOTER ============ */
        .login-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0,0,0,0.05);
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          opacity: 0;
          transition: opacity 0.6s ease 0.8s;
        }
        .login-footer--visible { opacity: 1; }
        .login-footer-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: loginStatusBlink 2s ease-in-out infinite;
        }
        @keyframes loginStatusBlink {
          0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(52,211,153,0); }
        }

        .login-powered {
          text-align: center;
          font-size: 0.72rem;
          font-weight: 500;
          margin-top: 1.5rem;
          opacity: 0;
          transition: opacity 0.6s ease 0.9s;
        }
        .login-powered--visible { opacity: 0.4; }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 480px) {
          .login-card { padding: 1.5rem; }
          .login-title { font-size: 1.5rem; }
          .login-logo-ring { width: 64px; height: 64px; }
          .login-logo-ring-inner { width: 64px; height: 64px; border-radius: 18px; }
          .login-logo-letter { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  );
}
