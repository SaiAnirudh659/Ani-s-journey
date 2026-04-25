import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { auth } from "../firebase";
import DailyQuote from "../components/DailyQuote";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (error) {
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
      <div className="login-card">
        <div className="brand-title">
          <h1>Ani's Journey</h1>
          <span className="flag-route">🇮🇳 → 🇺🇸</span>
        </div>

        <h2>Career Hub</h2>

        <DailyQuote />

        <button onClick={handleGoogleLogin} className="google-btn">
          Continue with Google
        </button>

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
  );
}

export default Login;