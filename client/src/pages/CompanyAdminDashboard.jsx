import { useEffect, useMemo, useState } from "react";
import MetricCard from "../components/dashboard/MetricCard";
import StatusBadge from "../components/dashboard/StatusBadge";
import TablePanel from "../components/dashboard/TablePanel";
import DashboardLayout from "../components/layout/DashboardLayout";
import { companyAdminApi, dmsApi } from "../services/api";
import { FileText, Users, CheckCircle2, ListChecks, UserPlus, Upload, ShieldCheck, PlayCircle, Clock, Bell } from "lucide-react";

const parseSignerRows = (rawText) => {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const [emailPart, orderPart] = line.split(",").map((item) => item.trim());
    return {
      email: String(emailPart || "").toLowerCase(),
      signingOrder: Number(orderPart || index + 1),
    };
  });
};

const CompanyAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    expiryDate: "",
    storage: "local",
    reminderIntervalHours: 24,
    file: null,
  });
  const [savingSigners, setSavingSigners] = useState(false);
  const [signerForm, setSignerForm] = useState({
    documentId: "",
    signerRows: "",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [startingDocId, setStartingDocId] = useState("");

  const loadData = async () => {
    try {
      const [docsRes, usersRes] = await Promise.all([dmsApi.getDocuments(), companyAdminApi.getUsers()]);
      setDocuments(docsRes.data.documents || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError("Unable to load data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = [
    { title: "Created", value: documents.length, hint: "Total", icon: FileText },
    { 
      title: "Pending", 
      value: documents.reduce((acc, doc) => acc + (doc.signers || []).filter(s => ["pending", "viewed"].includes(s.status)).length, 0), 
      hint: "Awaiting", icon: Clock 
    },
    { title: "Completed", value: documents.filter(doc => doc.status === "completed").length, icon: CheckCircle2 },
  ];

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) return;
    try {
      setCreatingUser(true);
      await companyAdminApi.createUser(userForm);
      setUserForm({ name: "", email: "", password: "", role: "employee" });
      setMessage("User created");
      loadData();
    } catch (err) { setError("Failed to create user"); }
    finally { setCreatingUser(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("document", uploadForm.file);
      await dmsApi.uploadDocument(formData);
      setUploadForm({ title: "", description: "", expiryDate: "", storage: "local", reminderIntervalHours: 24, file: null });
      setMessage("Uploaded successfully");
      loadData();
    } catch (err) { setError("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSaveSigners = async (e) => {
    e.preventDefault();
    if (!signerForm.documentId) return;
    const signers = parseSignerRows(signerForm.signerRows).filter(s => s.email);
    try {
      setSavingSigners(true);
      await dmsApi.addSigners(signerForm.documentId, { signers });
      setSignerForm({ documentId: "", signerRows: "" });
      setMessage("Signers updated");
      loadData();
    } catch (err) { setError("Failed to save signers"); }
    finally { setSavingSigners(false); }
  };

  const handleStartFlow = async (id) => {
    try {
      setStartingDocId(id);
      await dmsApi.startSigningFlow(id);
      setMessage("Workflow started");
      loadData();
    } catch (err) { setError("Failed to start"); }
    finally { setStartingDocId(""); }
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your signature workflows.">
      <div className="space-y-6">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map(s => <MetricCard key={s.title} {...s} />)}
        </section>

        {(error || message) && (
          <div className={`p-3 text-[13px] font-semibold rounded-lg border ${error ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions Component */}
          <div className="space-y-6">
             <div className="sf-card p-6">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-5">
                   <Upload className="w-4 h-4 text-sky-600" />
                   Quick Add Document
                </h3>
                <form onSubmit={handleUpload} className="space-y-3">
                   <input 
                     value={uploadForm.title} 
                     onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                     placeholder="Document Title" 
                     className="sf-input"
                   />
                   <div className="relative group">
                     <input 
                       type="file" 
                       accept=".pdf" 
                       onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))}
                       className="absolute inset-0 opacity-0 cursor-pointer"
                     />
                     <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center group-hover:bg-slate-50 transition-colors">
                        <p className="text-[11px] font-semibold text-slate-500 truncate">{uploadForm.file?.name || "Choose file..."}</p>
                     </div>
                   </div>
                   <button type="submit" disabled={uploading} className="sf-btn-primary w-full py-2">
                     {uploading ? "Uploading..." : "Save and Send"}
                   </button>
                </form>
             </div>

             <div className="sf-card p-6">
                <div className="flex items-center justify-between mb-5">
                   <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-600" />
                      Team Members
                   </h3>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{users.length} Active</span>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                   {users.map(u => (
                      <div key={u._id} className="flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100 rounded-lg">
                         <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                               {u.name[0]}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{u.name}</span>
                         </div>
                         <StatusBadge status={u.role} />
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Workflow Configuration */}
          <div className="sf-card p-6">
             <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Workflow Setup
             </h3>
             <form onSubmit={handleSaveSigners} className="space-y-4">
                <select 
                  value={signerForm.documentId} 
                  onChange={e => setSignerForm(p => ({ ...p, documentId: e.target.value }))}
                  className="sf-input"
                >
                  <option value="">Target Document</option>
                  {documents.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
                </select>
                <textarea 
                  value={signerForm.signerRows} 
                  onChange={e => setSignerForm(p => ({ ...p, signerRows: e.target.value }))}
                  placeholder={"email@domain.com, 1\nmanager@domain.com, 2"}
                  className="sf-input min-h-[120px] font-mono text-[11px]"
                />
                <button type="submit" disabled={savingSigners} className="sf-btn-primary w-full py-2">
                   Save Order
                </button>
             </form>
          </div>
        </div>

        {/* Tracking Table */}
        <div className="sf-card overflow-hidden">
           <TablePanel 
              title="Recent Activities"
              rows={documents.slice(0, 10).map(doc => ({
                id: doc._id,
                title: doc.title,
                status: <StatusBadge status={doc.status} />,
                participants: doc.signers?.length || 0,
                updated: new Date(doc.updatedAt).toLocaleDateString(),
                actions: (
                  <button 
                    onClick={() => handleStartFlow(doc._id)}
                    disabled={startingDocId === doc._id || doc.status === "completed"}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors disabled:opacity-30"
                  >
                    <PlayCircle className="w-4 h-4 text-sky-600" />
                  </button>
                )
              }))}
              columns={[
                { key: "title", label: "Workflow" },
                { key: "status", label: "Status" },
                { key: "participants", label: "Signers" },
                { key: "updated", label: "Date" },
                { key: "actions", label: "" }
              ]}
           />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyAdminDashboard;
