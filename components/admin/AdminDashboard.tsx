"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify, DEFAULT_SIZES, formatINR } from "@/lib/utils";
import type { Category, ProductWithSizes } from "@/lib/types";

export default function AdminDashboard({
  categories,
  products,
}: {
  categories: Category[];
  products: ProductWithSizes[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [showAdd, setShowAdd] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "webp";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  function notify(type: "ok" | "err", msg: string) {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 4000);
  }

  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Admin</h1>
          <p className="mt-1 text-ink-muted">
            {products.length} products · {categories.length} categories
          </p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="btn-primary">
          <Plus size={18} /> Add product
        </button>
      </div>

      {banner && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            banner.type === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-brand-50 text-brand-700"
          }`}
        >
          {banner.msg}
        </div>
      )}

      {showAdd && (
        <AddProductForm
          categories={categories}
          uploadImage={uploadImage}
          onDone={() => {
            setShowAdd(false);
            notify("ok", "Product added.");
            router.refresh();
          }}
          onError={(m) => notify("err", m)}
        />
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            categories={categories}
            uploadImage={uploadImage}
            onChanged={(m) => {
              notify("ok", m);
              router.refresh();
            }}
            onError={(m) => notify("err", m)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function AddProductForm({
  categories,
  uploadImage,
  onDone,
  onError,
}: {
  categories: Category[];
  uploadImage: (f: File) => Promise<string>;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stock, setStock] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_SIZES.map((s) => [s, 10]))
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return onError("Create a category first.");
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadImage(file);

      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          name,
          slug,
          category_id: categoryId,
          price: Number(price),
          description,
          image_url: imageUrl,
          is_featured: featured,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: sErr } = await supabase.from("product_sizes").insert(
        DEFAULT_SIZES.map((size) => ({
          product_id: product.id,
          size,
          stock: stock[size] ?? 0,
        }))
      );
      if (sErr) throw sErr;

      onDone();
    } catch (err: any) {
      onError(err?.message ?? "Failed to add product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mb-8 space-y-4 p-6">
      <h2 className="text-lg font-bold">New product</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Price (₹)</label>
          <input type="number" min="0" step="1" className="input" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div>
          <label className="label">Product image</label>
          <input type="file" accept="image/*" className="input py-2" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Stock per size (UK)</label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DEFAULT_SIZES.map((s) => (
            <div key={s}>
              <span className="mb-1 block text-center text-xs text-ink-muted">{s.replace("UK ", "")}</span>
              <input
                type="number"
                min="0"
                className="input px-2 py-1.5 text-center"
                value={stock[s]}
                onChange={(e) => setStock((prev) => ({ ...prev, [s]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Feature on homepage
      </label>

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        {busy ? "Saving…" : "Create product"}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function ProductRow({
  product,
  categories,
  uploadImage,
  onChanged,
  onError,
}: {
  product: ProductWithSizes;
  categories: Category[];
  uploadImage: (f: File) => Promise<string>;
  onChanged: (m: string) => void;
  onError: (m: string) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [price, setPrice] = useState(String(product.price));
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [featured, setFeatured] = useState(product.is_featured);
  const [active, setActive] = useState(product.is_active);
  const [file, setFile] = useState<File | null>(null);
  const [stock, setStock] = useState<Record<string, number>>(
    Object.fromEntries(product.sizes.map((s) => [s.size, s.stock]))
  );

  async function save() {
    setBusy(true);
    try {
      let imageUrl = product.image_url;
      if (file) imageUrl = await uploadImage(file);

      const { error } = await supabase
        .from("products")
        .update({
          price: Number(price),
          category_id: categoryId,
          is_featured: featured,
          is_active: active,
          image_url: imageUrl,
        })
        .eq("id", product.id);
      if (error) throw error;

      // Upsert each size's stock.
      for (const s of product.sizes) {
        const { error: sErr } = await supabase
          .from("product_sizes")
          .update({ stock: stock[s.size] ?? 0 })
          .eq("id", s.id);
        if (sErr) throw sErr;
      }
      onChanged("Product updated.");
      setOpen(false);
    } catch (err: any) {
      onError(err?.message ?? "Failed to update.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      onChanged("Product deleted.");
    } catch (err: any) {
      onError(err?.message ?? "Failed to delete.");
    } finally {
      setBusy(false);
    }
  }

  const totalStock = product.sizes.reduce((a, s) => a + s.stock, 0);

  return (
    <div className="rounded-2xl border border-ink/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="56px" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{product.name}</p>
          <p className="text-sm text-ink-muted">
            {product.category?.name} · {formatINR(product.price)} · {totalStock} in stock
            {!product.is_active && " · hidden"}
          </p>
        </div>
        <ChevronDown size={20} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-ink/5 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" min="0" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Replace image</label>
              <input type="file" accept="image/*" className="input py-2" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div>
            <label className="label">Stock per size</label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {product.sizes.map((s) => (
                <div key={s.id}>
                  <span className="mb-1 block text-center text-xs text-ink-muted">{s.size.replace("UK ", "")}</span>
                  <input
                    type="number"
                    min="0"
                    className="input px-2 py-1.5 text-center"
                    value={stock[s.size]}
                    onChange={(e) => setStock((prev) => ({ ...prev, [s.size]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active (visible in store)
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={save} disabled={busy} className="btn-primary">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button onClick={remove} disabled={busy} className="btn-ghost text-brand">
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
