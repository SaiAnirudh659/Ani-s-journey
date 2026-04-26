import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { auth } from "../firebase";
import "../App.css";

const quotes = [
  "Your career grows when your excuses stop.",
  "Apply today. Your future self will thank you.",
  "One application can change your life.",
  "Consistency beats motivation.",
  "Dream jobs are found by people who keep applying.",
  "Small steps daily create big career wins.",
  "Rejection is redirection. Keep moving.",
  "Your visa journey is hard, but your dream is stronger.",
  "From India to USA, every step matters.",
  "Don't wait for opportunity. Apply for it.",
  "Today's application can become tomorrow's offer.",
  "Keep applying until your inbox says congratulations."
];

function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [quoteIndex] = useState(Math.floor(Math.random() * quotes.length));
  const [isLoading, setIsLoading] = useState(false);

  // Handle redirect result from Google Sign-In
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.log(error);
        alert("Authentication failed: " + error.message);
      }
    };
    handleRedirectResult();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      
      // Check if on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Use redirect for mobile
        await signInWithRedirect(auth, provider);
      } else {
        // Use popup for desktop
        await signInWithPopup(auth, provider);
        navigate("/dashboard");
      }
    } catch (error) {
      setIsLoading(false);
      alert(error.message);
      console.log(error);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA verified");
          },
        }
      );
    }
  };

  const sendOtp = async () => {
    try {
      if (!phone) {
        alert("Please enter phone number with country code");
        return;
      }

      setupRecaptcha();

      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);

      setConfirmationResult(result);
      alert("OTP sent successfully!");
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
  };

  const verifyOtp = async () => {
    try {
      if (!otp) {
        alert("Please enter OTP");
        return;
      }

      await confirmationResult.confirm(otp);
      navigate("/dashboard");
    } catch (error) {
      alert("Invalid OTP");
      console.log(error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Panel - Quote Section */}
        <div className="quote-panel">
          <div className="quote-content">
            <div className="quote-wrapper">
              <p className="quote-text">"{quotes[quoteIndex]}"</p>
            </div>
            <div className="quote-design-elements">
              <div className="design-accent-top"></div>
              <div className="design-accent-bottom"></div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-card">
          <div className="brand-title">
            <h1>Ani's Journey</h1>
            <span className="flag-route">🇮🇳 → 🇺🇸</span>
          </div>

          <h2>Career Hub</h2>

          <button onClick={handleGoogleLogin} className="google-btn" disabled={isLoading}>
            {isLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="divider">or</div>

          <div className="phone-login-box">
            <input
              type="tel"
              placeholder="+1 1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="phone-input"
            />

            <button onClick={sendOtp} className="phone-btn">
              Send OTP
            </button>

            {confirmationResult && (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="phone-input"
                />

                <button onClick={verifyOtp} className="verify-btn">
                  Verify OTP
                </button>
              </>
            )}
          </div>

          <div id="recaptcha-container"></div>
        </div>
      </div>
    </div>
  );
}

export default Login;