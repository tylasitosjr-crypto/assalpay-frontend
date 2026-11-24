import { useEffect, useState } from "react";
import { getNotificationList, toggleNotificationStatus, deleteNotification } from "../../api/notifications.js";
import { Spinner } from "../../components/common/Common.jsx";
import { formatDate } from "../../utils/helpers.js";
import { toast } from "react-toastify";
import { FiTrash2 } from "react-icons/fi";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const res = await getNotificationList(); setNotifications(res?.notifications || res || []); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleRead(id) {
    try { await toggleNotificationStatus(id); load(); } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    try { await deleteNotification(id); setNotifications(n => n.filter(x => x.id !== id)); }
    catch (err) { toast.error(err.message); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header"><h1>🔔 Notifications</h1></div>
      {notifications.length === 0 ? (
        <div className="empty-state"><h3>No notifications</h3><p>You're all caught up!</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {notifications.map(n => (
            <div key={n.id} className="card" style={{ background: n.is_read ? "var(--surface)" : "rgba(13,79,43,0.04)", cursor: "pointer" }} onClick={() => !n.is_read && handleRead(n.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {!n.is_read && <span className="badge green" style={{ marginBottom: "0.4rem", display: "inline-block" }}>New</span>}
                  <div style={{ fontWeight: n.is_read ? 400 : 700 }}>{n.title || n.message}</div>
                  {n.title && n.message && <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{n.message}</div>}
                  <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.4rem" }}>{formatDate(n.created_at)}</div>
                </div>
                <button className="btn sm danger" style={{ marginLeft: "1rem" }} onClick={e => { e.stopPropagation(); handleDelete(n.id); }}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
