import { useEffect, useState } from "react";
import { getFaq } from "../../api/cms.js";
import { Spinner } from "../../components/common/Common.jsx";

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    getFaq().then(res => setFaqs(res?.faqs || res || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header"><h1>Frequently Asked Questions</h1></div>
      {faqs.length === 0 ? (
        <div className="empty-state"><h3>No FAQs available</h3></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {faqs.map((faq, i) => (
            <div key={faq.id || i} className="card" style={{ padding: 0 }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", textAlign: "left", padding: "1rem 1.25rem", border: "none", background: "none", display: "flex", justifyContent: "space-between", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem" }}>
                {faq.question}
                <span style={{ color: "var(--muted)", flexShrink: 0, marginLeft: "1rem" }}>{open === i ? "▲" : "▼"}</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 1.25rem 1.25rem", color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
