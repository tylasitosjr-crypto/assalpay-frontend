import { useState } from "react";
import { contactUs } from "../../api/cms.js";
import { toast } from "react-toastify";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await contactUs(form);
      setSent(true);
      toast.success("Message sent successfully!");
    } catch (err) { toast.error(err.message || "Failed to send message"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header"><h1>Contact Us</h1></div>
      {sent ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h3>Message sent!</h3>
          <p style={{ color: "var(--muted)" }}>We'll get back to you as soon as possible.</p>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label>Name</label><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="form-group"><label>Email</label><input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            </div>
            <div className="form-group"><label>Subject</label><input className="form-control" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required /></div>
            <div className="form-group"><label>Message</label><textarea className="form-control" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required /></div>
            <button className="btn primary" type="submit" disabled={loading}>{loading ? "Sending…" : "Send Message"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
