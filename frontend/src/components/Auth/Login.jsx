import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Note: useAuth is commented out to resolve the compilation issue for the hackathon environment.
// import { useAuth } from "../../context/AuthContext";

// --- START: Mock API function (Uses internal fetch for the backend call) ---
// Since we don't have access to your full project structure, this mock serves
// as the bridge to your backend route: POST /api/auth/forgot-password
const forgotPassword = async (email) => {
  // UPDATED: Changed port from 5000 to 3000
  const apiUrl = "http://localhost:3000/api/auth/forgot-password";

  // Simulate exponential backoff for a simple retry mechanism
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Throw the backend error message
        throw new Error(data.message || "Failed to send reset request.");
      }

      // Return the success message from the backend
      return data.message;
    } catch (error) {
      if (attempt < 2 && error.message.includes("Failed to fetch")) {
        // Simple retry on network failure
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * 2 ** attempt)
        );
      } else {
        throw error;
      }
    }
  }
  throw new Error("Network error or server is unreachable.");
};
// --- END: Mock API function ---

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Mocking useAuth for login function since AuthContext path failed compilation
  // In your local project, uncomment the real useAuth import and replace the line below.
  const authContext = {
    login: async (email, password) => {
      // Placeholder for actual login logic
      console.log(`Attempting login for: ${email}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Simulate a successful login for now
      // throw { response: { data: { message: "Simulated Invalid Credentials." } }};
    },
  };
  const { login } = authContext;
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const emailError = touched.email && email && !validateEmail(email);
  const passwordError = touched.password && password && password.length < 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address to reset password");
      return;
    }

    setLoading(true);

    try {
      // API call to the backend
      const message = await forgotPassword(email);
      // Backend should return a generic success message to prevent user enumeration
      setSuccessMessage(
        message ||
          `If an account is associated with ${email}, a new password has been sent.`
      );
    } catch (err) {
      // The backend should handle most errors (like user not found) with a 200 OK generic message,
      // but this catches network/server errors.
      console.error("Forgot Password Frontend Error:", err);
      setError(
        "A network error occurred. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset states when switching back to login screen
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setError("");
    setSuccessMessage("");
    // Keep email state for convenience
  };

  // --- CSS Styles for a single-file component ---
  const styles = {
    authContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      backgroundColor: "#f8f9fa", // Light gray background
      fontFamily: "Inter, sans-serif",
    },
    authCard: {
      width: "100%",
      maxWidth: "400px",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      padding: "2rem",
      border: "1px solid #e0e0e0",
    },
    authHeader: {
      textAlign: "center",
      marginBottom: "1.5rem",
    },
    authIcon: {
      width: "60px",
      height: "60px",
      margin: "0 auto 0.5rem",
      backgroundColor: "#e7f5ff",
      color: "#007bff",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "3px solid #cfe2ff",
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 700,
      color: "#343a40",
      margin: "0.5rem 0 0",
    },
    p: {
      color: "#6c757d",
      fontSize: "0.95rem",
      marginTop: "0.5rem",
    },
    formGroup: {
      marginBottom: "1rem",
    },
    label: {
      display: "block",
      marginBottom: "0.3rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#495057",
    },
    inputWrapper: {
      display: "flex",
      alignItems: "center",
      border: "1px solid #ced4da",
      borderRadius: "8px",
      padding: "0.5rem 0.75rem",
      transition: "all 0.2s",
      backgroundColor: "#f8f9fa",
    },
    input: {
      flexGrow: 1,
      border: "none",
      outline: "none",
      backgroundColor: "transparent",
      fontSize: "1rem",
      padding: "0 0.5rem",
    },
    inputIcon: {
      color: "#adb5bd",
    },
    errorInputWrapper: {
      borderColor: "#dc3545",
      boxShadow: "0 0 0 0.2rem rgba(220, 53, 69, 0.25)",
    },
    errorMessage: {
      color: "#dc3545",
      fontSize: "0.8rem",
      marginTop: "0.25rem",
      display: "flex",
      alignItems: "center",
    },
    btnPrimary: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "background-color 0.2s, box-shadow 0.2s",
      marginTop: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
    },
    btnPrimaryHover: {
      backgroundColor: "#0056b3",
    },
    btnDisabled: {
      backgroundColor: "#adb5bd",
      cursor: "not-allowed",
    },
    spinner: {
      border: "4px solid rgba(255, 255, 255, 0.3)",
      borderTop: "4px solid #fff",
      borderRadius: "50%",
      width: "20px",
      height: "20px",
      animation: "spin 1s linear infinite",
    },
    alert: {
      padding: "0.75rem 1.25rem",
      marginBottom: "1rem",
      borderRadius: "8px",
      border: "1px solid transparent",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.9rem",
    },
    alertError: {
      color: "#721c24",
      backgroundColor: "#f8d7da",
      borderColor: "#f5c6cb",
    },
    alertSuccess: {
      color: "#155724",
      backgroundColor: "#d4edda",
      borderColor: "#c3e6cb",
    },
    authFooter: {
      textAlign: "center",
      marginTop: "1.5rem",
      paddingTop: "1rem",
      borderTop: "1px solid #f1f1f1",
    },
    link: {
      color: "#007bff",
      textDecoration: "none",
      fontWeight: 600,
      transition: "color 0.2s",
      cursor: "pointer",
    },
    linkButton: {
      background: "none",
      border: "none",
      color: "#007bff",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: 600,
      padding: "0",
      transition: "color 0.2s",
    },
    labelWithForgot: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    togglePassword: {
      background: "none",
      border: "none",
      color: "#adb5bd",
      cursor: "pointer",
      padding: "0",
      margin: "0 0 0 0.5rem",
    },
    "@keyframes spin": {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
  };

  if (showForgotPassword) {
    return (
      <div style={styles.authContainer}>
        <style>
          {`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .error-input-wrapper {
                border-color: ${
                  styles.errorInputWrapper.borderColor
                } !important;
                box-shadow: ${styles.errorInputWrapper.boxShadow} !important;
            }
            .link-button:hover {
                color: ${styles.btnPrimaryHover.backgroundColor};
            }
            .spinner {
                ${Object.entries(styles.spinner)
                  .map(
                    ([k, v]) =>
                      `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v};`
                  )
                  .join(" ")}
            }
          `}
        </style>
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <div style={styles.authIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 style={styles.h2}>Forgot Password?</h2>
            <p style={styles.p}>
              Enter your email and we'll send a **new password** to your inbox.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} style={styles.authForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <div
                style={styles.inputWrapper}
                className={emailError ? "error-input-wrapper" : ""}
              >
                <svg
                  style={styles.inputIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  required
                />
              </div>
              {emailError && (
                <div style={styles.errorMessage}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Please enter a valid email address
                </div>
              )}
            </div>

            {/* Display Success Message */}
            {successMessage && (
              <div style={{ ...styles.alert, ...styles.alertSuccess }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {successMessage}
              </div>
            )}

            {/* Display Error Message */}
            {error && (
              <div style={{ ...styles.alert, ...styles.alertError }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                ...styles.btnPrimary,
                ...(loading || successMessage ? styles.btnDisabled : {}),
              }}
              disabled={loading || successMessage} // Disable if loading or successful
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                "Send New Password"
              )}
            </button>
          </form>

          <div style={styles.authFooter}>
            <button
              onClick={handleBackToLogin}
              style={styles.linkButton}
              className="link-button"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Login UI ---
  return (
    <div style={styles.authContainer}>
      <style>
        {`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .error-input-wrapper {
                border-color: ${
                  styles.errorInputWrapper.borderColor
                } !important;
                box-shadow: ${styles.errorInputWrapper.boxShadow} !important;
            }
            .toggle-password:hover svg {
                color: #007bff;
            }
            .link-button:hover {
                color: ${styles.btnPrimaryHover.backgroundColor};
            }
            .spinner {
                ${Object.entries(styles.spinner)
                  .map(
                    ([k, v]) =>
                      `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v};`
                  )
                  .join(" ")}
            }
          `}
      </style>
      <div style={styles.authCard}>
        <div style={styles.authHeader}>
          <div style={styles.authIcon}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h2 style={styles.h2}>Welcome Back</h2>
          <p style={styles.p}>Sign in to your Expense System account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.authForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <div
              style={styles.inputWrapper}
              className={emailError ? "error-input-wrapper" : ""}
            >
              <svg
                style={styles.inputIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                style={styles.input}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                required
              />
            </div>
            {emailError && (
              <div style={styles.errorMessage}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Please enter a valid email address
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <div style={styles.labelWithForgot}>
              <label style={styles.label}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError(""); // Clear login errors when going to forgot password
                  setSuccessMessage("");
                }}
                style={styles.linkButton}
                className="link-button"
              >
                Forgot Password?
              </button>
            </div>
            <div
              style={styles.inputWrapper}
              className={passwordError ? "error-input-wrapper" : ""}
            >
              <svg
                style={styles.inputIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                style={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                required
              />
              <button
                type="button"
                style={styles.togglePassword}
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <div style={styles.errorMessage}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Password must be at least 8 characters
              </div>
            )}
          </div>

          {error && (
            <div style={{ ...styles.alert, ...styles.alertError }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" style={styles.btnPrimary} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={styles.authFooter}>
          <p style={styles.p}>
            New to Expense System?{" "}
            <a href="/signup" style={styles.link}>
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;