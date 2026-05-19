"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface SubmissionTrackerProps {
  onSelectFestival: (id: string) => void;
  refreshTrigger: number;
}

export function SubmissionTracker({ onSelectFestival, refreshTrigger }: SubmissionTrackerProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/festivals/submit")
      .then((res) => res.json())
      .then((data) => {
        setSubmissions(data.submissions || []);
      })
      .catch(() => toast.error("Failed to load submissions tracker"))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error("No submissions to export.");
      return;
    }

    const headers = ["Festival Name", "Category", "Submission Date", "Fee Paid (INR)", "Reference ID", "Status", "Notes"];
    const rows = submissions.map((s) => [
      s.festivals?.name || s.film_title,
      s.category || "",
      s.submission_date || "",
      s.fee_paid_inr || 0,
      s.submission_reference || "",
      s.status || "",
      s.notes || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Festival_Submissions_Tracker_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSubmitted = submissions.length;
  const totalFees = submissions.reduce((sum, s) => sum + (s.fee_paid_inr || 0), 0);
  const selections = submissions.filter((s) => s.status === "selected").length;
  const successRate = totalSubmitted > 0 ? Math.round((selections / totalSubmitted) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-amber/30 border-t-amber animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Submitted", val: totalSubmitted, color: "text-white" },
          { label: "Fees Spent", val: `₹${totalFees.toLocaleString()}`, color: "text-amber" },
          { label: "Selections", val: selections, color: "text-emerald-400" },
          { label: "Success Rate", val: `${successRate}%`, color: "text-teal-400" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface border border-white/5 p-4 rounded-xl flex flex-col gap-1">
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{stat.label}</span>
            <span className={`text-2xl font-extrabold font-mono ${stat.color}`}>{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h3 className="font-display text-lg font-bold text-white">My Submissions</h3>
        <button
          onClick={handleExportCSV}
          className="h-10 px-4 rounded-lg border border-white/10 hover:border-amber/30 text-xs font-semibold text-text-secondary hover:text-white flex items-center justify-center gap-1.5 hover:bg-white/[0.02] active:scale-95 transition-all cursor-pointer"
        >
          <span>↓</span> Export tracker as CSV
        </button>
      </div>

      {/* Table grid */}
      {submissions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/5 rounded-2xl bg-surface/50">
          <p className="text-sm text-text-secondary">No submissions tracked yet.</p>
          <p className="text-xs text-text-muted mt-1">
            Open a festival's details and use the "Track My Entry" tab to record your submissions!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/5 rounded-xl bg-surface divide-y divide-white/5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface/80 text-text-muted font-bold text-[10px] uppercase tracking-wider border-b border-white/5">
                <th className="p-4">Festival Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Fee Paid</th>
                <th className="p-4">Reference ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-white max-w-[180px] truncate">
                    {s.festivals?.name || s.film_title}
                  </td>
                  <td className="p-4 text-text-secondary">{s.category || "—"}</td>
                  <td className="p-4 text-text-muted">
                    {s.submission_date ? new Date(s.submission_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-4 font-mono text-amber font-semibold">
                    ₹{s.fee_paid_inr || 0}
                  </td>
                  <td className="p-4 text-text-muted font-mono">{s.submission_reference || "—"}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        s.status === "selected"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : s.status === "waitlisted"
                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          : s.status === "not_selected"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber border border-amber-500/20"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => onSelectFestival(s.festival_id)}
                      className="text-amber font-bold hover:underline cursor-pointer"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
