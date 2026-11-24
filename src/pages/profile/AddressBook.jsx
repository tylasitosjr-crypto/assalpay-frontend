import { useEffect, useState } from "react";
import { getAddressList, addAddress, editAddress, deleteAddress, setDefaultAddress } from "../../api/address.js";
import { Spinner } from "../../components/common/Common.jsx";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

const EMPTY = { name: "", phone: "", address: "", city: "", state: "", zip: "", country: "", is_default: false };

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState(EMPTY);

  async function load() {
    setLoading(true);
    try { const res = await getAddressList(); setAddresses(res?.addresses || res || []); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startNew() { setEditing("new"); setForm(EMPTY); }
  function startEdit(addr) { setEditing(addr.id || addr._id); setForm(addr); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing === "new") await addAddress(form);
      else await editAddress({ ...form, address_id: editing });
      toast.success(editing === "new" ? "Address added!" : "Address updated!");
      setEditing(null);
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function handleDelete(id) {
    const { isConfirmed } = await Swal.fire({ title: "Delete address?", icon: "warning", showCancelButton: true, confirmButtonColor: "#b91c1c", confirmButtonText: "Delete" });
    if (!isConfirmed) return;
    try { await deleteAddress(id); toast.success("Address deleted!"); load(); }
    catch (err) { toast.error(err.message); }
  }

  async function handleSetDefault(id) {
    try { await setDefaultAddress(id); toast.success("Default address updated!"); load(); }
    catch (err) { toast.error(err.message); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1>Address Book</h1>
        <button className="btn primary" onClick={startNew}><FiPlus /> Add Address</button>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 className="card-title">{editing === "new" ? "New Address" : "Edit Address"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label>Name</label><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Address Line</label><input className="form-control" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required /></div>
            <div className="form-row">
              <div className="form-group"><label>City</label><input className="form-control" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div className="form-group"><label>State</label><input className="form-control" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>ZIP</label><input className="form-control" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} /></div>
              <div className="form-group"><label>Country</label><input className="form-control" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn primary" type="submit">Save</button>
              <button className="btn" type="button" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="empty-state"><h3>No addresses saved</h3><p>Add an address to use at checkout.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {addresses.map(addr => (
            <div key={addr.id || addr._id} className="card" style={{ position: "relative" }}>
              {addr.is_default && <span className="badge green" style={{ position: "absolute", top: "1rem", right: "1rem" }}>Default</span>}
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{addr.name} · {addr.phone}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>{addr.address}, {addr.city}, {addr.state} {addr.zip}, {addr.country}</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn sm outline" onClick={() => startEdit(addr)}><FiEdit2 /> Edit</button>
                <button className="btn sm danger" onClick={() => handleDelete(addr.id || addr._id)}><FiTrash2 /> Delete</button>
                {!addr.is_default && <button className="btn sm" onClick={() => handleSetDefault(addr.id || addr._id)}>Set Default</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
