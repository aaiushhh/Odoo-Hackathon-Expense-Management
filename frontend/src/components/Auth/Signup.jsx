
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Auth.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companyCountry: "",
    companyCurrency: "",
  });

  const [countries, setCountries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  // Fetch countries and currencies on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,currencies"
        );
        const data = await response.json();
        setCountries(data);
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        setError("Failed to load country list. Please try again later.");
      }
    };
    fetchCountries();
  }, []);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleCountryChange = (e) => {
    const selectedCountryName = e.target.value;
    const selectedCountry = countries.find(
      (country) => country.name.common === selectedCountryName
    );

    let currencyCode = "";
    if (selectedCountry && selectedCountry.currencies) {
      currencyCode = Object.keys(selectedCountry.currencies)[0];
    }

    setFormData({
      ...formData,
      companyCountry: selectedCountryName,
      companyCurrency: currencyCode,
    });
    setError("");
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    const {
      name,
      email,
      password,
      companyName,
      companyCountry,
      companyCurrency,
    } = formData;

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }

    if (!companyName.trim()) {
      setError("Please enter your company name");
      return;
    }

    if (!companyCountry.trim()) {
      setError("Please enter your company country");
      return;
    }

    if (!companyCurrency.trim()) {
      setError("Please enter your company currency");
      return;
    }

    setLoading(true);

    try {
      await signup(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
        <div className="auth-header">
          <div className="auth-icon">
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
          <h2>Create Your Account</h2>
          <p>Set up your company and admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Admin Details Section */}
          <div className="form-section">
            <h3 className="section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Admin Details
            </h3>

            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("name")}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div
                className={`input-wrapper ${
                  touched.email &&
                  formData.email &&
                  !validateEmail(formData.email)
                    ? "error"
                    : ""
                }`}
              >
                <svg
                  className="input-icon"
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
                  type="email"
                  name="email"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  required
                />
              </div>
              {touched.email &&
                formData.email &&
                !validateEmail(formData.email) && (
                  <div className="error-message">
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

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => handleBlur("password")}
                  required
                />
                <button
                  type="button"
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

              {(showPasswordRequirements || formData.password) && (
                <div className="password-requirements">
                  <p className="requirements-title">Password Requirements:</p>
                  <div className="requirements-list">
                    <div
                      className={`requirement-item ${
                        passwordValidation.minLength ? "valid" : ""
                      }`}
                    >
                      <svg
                        className="check-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>At least 8 characters</span>
                    </div>
                    <div
                      className={`requirement-item ${
                        passwordValidation.hasUpperCase ? "valid" : ""
                      }`}
                    >
                      <svg
                        className="check-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>One uppercase letter</span>
                    </div>
                    <div
                      className={`requirement-item ${
                        passwordValidation.hasLowerCase ? "valid" : ""
                      }`}
                    >
                      <svg
                        className="check-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>One lowercase letter</span>
                    </div>
                    <div
                      className={`requirement-item ${
                        passwordValidation.hasNumber ? "valid" : ""
                      }`}
                    >
                      <svg
                        className="check-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>One number</span>
                    </div>
                    <div
                      className={`requirement-item ${
                        passwordValidation.hasSpecialChar ? "valid" : ""
                      }`}
                    >
                      <svg
                        className="check-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="section-divider"></div>

          {/* Company Details Section */}
          <div className="form-section">
            <h3 className="section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Company Details
            </h3>

            <div className="form-group">
              <label>Company Name</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Base Country</label>
                <div className="input-wrapper select-wrapper">
                  <svg
                    className="input-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <select
                    name="companyCountry"
                    value={formData.companyCountry}
                    onChange={handleCountryChange}
                    required
                  >
                    <option value="" disabled>
                      Select a country
                    </option>
                    {countries.length > 0 &&
                      countries
                        .sort((a, b) =>
                          a.name.common.localeCompare(b.name.common)
                        )
                        .map((country) => (
                          <option
                            key={country.name.common}
                            value={country.name.common}
                          >
                            {country.name.common}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Base Currency</label>
                <div className="input-wrapper">
                  <svg
                    className="input-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <input
                    type="text"
                    name="companyCurrency"
                    placeholder="USD"
                    value={formData.companyCurrency}
                    readOnly
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
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

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              "Create Company & Admin Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <a href="/login" className="link">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;