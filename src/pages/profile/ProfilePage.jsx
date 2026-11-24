import { useEffect, useState } from "react";
import { getProfile, editProfile, changePassword } from "../../api/auth.js";
import { Spinner } from "../../components/common/Common.jsx";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { mediaUrl } from "../../utils/helpers.js";

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || user.name || "", email: user.email || "", phone: user.phone || "" });
  }, [user]);

  async function handleProfile(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await editProfile(form);
      await refreshMe();
      toast.success("Profile updated!");
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handlePw(e) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast.error("Passwords don't match");
    setPwLoading(true);
    try {
      await changePassword({ old_password: pwForm.old_password, new_password: pwForm.new_password });
      toast.success("Password changed!");
      setPwForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) { toast.error(err.message); }
    finally { setPwLoading(false); }
  }

  if (!user) return <Spinner />;

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header"><h1>My Profile</h1></div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 className="card-title">Profile Details</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--brand-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 700, color: "var(--brand)" }}>
            {user.profile_image ? <img src={mediaUrl(user.profile_image)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" /> : (user.full_name || user.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{user.full_name || user.name}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{user.email} · {user.user_type}</div>
          </div>
        </div>
        <form onSubmit={handleProfile}>
          <div className="form-group"><label>Full Name</label><input className="form-control" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
          <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <button className="btn primary" type="submit" disabled={loading}>{loading ? "Saving…" : "Save Changes"}</button>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title">Change Password</h3>
        <form onSubmit={handlePw}>
          <div className="form-group"><label>Current Password</label><input className="form-control" type="password" value={pwForm.old_password} onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))} required /></div>
          <div className="form-group"><label>New Password</label><input className="form-control" type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required /></div>
          <div className="form-group"><label>Confirm New Password</label><input className="form-control" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required /></div>
          <button className="btn primary" type="submit" disabled={pwLoading}>{pwLoading ? "Saving…" : "Change Password"}</button>
        </form>
      </div>
    </div>
  );
}
