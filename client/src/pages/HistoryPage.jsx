import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatusBadge from "../components/dashboard/StatusBadge";
import { dmsApi } from "../services/api";

const statusFilters = ["all", "pending", "signed", "completed", "expired"];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const HistoryPage = () => {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        history: 1,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
      };
      const { data } = await dmsApi.getDocuments(params);
      setDocuments(data.documents || []);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const openTimeline = async (doc) => {
    setSelectedDoc(doc);
    setTimeline([]);
    setTimelineLoading(true);
    try {
      const { data } = await dmsApi.getTimeline(doc._id);
      setTimeline(data.timeline || []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const totalByStatus = useMemo(
    () =>
      documents.reduce(
        (acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
          return acc;
        },
        { pending: 0, signed: 0, completed: 0, expired: 0 }
      ),
    [documents]
  );

  return (
    <DashboardLayout title="Documents History" subtitle="Powerful search and timeline visibility for completed workflows">
      <section className="mb-5 grid gap-4 md:grid-cols-4">
        {["pending", "signed", "completed", "expired"].map((item) => (
          <div key={item} className="sf-card p-4 md:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{totalByStatus[item] || 0}</p>
          </div>
        ))}
      </section>

      <section className="sf-card p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description"
            className="sf-input w-full md:max-w-sm"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="sf-input w-full md:w-48">
            {statusFilters.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All statuses" : item}
              </option>
            ))}
          </select>
          <button onClick={loadDocuments} type="button" className="sf-btn-primary">
            Apply Filters
          </button>
        </div>

        {error ? <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-500">Loading history...</p> : null}

        {!loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Document</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Updated</th>
                  <th className="px-3 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length ? (
                  documents.map((doc) => (
                    <tr key={doc._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-900">{doc.title}</p>
                        <p className="text-xs text-slate-500">{doc.description || "No description"}</p>
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={doc.status} /></td>
                      <td className="px-3 py-2.5 text-slate-600">{formatDate(doc.updatedAt)}</td>
                      <td className="px-3 py-2.5 flex items-center gap-2">
                        <button type="button" onClick={() => openTimeline(doc)} className="sf-btn-secondary px-3 py-1.5 text-xs">
                          Timeline
                        </button>
                        {(doc.status === "completed" || doc.status === "signed") && (
                          <button 
                            type="button"
                            onClick={async () => {
                               try {
                                 const response = await fetch(dmsApi.signedPdfUrl(doc._id), {
                                   headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('sf_access_token')}`
                                   }
                                 });
                                 if (!response.ok) throw new Error('Unauthorized');
                                 const blob = await response.blob();
                                 const url = window.URL.createObjectURL(blob);
                                 window.open(url, '_blank');
                               } catch (err) {
                                 alert("Failed to open document. Please ensure you are logged in.");
                               }
                            }}
                            className="sf-btn-primary px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700"
                          >
                            View Signed PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">No documents found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {selectedDoc ? (
        <section className="sf-card sf-fade-in mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Timeline: {selectedDoc.title}</h2>
              <p className="text-sm text-slate-500">Who signed and when</p>
            </div>
            <button type="button" onClick={() => setSelectedDoc(null)} className="sf-btn-secondary px-3 py-1.5 text-xs">
              Close
            </button>
          </div>

          {timelineLoading ? <p className="text-sm text-slate-500">Loading timeline...</p> : null}

          {!timelineLoading ? (
            <div className="space-y-4">
              {timeline.length ? (
                timeline.map((item, index) => (
                  <div key={`${item.signerEmail}-${index}`} className="relative pl-8">
                    <span className="absolute left-1 top-2 h-3 w-3 rounded-full bg-slate-800" />
                    <span className="absolute left-[6px] top-5 h-full w-px bg-slate-200" />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-800">{item.signerEmail}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Order #{item.signingOrder}</p>
                      <p className="mt-1 text-sm text-slate-600">Viewed: {formatDate(item.viewedAt)}</p>
                      <p className="text-sm text-slate-600">Signed: {formatDate(item.signedAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No timeline entries available.</p>
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </DashboardLayout>
  );
};

export default HistoryPage;
