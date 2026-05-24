"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProfileFields = {
  full_name: string;
  phone: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
};

export default function ProfileForm({
  userId,
  userEmail,
  initial,
}: {
  userId: string;
  userEmail: string;
  initial: ProfileFields;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileFields>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(key: keyof ProfileFields, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        shipping_line1: form.shipping_line1.trim() || null,
        shipping_line2: form.shipping_line2.trim() || null,
        shipping_city: form.shipping_city.trim() || null,
        shipping_state: form.shipping_state.trim() || null,
        shipping_pincode: form.shipping_pincode.trim() || null,
      })
      .eq("id", userId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message || "Could not save your changes.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="card p-6">
      <h2 className="mb-5 text-lg font-bold">Profile & address</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="10-digit mobile"
            inputMode="tel"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email</label>
          <input className="input bg-neutral-50" value={userEmail} disabled />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address line 1</label>
          <input
            className="input"
            value={form.shipping_line1}
            onChange={(e) => update("shipping_line1", e.target.value)}
            placeholder="House no, street"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address line 2 (optional)</label>
          <input
            className="input"
            value={form.shipping_line2}
            onChange={(e) => update("shipping_line2", e.target.value)}
            placeholder="Area, landmark"
          />
        </div>
        <div>
          <label className="label">City</label>
          <input
            className="input"
            value={form.shipping_city}
            onChange={(e) => update("shipping_city", e.target.value)}
          />
        </div>
        <div>
          <label className="label">State</label>
          <input
            className="input"
            value={form.shipping_state}
            onChange={(e) => update("shipping_state", e.target.value)}
          />
        </div>
        <div>
          <label className="label">PIN code</label>
          <input
            className="input"
            value={form.shipping_pincode}
            onChange={(e) => update("shipping_pincode", e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
            <Check size={16} /> Saved
          </span>
        )}
      </div>
    </form>
  );
}
