import { useEffect, useState } from "react";
import { getMerchantWalletHub, getCashoutList, createWithdrawRequest } from "../../api/vendor.js";
import { Spinner, Badge, Pagination } from "../../components/common/Common.jsx";
import { formatCurrency, formatDate } from "../../utils/helpers.js";
import { toast } from "react-toastify";
import { FiDollarSign, FiClock, FiCheckCircle } from "react-icons/fi";

export default function VendorWallet() {
  const [wallet, setWallet] = useState(null);
  const [cashouts, setCashouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [withdrawModal, setWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [hubRes, cashRes] = await Promise.allSettled([
        getMerchantWalletHub(),
        getCashoutList({ page, limit: 10 }),
      ]);
      if (hubRes.status === "fulfilled") {
        setWallet(hubRes.value?.wallet || hubRes.value?.hub || hubRes.value);
      }
      if (cashRes.status === "fulfilled") {
        const cData = cashRes.value;
        setCashouts(cData?.cashouts || cData?.data || cData || []);
        setTotalPages(cData?.total_pages || 1);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page]);

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      return toast.error("Please enter a valid amount");
    }
    setSubmitting(true);
    try {
      await createWithdrawRequest({ amount: Number(amount) });
      toast.success("Withdrawal request created successfully!");
      setWithdrawModal(false);
      setAmount("");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create withdrawal request");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Merchant Wallet</h1>
        <button className="btn primary" onClick={() => setWithdrawModal(true)}>
          <FiDollarSign /> Request Payout
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Available Balance</div>
          <div className="stat-value">{formatCurrency(wallet?.available_balance || wallet?.balance || 0)}</div>
          <div className="stat-sub">Ready for withdrawal</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending / Locked</div>
          <div className="stat-value">{formatCurrency(wallet?.locked_balance || wallet?.pending_balance || 0)}</div>
          <div className="stat-sub">From recent or active orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Withdrawn</div>
          <div className="stat-value">{formatCurrency(wallet?.total_withdrawn || 0)}</div>
          <div className="stat-sub">All-time earnings transferred</div>
        </div>
      </div>

      {withdrawModal && (
        <div className="card" style={{ marginBottom: "2rem", borderColor: "var(--brand)" }}>
          <h3 className="card-title">Request Cashout</h3>
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Confirm Request"}
              </button>
              <button className="btn" type="button" onClick={() => setWithdrawModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <h3 className="card-title" style={{ padding: "1.25rem 1.25rem 0" }}>
          Withdrawal History
        </h3>
        {cashouts.length === 0 ? (
          <div className="empty-state">
            <p>No withdrawal requests yet.</p>
          </div>
        ) : (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {cashouts.map((c) => (
                  <tr key={c.id || c._id}>
                    <td>#{String(c.id || c._id).slice(-8).toUpperCase()}</td>
                    <td><strong>{formatCurrency(c.amount)}</strong></td>
                    <td>
                      <Badge status={c.status}>{c.status}</Badge>
                    </td>
                    <td>{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
