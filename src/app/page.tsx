"use client";

import { FormEvent, useState } from "react";

const treatments = [
  { value: "CARDIAC", label: "Cardiac Care" },
  { value: "ORTHOPEDIC", label: "Orthopedic Care" },
  { value: "ONCOLOGY", label: "Cancer Treatment" },
  { value: "IVF", label: "IVF & Fertility" },
  { value: "TRANSPLANT", label: "Organ Transplant" },
  { value: "OTHER", label: "Other Treatment" },
];

const initialForm = {
  fullName: "",
  country: "",
  phone: "",
  email: "",
  treatment: "",
  preferredCity: "",
  description: "",
};

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit your inquiry.");
      }

      setSuccess(true);
      setMessage(
        result.message || "Your inquiry has been submitted successfully."
      );
      setForm(initialForm);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <a href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            MedLead<span className="text-teal-500">.</span>
          </a>
          <a
            href="/login"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Staff Login
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-12 md:grid-cols-2 md:items-center md:py-20">
        <div>
          <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800">
            Your healthcare journey starts here
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Find the right care.
            <span className="mt-2 block text-blue-700">
              We’ll help you get started.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Tell us about your treatment needs and preferred destination.
            Our patient support team can review your inquiry and follow up
            with you.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">
                Personalized inquiries
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Share your treatment requirements with our team.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">
                Follow-up support
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Our team can review and manage your request.
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            Please do not include passwords, payment information, or
            unnecessary sensitive medical details.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Patient inquiry
            </p>
            <h2 className="mt-2 text-2xl font-bold">Tell us what you need</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Complete all fields so our team can review your inquiry.
            </p>
          </div>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-5 rounded-lg border p-4 text-sm ${
                success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
                Full name *
              </label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="country" className="mb-2 block text-sm font-medium">
                  Country *
                </label>
                <input
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  autoComplete="country-name"
                  placeholder="Your country"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                  Phone number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="treatment" className="mb-2 block text-sm font-medium">
                  Treatment required *
                </label>
                <select
                  id="treatment"
                  name="treatment"
                  value={form.treatment}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select treatment</option>
                  {treatments.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="preferredCity" className="mb-2 block text-sm font-medium">
                  Preferred city *
                </label>
                <input
                  id="preferredCity"
                  name="preferredCity"
                  value={form.preferredCity}
                  onChange={handleChange}
                  required
                  maxLength={120}
                  placeholder="e.g. New Delhi"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium">
                Inquiry details *
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                maxLength={5000}
                rows={4}
                placeholder="Briefly describe the treatment or assistance you are looking for."
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {form.description.length}/5000
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting inquiry..." : "Submit inquiry"}
            </button>

            <p className="text-center text-xs leading-5 text-slate-500">
              Fields marked * are required. Submitting this form sends your
              inquiry to the MedLead team.
            </p>
          </form>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} MedLead. Patient inquiry management.
        </div>
      </footer>
    </main>
  );
}
