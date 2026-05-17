import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppLayout } from "../components/AppLayout";
import { Icon } from "../components/Icon";
import { useAuth } from "../lib/auth-context";
import { products as productsApi, ApiError, type Product } from "../lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/products/manage")({
  head: () => ({
    meta: [
      { title: "Product Management — ShopSmart" },
      {
        name: "description",
        content:
          "Add new products to your ShopSmart catalog and manage existing inventory.",
      },
    ],
  }),
  component: ManagePage,
});

type FormState = {
  title: string;
  description: string;
  brand: string;
  price: string;
  category: string;
  stock: string;
  productAvailable: boolean;
  releaseDate: string;
  image: File | null;
};

const empty: FormState = {
  title: "",
  description: "",
  brand: "",
  price: "",
  category: "",
  stock: "",
  productAvailable: true,
  releaseDate: "",
  image: null,
};

function toLocalDateTime(v: string): string | undefined {
  if (!v) return undefined;

  const cleaned = v.replace(/Z$/, "").replace(/\.\d+$/, "");

  const match = cleaned.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/
  );

  if (!match) return cleaned;

  return match[2] ? `${match[1]}${match[2]}` : `${match[1]}:00`;
}

function ManagePage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<Product[] | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  const refresh = async () => {
    try {
      const page = isAdmin
        ? await productsApi.adminList(0, 100)
        : await productsApi.list(0, 100);

      const all = page.content;

      const visible = isAdmin
        ? all
        : user
        ? all.filter(
            (p) =>
              p.ownerId !== undefined &&
              String(p.ownerId) === String(user.id)
          )
        : [];

      setItems(visible);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not load products"
      );
    }
  };

  useEffect(() => {
    if (user) refresh();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!form.image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(form.image);

    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  const resetForm = () => {
    setEditingId(null);
    setForm(empty);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);

    setForm({
      title: p.title,
      description: p.description ?? "",
      brand: p.brand ?? "",
      price: String(p.price ?? ""),
      category: p.category ?? "",
      stock: p.stock !== undefined ? String(p.stock) : "",
      productAvailable: p.productAvailable ?? true,
      releaseDate: p.releaseDate ? p.releaseDate.slice(0, 16) : "",
      image: null,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      return toast.error("Title is required");
    }

    const priceNum = Number(form.price);

    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return toast.error("Enter a valid price");
    }

    const stockNum = form.stock !== "" ? Number(form.stock) : NaN;

    if (!Number.isFinite(stockNum) || stockNum < 1) {
      return toast.error("Stock quantity must be at least 1");
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        brand: form.brand.trim() || undefined,
        price: priceNum,
        category: form.category.trim() || undefined,
        stock: stockNum,
        productAvailable: form.productAvailable,
        releaseDate: toLocalDateTime(form.releaseDate),
        image: form.image,
      };

      if (editingId !== null) {
        await productsApi.update(editingId, payload);
        toast.success("Product updated");
      } else {
        if (!form.image) {
          return toast.error("Please add a product image");
        }

        await productsApi.create(payload);
        toast.success("Product published");
      }

      resetForm();
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not save product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"?`)) return;

    try {
      await productsApi.remove(p.id);

      setItems((prev) => prev?.filter((i) => i.id !== p.id) ?? prev);

      toast.success("Product deleted");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not delete product"
      );
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 text-center">Loading...</div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const isEdit = editingId !== null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="font-display font-bold text-3xl">
          {isAdmin ? "All Products (Admin)" : "Product Management"}
        </h1>

        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "As an admin, you can edit or delete any product in the catalog."
            : "Add new offerings to your catalog and manage existing inventory."}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="bg-card border border-border rounded-2xl p-5 space-y-4 h-fit"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-xl">
                {isEdit ? "Update Product" : "Add New Product"}
              </h2>

              {isEdit && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Image */}
            <label
              htmlFor="image"
              className="block aspect-video rounded-xl border-2 border-dashed border-border bg-secondary/50 hover:bg-secondary cursor-pointer overflow-hidden relative"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : isEdit ? (
                <img
                  src={productsApi.imageUrl(editingId!)}
                  alt="Current"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (
                      e.currentTarget as HTMLImageElement
                    ).style.display = "none";
                  }}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center p-4">
                  <div>
                    <Icon
                      name="add_photo_alternate"
                      className="text-[36px] text-muted-foreground"
                    />

                    <p className="mt-2 text-sm font-semibold">
                      Click to upload product image
                    </p>

                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5 MB
                    </p>
                  </div>
                </div>
              )}

              <input
                id="image"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;

                  if (!file) {
                    setForm((f) => ({
                      ...f,
                      image: null,
                    }));

                    return;
                  }

                  const ALLOWED = [
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                  ];

                  const MAX_SIZE = 5 * 1024 * 1024;

                  if (!ALLOWED.includes(file.type)) {
                    toast.error(
                      "Only JPG, PNG or WebP images are allowed"
                    );

                    if (fileRef.current) {
                      fileRef.current.value = "";
                    }

                    return;
                  }

                  if (file.size > MAX_SIZE) {
                    toast.error("Image must be under 5 MB");

                    if (fileRef.current) {
                      fileRef.current.value = "";
                    }

                    return;
                  }

                  setForm((f) => ({
                    ...f,
                    image: file,
                  }));
                }}
              />
            </label>

            <Input
              label="Product Title"
              value={form.title}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  title: v,
                }))
              }
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Price (USD)"
                value={form.price}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    price: v,
                  }))
                }
                inputMode="decimal"
                required
                prefix="$"
              />

              <Input
                label="Stock (min 1)"
                value={form.stock}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    stock: v,
                  }))
                }
                inputMode="numeric"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Brand"
                value={form.brand}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    brand: v,
                  }))
                }
                placeholder="Apple, Sony..."
              />

              <Input
                label="Category"
                value={form.category}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    category: v,
                  }))
                }
                placeholder="Audio, Wearables..."
              />
            </div>

            <label className="block">
              <span className="text-sm font-medium">
                Release Date
              </span>

              <div className="mt-1.5 flex items-center gap-2 px-3 h-11 rounded-xl bg-secondary border border-transparent focus-within:border-primary focus-within:bg-card transition">
                <input
                  type="datetime-local"
                  value={form.releaseDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      releaseDate: e.target.value,
                    }))
                  }
                  className="bg-transparent border-0 focus:ring-0 outline-none w-full text-sm"
                />
              </div>
            </label>

            <label className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-secondary cursor-pointer">
              <div>
                <span className="text-sm font-medium">
                  Available for sale
                </span>

                <p className="text-xs text-muted-foreground">
                  Customers can purchase this product
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.productAvailable}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productAvailable: e.target.checked,
                  }))
                }
                className="w-5 h-5 accent-primary shrink-0"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Description
              </span>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={4}
                className="mt-1.5 w-full px-3 py-2 rounded-xl bg-secondary border-0 focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Tell customers about your product..."
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Icon
                name={isEdit ? "save" : "add_circle"}
                className="text-[18px]"
              />

              {submitting
                ? "Saving..."
                : isEdit
                ? "Update Product"
                : "Publish Product"}
            </button>
          </form>

          {/* Product list */}
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="font-display font-semibold text-xl">
                {isAdmin ? "All Products" : "Your Products"}
              </h2>

              <span className="w-fit text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                {items?.length ?? 0}{" "}
                {isAdmin ? "products" : "active"}
              </span>
            </div>

            {items === null && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl bg-secondary animate-pulse"
                  />
                ))}
              </div>
            )}

            {items && items.length === 0 && (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl text-muted-foreground">
                No products yet. Add your first one!
              </div>
            )}

            {items && items.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((p) => (
                  <article
                    key={p.id}
                    className="bg-card border border-border rounded-2xl p-3 flex flex-col sm:flex-row gap-3"
                  >
                    <div className="w-full sm:w-24 h-48 sm:h-24 shrink-0 rounded-xl bg-secondary overflow-hidden">
                      <img
                        src={productsApi.imageUrl(p.id)}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (
                            e.currentTarget as HTMLImageElement
                          ).style.display = "none";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="font-display font-bold">
                        ${Number(p.price).toFixed(2)}
                      </span>

                      <h3 className="font-semibold line-clamp-1">
                        {p.title}
                      </h3>

                      {isAdmin &&
                        (p.ownerUsername || p.ownerEmail) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {p.ownerUsername && (
                              <p className="line-clamp-1">
                                Owner: {p.ownerUsername}
                              </p>
                            )}

                            {p.ownerEmail && (
                              <p className="line-clamp-1">
                                {p.ownerEmail}
                              </p>
                            )}
                          </div>
                        )}

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {p.description}
                      </p>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-muted-foreground">
                          {p.stock !== undefined
                            ? `In stock: ${p.stock}`
                            : ""}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-primary/10"
                          >
                            <Icon
                              name="edit"
                              className="text-[14px]"
                            />
                            Update
                          </button>

                          <button
                            onClick={() => remove(p)}
                            className="w-10 h-10 grid place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            aria-label="Delete"
                          >
                            <Icon
                              name="delete"
                              className="text-[18px]"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  inputMode,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: "decimal" | "numeric" | "text";
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>

      <div className="mt-1.5 flex items-center gap-2 px-3 h-11 rounded-xl bg-secondary border border-transparent focus-within:border-primary focus-within:bg-card transition">
        {prefix && (
          <span className="text-muted-foreground text-sm">
            {prefix}
          </span>
        )}

        <input
          type="text"
          inputMode={inputMode}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-0 focus:ring-0 outline-none w-full text-sm"
        />
      </div>
    </label>
  );
}