import { useEffect, useRef, useState } from "react";
import { documentApi } from "../services/api";
import Select from "../components/common/Select";

const statusClass = {
  Signed: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Viewed: "bg-blue-100 text-blue-700",
  Rejected: "bg-rose-100 text-rose-700",
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UploadDocument = () => {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [latestSignLink, setLatestSignLink] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSignRequest, setLoadingSignRequest] = useState(false);

  const fetchDocuments = async () => {
    const { data } = await documentApi.list();
    const docs = data.documents || [];
    setDocuments(docs);
    setSelectedDocId((prev) => prev || docs[0]?._id || "");
  };

  useEffect(() => {
    fetchDocuments().catch(() => setError("Failed to load documents."));
  }, []);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    setMessage("");

    if (!nextFile) {
      setFile(null);
      return;
    }
    if (nextFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      setFile(null);
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    setLoadingUpload(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("document", file);

      const { data } = await documentApi.upload(formData);
      setMessage(data.message || "Document uploaded successfully.");
      setLatestSignLink("");
      setTitle("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchDocuments();
      setSelectedDocId(data.document._id);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleSendSignRequest = async (event) => {
    event.preventDefault();
    if (!selectedDocId) {
      setError("Select a document first.");
      return;
    }
    setLoadingSignRequest(true);
    setError("");
    setMessage("");
    try {
      const { data } = await documentApi.sendSignRequest(selectedDocId, {
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim(),
      });
      setMessage(data.message || "Sign request sent.");
      setLatestSignLink(data.signLink || "");
      setSignerName("");
      setSignerEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request.");
    } finally {
      setLoadingSignRequest(false);
    }
  };

  const copySignLink = async () => {
    if (!latestSignLink) return;
    try {
      await navigator.clipboard.writeText(latestSignLink);
      setMessage("Sign link copied to clipboard.");
    } catch {
      setError("Could not copy link. Please copy it manually.");
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-5 shadow-soft">
        <h1 className="text-2xl font-extrabold text-slate-900">Upload & Send for Signature</h1>
        <p className="mt-1 text-sm text-slate-600">Upload PDFs and send secure signing links in one flow.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-2xl font-extrabold text-ink">Upload PDF</h2>
          <p className="mt-1 text-sm text-slate-600">Store and prepare a document for e-signing.</p>

          <form onSubmit={handleUpload} className="mt-5 space-y-4">
            <input
              type="text"
              value={title}
              required
              placeholder="Document title"
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />

            <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-700">PDF file (max {MAX_FILE_SIZE_MB}MB)</span>
                <span className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-600">Choose File</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                required
                accept="application/pdf"
                onChange={handleFileChange}
                className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
              />
              <p className="mt-2 text-xs text-slate-500">{file ? `Selected: ${file.name}` : "No file selected"}</p>
            </label>

            <button
              disabled={loadingUpload}
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingUpload ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-2xl font-extrabold text-ink">Send Sign Request</h2>
          <p className="mt-1 text-sm text-slate-600">Generate token link and email it to signer.</p>

          <form onSubmit={handleSendSignRequest} className="mt-5 space-y-4">
            <Select
              value={selectedDocId}
              onChange={setSelectedDocId}
              options={[
                { value: "", label: "Select document" },
                ...documents.map((doc) => ({
                  value: doc._id,
                  label: `${doc.title} (${doc.status})`
                }))
              ]}
              className="w-full"
            />
            <input
              type="text"
              required
              placeholder="Signer name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="email"
              required
              placeholder="Signer email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <button
              disabled={loadingSignRequest || !documents.length}
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingSignRequest ? "Sending..." : "Send Request"}
            </button>
          </form>
        </article>
      </div>

      {(message || error || latestSignLink) && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p className="text-sm font-medium text-rose-700">{error}</p>}
          {latestSignLink && (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <a
                href={latestSignLink}
                target="_blank"
                rel="noreferrer"
                className="truncate text-sm font-medium text-indigo-600 underline-offset-2 hover:underline"
              >
                {latestSignLink}
              </a>
              <button
                type="button"
                onClick={copySignLink}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Copy Link
              </button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-semibold text-slate-800">Recent Documents</h3>
        <div className="mt-3 max-h-44 overflow-auto">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.slice(0, 6).map((doc) => (
                <li key={doc._id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                    <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[doc.status] || "bg-slate-100 text-slate-700"
                      }`}
                  >
                    {doc.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </section>
  );
};

export default UploadDocument;
