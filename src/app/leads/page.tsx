 "use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";


type Lead = {
  id: string;
  fullName: string;
  country: string;
  phone: string;
  email: string;
  treatment: string;
  preferredCity: string;
  status: string;
  createdAt: string;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type Telecaller = {
  id: string;
  name: string;
  email: string;
};


type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LeadNote = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
};

type LeadActivity = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  } | null;
};

const statuses = [
  "NEW",
  "CONTACTED",
  "REPORTS_RECEIVED",
  "QUOTATION_SENT",
  "TRAVEL_PLANNED",
  "CONVERTED",
  "LOST",
];

const treatments = [
  "CARDIAC",
  "ORTHOPEDIC",
  "ONCOLOGY",
  "IVF",
  "TRANSPLANT",
  "OTHER",
];

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function LeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [treatment, setTreatment] = useState("");
  const [country, setCountry] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);

  // Notes panel state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [notesMessage, setNotesMessage] = useState("");
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");


  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (treatment) params.set("treatment", treatment);
      if (country.trim()) params.set("country", country.trim());
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const response = await fetch(`/api/leads?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to load patient leads.");
      }

      setLeads(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status, treatment, country, fromDate, toDate, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLeads();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadLeads]);

  const loadTelecallers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/telecallers", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 403) {
        setIsAdmin(false);
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to load telecallers.");
      }

      setTelecallers(result.data);
      setIsAdmin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load telecallers.");
    }
  }, [router]);

  useEffect(() => {
    void loadTelecallers();
  }, [loadTelecallers]);

  async function assignLead(leadId: string, assignedToId: string) {
    setAssigningLeadId(leadId);
    setError("");

    try {
      const response = await fetch(`/api/leads/${leadId}/assign`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId }),
      });
      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(result.message || "Unable to assign lead.");
      }

      await loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign lead.");
    } finally {
      setAssigningLeadId(null);
    }
  }

  async function loadLeadActivities(leadId: string) {
    setActivitiesLoading(true);
    setActivitiesError("");
    setActivities([]);

    try {
      const response = await fetch(
        `/api/leads/${leadId}/activities`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load activity history."
        );
      }

      setActivities(result.data);
    } catch (err) {
      setActivitiesError(
        err instanceof Error
          ? err.message
          : "Unable to load activity history."
      );
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function openLeadNotes(lead: Lead) {
    setSelectedLead(lead);
    void loadLeadActivities(lead.id);
    setNotes([]);
    setNoteContent("");
    setNotesError("");
    setNotesMessage("");
    setNotesLoading(true);

    try {
      const response = await fetch(`/api/leads/${lead.id}/notes`, {
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to load notes.");
      }

      setNotes(result.data);
    } catch (err) {
      setNotesError(
        err instanceof Error ? err.message : "Unable to load notes."
      );
    } finally {
      setNotesLoading(false);
    }
  }

  async function saveLeadNote() {
    if (!selectedLead || !noteContent.trim() || noteSaving) return;

    setNoteSaving(true);
    setNotesError("");
    setNotesMessage("");

    try {
      const response = await fetch(
        `/api/leads/${selectedLead.id}/notes`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: noteContent.trim() }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to save note.");
      }

      setNotes((current) => [result.data, ...current]);
      setNoteContent("");
      setNotesMessage("Note saved successfully.");
    } catch (err) {
      setNotesError(
        err instanceof Error ? err.message : "Unable to save note."
      );
    } finally {
      setNoteSaving(false);
    }
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    setUpdatingLeadId(leadId);
    setError("");

    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to update lead status.");
      }

      await loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update lead status.");
    } finally {
      setUpdatingLeadId(null);
    }
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  function updateTreatment(value: string) {
    setTreatment(value);
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
        <div>
          <p className="text-sm text-slate-500">Workspace / Patient Leads</p>
          <h1 className="mt-1 text-2xl font-bold">Patient Leads</h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + New Inquiry
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">All patient inquiries</h2>
          <p className="mt-2 text-sm text-slate-500">
            Search, filter, and review patient lead records.
          </p>
        </div>

        <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search name, email, or phone..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />

          <select
            value={status}
            onChange={(event) => updateStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={treatment}
            onChange={(event) => updateTreatment(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All treatments</option>
            {treatments.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {pagination.total} lead{pagination.total === 1 ? "" : "s"} found
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            <span>Country</span>
            <input
              type="text"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              placeholder="All countries"
              aria-label="Filter by country"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            <span>From date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            <span>To date</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={() => void loadLeads()}
              disabled={loading}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Treatment</th>
                  <th className="px-5 py-4">Preferred City</th>
                  {isAdmin && <th className="px-5 py-4">Assigned To</th>}
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Notes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      Loading patient leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No leads match your search or filters.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {lead.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {lead.country}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p>{lead.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {lead.phone}
                        </p>
                      </td>

                      <td className="px-5 py-4">{formatLabel(lead.treatment)}</td>
                      <td className="px-5 py-4">{lead.preferredCity}</td>

                      {isAdmin && (
                        <td className="px-5 py-4">
                          <select
                            aria-label={`Assign ${lead.fullName} to telecaller`}
                            value={lead.assignedToId ?? ""}
                            disabled={assigningLeadId === lead.id}
                            onChange={(event) => {
                              if (event.target.value) {
                                void assignLead(lead.id, event.target.value);
                              }
                            }}
                            className="max-w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 disabled:opacity-50"
                          >
                            <option value="" disabled>Unassigned</option>
                            {telecallers.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.name}
                              </option>
                            ))}
                          </select>
                          {assigningLeadId === lead.id && (
                            <p className="mt-1 text-xs text-slate-500">Saving...</p>
                          )}
                          {lead.assignedTo && (
                            <p className="mt-1 text-xs text-slate-500">
                              {lead.assignedTo.email}
                            </p>
                          )}
                        </td>
                      )}

                      <td className="px-5 py-4">
                        <select
                          aria-label={`Update status for ${lead.fullName}`}
                          value={lead.status}
                          disabled={updatingLeadId === lead.id}
                          onChange={(event) =>
                            void updateLeadStatus(lead.id, event.target.value)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          {statuses.map((item) => (
                            <option key={item} value={item}>
                              {formatLabel(item)}
                            </option>
                          ))}
                        </select>
                        {updatingLeadId === lead.id && (
                          <p className="mt-1 text-xs text-slate-500">Saving...</p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => void openLeadNotes(lead)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          View Notes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Page {pagination.totalPages === 0 ? 0 : pagination.page} of{" "}
            {pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1)
                )
              }
              disabled={page >= pagination.totalPages || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Patient lead notes</p>
                <h2 id="notes-title" className="mt-1 text-xl font-bold">
                  {selectedLead.fullName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLead.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                aria-label="Close notes"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <label
                htmlFor="note-content"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Add a note
              </label>
              <textarea
                id="note-content"
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Write call details, report status, next steps..."
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {noteContent.length}/2000 characters
                </p>
                <button
                  onClick={() => void saveLeadNote()}
                  disabled={!noteContent.trim() || noteSaving}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {noteSaving ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>

            {notesError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {notesError}
              </div>
            )}
            {notesMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {notesMessage}
              </div>
            )}

            <div className="mt-7">
              <h3 className="text-base font-bold">Activity Timeline</h3>

              {activitiesLoading ? (
                <p className="py-6 text-sm text-slate-500">
                  Loading activity history...
                </p>
              ) : activitiesError ? (
                <p className="py-4 text-sm text-red-600">
                  {activitiesError}
                </p>
              ) : activities.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  No activity recorded for this lead yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {activities.map((activity) => (
                    <article
                      key={activity.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {formatLabel(activity.action)}
                        </p>
                        <time
                          dateTime={activity.createdAt}
                          className="text-xs text-slate-500"
                        >
                          {new Date(activity.createdAt).toLocaleString()}
                        </time>
                      </div>
                      {activity.details && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {activity.details}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        By: {activity.actor?.name || "System"}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-7">
              <h3 className="text-base font-bold">Previous notes</h3>

              {notesLoading ? (
                <p className="py-6 text-sm text-slate-500">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  No notes have been added for this lead yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                        {note.content}
                      </p>
                      <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
                        <span>
                          {note.author?.name || "Team member"}
                        </span>
                        <time dateTime={note.createdAt}>
                          {new Date(note.createdAt).toLocaleString()}
                        </time>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
