import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatusBadge from "../components/dashboard/StatusBadge";
import { dmsApi } from "../services/api";
import Select from "../components/common/Select";

import TimelineDrawer from "../components/dashboard/TimelineDrawer";

const statusFilters = ["all", "pending", "signed", "completed", "expired"];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const HistoryPage = () => {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const statusOptions = statusFilters.map(item => ({
    value: item,
    label: item === "all" ? "All statuses" : item.charAt(0).toUpperCase() + item.slice(1)
  }));


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
    setCurrentPage(1); // Reset to first page on initial load
  }, []);

  // Pagination logic
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return documents.slice(startIndex, startIndex + itemsPerPage);
  }, [documents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(documents.length / itemsPerPage);

  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openTimeline = async (doc) => {
    if (!doc) return;
    setSelectedDoc(doc);
    setTimeline([]);
    setTimelineLoading(true);
    setIsDrawerOpen(true);

    try {
      const { data } = await dmsApi.getTimeline(doc._id);
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error("Timeline load error:", err);
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
      <section className="mb-4 grid gap-3 md:grid-cols-4">
        {["pending", "signed", "completed", "expired"].map((item) => (
          <div key={item} className="sf-card p-3 md:p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item}</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-800">{totalByStatus[item] || 0}</p>
          </div>
        ))}
      </section>

      <section className="sf-card p-3 md:p-4">
        <div className="mb-3.5 flex flex-col gap-2.5 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="sf-input w-full md:max-w-sm h-[38px] !py-0"
          />
          <Select
            value={status}
            onChange={setStatus}
            options={statusOptions}
            className="w-full md:w-48 h-[38px]"
          />
          <button
            onClick={() => {
              loadDocuments();
              setCurrentPage(1);
            }}
            type="button"
            className="sf-btn-primary h-[38px] !py-0 whitespace-nowrap"
          >
            Apply Filters
          </button>
        </div>

        {error ? <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-500">Loading history...</p> : null}

        {!loading ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider">Document</th>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider">Updated</th>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocuments.length ? (
                    paginatedDocuments.map((doc) => (
                      <tr key={doc._id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="px-3 py-2">
                          <p className="text-sm font-bold text-slate-700 leading-tight">{doc.title}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{doc.description || "No description"}</p>
                        </td>
                        <td className="px-3 py-2"><StatusBadge status={doc.status} /></td>
                        <td className="px-3 py-2 text-[12px] font-medium text-slate-500">{formatDate(doc.updatedAt)}</td>
                        <td className="px-3 py-2 flex items-center gap-2">
                          <button type="button" onClick={() => openTimeline(doc)} className="sf-btn-secondary px-3 h-[30px] !py-0 text-[11px] font-bold uppercase tracking-tighter shadow-sm">
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
                                  console.error("View PDF error:", err);
                                  alert(err.message === 'Unauthorized'
                                    ? "Session expired. Please log in again."
                                    : "Failed to open document. It may not be ready yet or the file is missing.");
                                }
                              }}
                              className="sf-btn-primary px-3 h-[30px] !py-0 text-[11px] font-bold uppercase tracking-tighter bg-cyan-600 hover:bg-cyan-700 shadow-sm shadow-cyan-100"
                            >
                              View PDF
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

            {/* Pagination UI */}
            {documents.length > 0 && (
              <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 md:flex-row">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-500">Show</span>
                  <Select
                    value={itemsPerPage}
                    onChange={(val) => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: 10, label: "10" },
                      { value: 20, label: "20" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" }
                    ]}
                    className="w-20"
                  />
                  <span className="text-[12px] text-slate-500">entries</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="sf-btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentPage(i + 1)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                      >
                        {i + 1}
                      </button>
                    )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                  </div>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="sf-btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>

                <div className="text-[12px] font-medium text-slate-500">
                  Showing {Math.min(documents.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(documents.length, currentPage * itemsPerPage)} of {documents.length} entries
                </div>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* Side Panel for Timeline */}
      <TimelineDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedDoc={selectedDoc}
        timeline={timeline}
        loading={timelineLoading}
      />
    </DashboardLayout>
  );
};

export default HistoryPage;
