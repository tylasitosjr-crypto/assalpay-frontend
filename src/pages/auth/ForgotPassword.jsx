import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyOtp, resendOtp } from "../../api/auth.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await verifyOtp({ email, otp });
      login(data.token, data.user || data);
      toast.success("Account verified!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendOtp({ email });
      toast.success("OTP resent!");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo"><span>AssalPay</span></div>
        <h1 className="auth-title">Verify OTP</h1>
        <p className="auth-sub">Enter the code sent to <strong>{email}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>OTP Code</label>
            <input className="form-control" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="Enter 6-digit code" maxLength={6} style={{ textAlign: "center", letterSpacing: "0.5rem", fontSize: "1.5rem" }} />
          </div>
          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>
        <div className="auth-link">
          Didn't receive the code? <button onClick={handleResend} style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", fontWeight: 600, fontSize: "inherit" }}>Resend OTP</button>
        </div>
      </div>
    </div>
  );
}
