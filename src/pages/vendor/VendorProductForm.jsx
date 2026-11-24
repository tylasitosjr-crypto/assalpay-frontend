import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addProduct, editProduct, getVendorProductDetails, uploadProductImages } from "../../api/vendor.js";
import { getCategoryList, getSubCategoryList } from "../../api/products.js";
import { Spinner } from "../../components/common/Common.jsx";
import { mediaUrl } from "../../utils/helpers.js";
import { toast } from "react-toastify";

export default function VendorProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    sub_category_id: "",
    price: "",
    sale_price: "",
    stock: "",
  });

  const [images, setImages] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

  useEffect(() => {
    getCategoryList()
      .then((res) => setCategories(res?.categories || res || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.category_id) {
      getSubCategoryList({ category_id: form.category_id })
        .then((res) => setSubCategories(res?.sub_categories || res || []))
        .catch(() => {});
    } else {
      setSubCategories([]);
    }
  }, [form.category_id]);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getVendorProductDetails(id)
        .then((res) => {
          const p = res?.product || res;
          if (p) {
            setForm({
              name: p.name || "",
              description: p.description || "",
              category_id: p.category_id || "",
              sub_category_id: p.sub_category_id || "",
              price: p.price ?? "",
              sale_price: p.sale_price ?? "",
              stock: p.stock ?? "",
            });
            if (p.product_images) {
              setUploadedImageUrls(p.product_images.map((img) => img.image_url));
            }
          }
        })
        .catch((err) => toast.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    try {
      const res = await uploadProductImages(formData);
      const newUrls = res?.image_urls || res?.images || [];
      setUploadedImageUrls((prev) => [...prev, ...newUrls]);
      toast.success("Images uploaded successfully");
    } catch (err) {
      toast.error(err.message || "Failed to upload images");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : undefined,
        stock: Number(form.stock),
        images: uploadedImageUrls,
      };

      if (isEdit) {
        await editProduct({ product_id: id, ...payload });
        toast.success("Product updated successfully!");
      } else {
        await addProduct(payload);
        toast.success("Product created successfully!");
      }
      navigate("/vendor/products");
    } catch (err) {
      toast.error(err.message || "Error saving product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1>{isEdit ? "Edit Product" : "New Product"}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Vintage Leather Bag"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed product features, materials, and specs..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Sub-category</label>
              <select
                className="form-control"
                name="sub_category_id"
                value={form.sub_category_id}
                onChange={handleChange}
              >
                <option value="">Select Sub-category</option>
                {subCategories.map((sc) => (
                  <option key={sc.id || sc._id} value={sc.id || sc._id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Regular Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Sale Price ($) (Optional)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="sale_price"
                value={form.sale_price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Available Stock</label>
            <input
              type="number"
              className="form-control"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Product Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="form-control"
              onChange={handleImageUpload}
            />
            {uploadedImageUrls.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {uploadedImageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      position: "relative",
                    }}
                  >
                    <img
                      src={mediaUrl(url)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Product" : "Publish Product"}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => navigate("/vendor/products")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
