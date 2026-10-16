"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardData = {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  lostLeads: number;
  totalUsers: number;
  conversionRate: number;
  statusDistribution: { status: string; count: number }[];
  countryDistribution: { country: string; count: number }[];
  telecallerPerformance: {
    id: string;
    name: string;
    email: string;
    assignedLeads: number;
    convertedLeads: number;
    conversionRate: number;
  }[];
  followUpsDueToday: number;
  overdueFollowUps: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/dashboard", {
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Could not load dashboard.");
      }

      setData(result.dashboard);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const stats = [
    { label: "Total Leads", value: data?.totalLeads ?? 0, icon: "◎" },
    { label: "New Leads", value: data?.newLeads ?? 0, icon: "✳" },
    { label: "Converted", value: data?.convertedLeads ?? 0, icon: "↗" },
    { label: "Lost Leads", value: data?.lostLeads ?? 0, icon: "↘" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:block">
          <h1 className="text-2xl font-bold">
            MedLead<span className="text-blue-600">.</span>
          </h1>
          <p className="mt-2 text-xs tracking-wider text-slate-400">
            PATIENT MANAGEMENT
          </p>

          <div className="mt-10 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-700">
            ▦ &nbsp; Dashboard
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-2 w-full rounded-xl px-4 py-3 text-left text-slate-600 hover:bg-slate-50"
          >
            + &nbsp; New Inquiry Form
          </button>

          <div className="mt-10 rounded-2xl bg-slate-50 p-4">
            <p className="font-semibold">Lead Management</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Monitor patient inquiries and conversion progress from one place.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">Workspace / Overview</p>
              <h2 className="mt-1 text-2xl font-bold">Dashboard</h2>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Log out
            </button>
          </header>

          <div className="mx-auto max-w-7xl p-5 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold tracking-wider text-blue-600">
                OVERVIEW
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                Patient inquiries
              </h3>
              <p className="mt-2 text-slate-500">
                Here is the latest overview of your lead pipeline.
              </p>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
                Loading live dashboard data...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-white p-6">
                <p className="font-semibold text-red-700">
                  Dashboard could not load
                </p>
                <p className="mt-2 text-sm text-slate-600">{error}</p>
                <button
                  onClick={() => void loadDashboard()}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => (
                    <article
                      key={stat.label}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                          {stat.label}
                        </p>
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700">
                          {stat.icon}
                        </span>
                      </div>
                      <p className="mt-5 text-3xl font-bold">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Live database count
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Conversion rate</p>
                  <p className="mt-3 text-3xl font-bold text-emerald-600">{data?.conversionRate ?? 0}%</p>
                  <p className="mt-2 text-xs text-slate-400">Converted leads / all leads</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Follow-ups due today</p>
                  <p className="mt-3 text-3xl font-bold">{data?.followUpsDueToday ?? 0}</p>
                  <p className="mt-2 text-xs text-slate-400">Pending follow-ups scheduled for today</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Overdue follow-ups</p>
                  <p className="mt-3 text-3xl font-bold text-rose-600">{data?.overdueFollowUps ?? 0}</p>
                  <p className="mt-2 text-xs text-slate-400">Past-due follow-ups not completed</p>
                </article>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h4 className="text-lg font-bold">All pipeline statuses</h4>
                  <p className="mt-1 text-sm text-slate-500">Live lead distribution by status</p>
                  <div className="mt-5 space-y-4">
                    {(data?.statusDistribution ?? []).map((item) => {
                      const total = data?.totalLeads ?? 0;
                      const percent = total > 0 ? (item.count / total) * 100 : 0;
                      return (
                        <div key={item.status}>
                          <div className="mb-1.5 flex justify-between gap-3 text-sm">
                            <span className="font-medium">{item.status.replaceAll("_", " ")}</span>
                            <span className="text-slate-500">{item.count} ({Math.round(percent)}%)</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h4 className="text-lg font-bold">Top countries</h4>
                  <p className="mt-1 text-sm text-slate-500">Countries with the most patient inquiries</p>
                  <div className="mt-5 space-y-4">
                    {(data?.countryDistribution ?? []).map((item) => {
                      const max = Math.max(1, ...(data?.countryDistribution ?? []).map((country) => country.count));
                      const percent = (item.count / max) * 100;
                      return (
                        <div key={item.country}>
                          <div className="mb-1.5 flex justify-between gap-3 text-sm">
                            <span className="font-medium">{item.country}</span>
                            <span className="text-slate-500">{item.count}</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {(data?.countryDistribution.length ?? 0) === 0 && <p className="text-sm text-slate-400">No country data available.</p>}
                  </div>
                </article>
              </div>

              <article className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-6">
                  <h4 className="text-lg font-bold">Tele-caller performance</h4>
                  <p className="mt-1 text-sm text-slate-500">Assigned leads and conversions by team member</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Tele-caller</th>
                        <th className="px-6 py-3 font-semibold">Assigned</th>
                        <th className="px-6 py-3 font-semibold">Converted</th>
                        <th className="px-6 py-3 font-semibold">Conversion rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.telecallerPerformance ?? []).map((person) => (
                        <tr key={person.id}>
                          <td className="px-6 py-4">
                            <p className="font-semibold">{person.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{person.email}</p>
                          </td>
                          <td className="px-6 py-4">{person.assignedLeads}</td>
                          <td className="px-6 py-4">{person.convertedLeads}</td>
                          <td className="px-6 py-4 font-semibold">{person.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

                <div className="mt-8">
                  <article className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h4 className="text-lg font-bold">Team workspace</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Registered team members
                    </p>
                    <p className="mt-6 text-4xl font-bold">
                      {data?.totalUsers ?? 0}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Admins and tele-callers
                    </p>
                    <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                      Keep track of incoming inquiries and follow-up activity.
                    </div>
                  </article>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
