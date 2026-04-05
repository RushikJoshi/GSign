import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { authApi, uploadApi } from "../services/api";
import { Camera, Pencil, Trash2, Check, User as UserIcon, Shield, Loader2, ChevronDown } from "lucide-react";
import SignatureModal from "../components/common/SignatureModal";

const Settings = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("my_profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  
  // Signature Modal states
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("signature"); // 'signature' | 'initial' | 'stamp'
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    companyName: "",
    dateFormat: "MMM dd yyyy HH:mm z",
    timeZone: "Asia/Kolkata",
    signatureUrl: null,
    initialsUrl: null,
    stampUrl: null
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        jobTitle: user.jobTitle || "",
        companyName: user.company?.name || "",
        dateFormat: user.dateFormat || "MMM dd yyyy HH:mm z",
        timeZone: user.timeZone || "Asia/Kolkata",
        signatureUrl: user.signatureUrl,
        initialsUrl: user.initialsUrl,
        stampUrl: user.stampUrl
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenSignatureModal = (type) => {
    setModalMode(type);
    setIsSignModalOpen(true);
  };

  const onSaveSignature = async (dataUrl) => {
    setSaveLoading(true);
    try {
      const { data: uploadRes } = await uploadApi.uploadContent({
        content: dataUrl,
        fileName: `${modalMode}_${user.id}_${Date.now()}.png`,
        folder: "user_signatures"
      });

      const newUrl = uploadRes.fileUrl;
      const fieldMapping = {
        signature: 'signatureUrl',
        initial: 'initialsUrl',
        stamp: 'stampUrl'
      };

      const fieldToUpdate = fieldMapping[modalMode];
      const updateData = { [fieldToUpdate]: newUrl };
      const { data: userRes } = await authApi.updateProfile(updateData);
      
      setUser(userRes.user);
      setFormData(prev => ({ ...prev, [fieldToUpdate]: newUrl }));
      
      setSuccess(`${modalMode.charAt(0).toUpperCase() + modalMode.slice(1)} updated.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setSuccess("");
    try {
      const { data } = await authApi.updateProfile(formData);
      setUser(data.user);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Profile" hideBreadcrumbs={true}>
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-120px)] overflow-hidden mt-6 bg-white border border-slate-200">
        
        {/* Local Tab Sidebar Matching Zoho - COMPACT */}
        <aside className="w-[200px] border-r border-slate-100 bg-slate-50/50 pt-4 pb-10 overflow-y-auto no-scrollbar">
           <div className="px-4 mb-6">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2 px-2">General</h3>
              <nav className="flex flex-col gap-0.5">
                 {[
                   { id: "my_profile", label: "My profile" },
                   { id: "integrations", label: "Integrations" },
                   { id: "notifications", label: "My notifications" },
                   { id: "contacts", label: "Contacts" },
                   { id: "trash", label: "Trash" },
                   { id: "delegate", label: "Delegate" }
                 ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`text-left px-3 py-1.5 rounded text-[12px] font-medium transition-all ${activeTab === tab.id ? 'bg-white text-[#249272] shadow-sm' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700'}`}
                   >
                     {tab.label}
                   </button>
                 ))}
              </nav>
           </div>

           <div className="px-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2 px-2">Admin</h3>
              <nav className="flex flex-col gap-0.5">
                 {[
                   { id: "users", label: "Users and control" },
                   { id: "account", label: "Account settings" },
                   { id: "subscription", label: "Subscription details" },
                   { id: "branding", label: "Branding" }
                 ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`text-left px-3 py-1.5 rounded text-[12px] font-medium transition-all ${activeTab === tab.id ? 'bg-white text-[#249272] shadow-sm' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700'}`}
                   >
                     {tab.label}
                   </button>
                 ))}
              </nav>
           </div>
        </aside>

        {/* Content Area - MORE COMPACT */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
           {activeTab === 'notifications' ? (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
                   <h2 className="text-[22px] font-medium text-slate-800">My notifications</h2>
                   <label className="relative inline-flex items-center cursor-pointer group">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#249272]"></div>
                   </label>
                </div>

                {/* Document Notifications Table */}
                <div>
                   <h3 className="text-[15px] font-bold text-slate-800 mb-1">Document notifications</h3>
                   <p className="text-[13px] text-slate-500 mb-6 tracking-tight">Configure your notification settings for shared documents.</p>
                   
                   <div className="border border-slate-100 rounded overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse bg-white">
                         <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                               <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/2">Notification</th>
                               <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Email</th>
                               <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Mobile</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {[
                              { label: "Viewed", email: false, mobile: false },
                              { label: "Signed", email: true, mobile: true },
                              { label: "Signed in-person", email: false, mobile: false },
                              { label: "Approved", email: true, mobile: true },
                              { label: "Physically signed copy accepted", email: false, mobile: false },
                              { label: "Physically signed copy rejected", email: false, mobile: false },
                              { label: "Declined", email: true, mobile: true },
                              { label: "Recalled", email: true, mobile: true },
                              { label: "Forwarded", email: false, mobile: false },
                              { label: "Access failed", email: false, mobile: false },
                              { label: "Expired", email: false, mobile: false },
                            ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-6 py-2.5 text-[13px] text-slate-700 font-medium">{row.label}</td>
                                 <td className="px-6 py-2.5 text-center">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" defaultChecked={row.email} />
                                 </td>
                                 <td className="px-6 py-2.5 text-center">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" defaultChecked={row.mobile} />
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Admin Notifications Table */}
                <div className="pt-4">
                   <h3 className="text-[15px] font-bold text-slate-800 mb-1">Admin Notifications</h3>
                   <p className="text-[13px] text-slate-500 mb-6 tracking-tight">Configure your notifications for admin operations performed within your organization.</p>
                   
                   <div className="border border-slate-100 rounded overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse bg-white">
                         <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                               <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/2">Notification</th>
                               <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Email</th>
                               <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Mobile</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {["User invited", "User added", "User role/profile updated", "User deleted"].map((label, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-6 py-2.5 text-[13px] text-slate-700 font-medium">{label}</td>
                                 <td className="px-6 py-2.5 text-center">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                 </td>
                                 <td className="px-6 py-2.5 text-center">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="pt-6 pb-20">
                   <button className="bg-[#249272] hover:bg-[#1e7a5f] text-white px-10 py-2 rounded font-bold text-[14px] transition active:scale-95 shadow-sm">
                      Save
                   </button>
                </div>
             </div>
           ) : activeTab === 'my_profile' ? (
              <div className="animate-in fade-in duration-500">
                 {/* Avatar Section Compact */}
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center relative group">
                      {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : <UserIcon className="w-8 h-8 text-slate-300" />}
                      <button className="absolute bottom-0 right-0 p-1 bg-white border border-slate-200 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-slate-800 leading-tight">{formData.firstName || user?.name}</h2>
                      <p className="text-[13px] text-slate-500">{user?.email}</p>
                    </div>
                 </div>

                 <div className="space-y-6 max-w-2xl">
                   {/* Signature & Initial */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-500">Signature and initial</label>
                        <div className="flex gap-4">
                           <div className="w-full h-24 bg-white border border-slate-200 rounded-sm flex items-center justify-center text-slate-400 group relative overflow-hidden transition-all hover:border-emerald-200">
                               {saveLoading && modalMode === 'signature' ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#249272]" />
                                    <span className="text-[10px]">Uploading...</span>
                                  </div>
                               ) : formData.signatureUrl ? (
                                 <img src={formData.signatureUrl} alt="Signature" className="max-h-20 animate-in fade-in zoom-in-95 duration-500" key={formData.signatureUrl} />
                               ) : (
                                 <span className="text-[12px]">Signature</span>
                               )}
                               <button 
                                 onClick={() => handleOpenSignatureModal("signature")}
                                 disabled={saveLoading}
                                 className={`absolute top-2 right-2 p-1 hover:bg-slate-50 rounded transition-opacity disabled:opacity-0 ${saveLoading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                               >
                                  <Pencil className="w-3.5 h-3.5" />
                               </button>
                           </div>

                           <div className="w-1/3 h-24 bg-white border border-slate-200 rounded-sm flex items-center justify-center text-slate-400 group relative overflow-hidden transition-all hover:border-emerald-200">
                               {saveLoading && modalMode === 'initial' ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#249272]" />
                                    <span className="text-[10px]">...</span>
                                  </div>
                               ) : formData.initialsUrl ? (
                                 <img src={formData.initialsUrl} alt="Initials" className="max-h-20 animate-in fade-in zoom-in-95 duration-500 text-[0px]" key={formData.initialsUrl} />
                               ) : (
                                 <span className="text-[12px]">Initial</span>
                               )}
                               <button 
                                 onClick={() => handleOpenSignatureModal("initial")}
                                 disabled={saveLoading}
                                 className={`absolute top-2 right-2 p-1 hover:bg-slate-50 rounded transition-opacity disabled:opacity-0 ${saveLoading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                               >
                                  <Pencil className="w-3.5 h-3.5" />
                               </button>
                           </div>
                        </div>
                      </div>

                      {/* Stamp Section */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-500">Stamp</label>
                        <div className="w-full h-24 bg-white border border-slate-200 rounded-sm flex items-center justify-center text-slate-400 group relative overflow-hidden transition-all hover:border-emerald-200">
                           {saveLoading && modalMode === 'stamp' ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#249272]" />
                                <span className="text-[10px]">Uploading...</span>
                              </div>
                           ) : formData.stampUrl ? (
                             <img src={formData.stampUrl} alt="Stamp" className="max-h-20 animate-in fade-in zoom-in-95 duration-500" key={formData.stampUrl} />
                           ) : (
                             <span className="text-[12px]">Stamp</span>
                           )}
                           <button 
                             onClick={() => handleOpenSignatureModal("stamp")}
                             disabled={saveLoading}
                             className={`absolute top-2 right-2 p-1 hover:bg-slate-50 rounded transition-opacity disabled:opacity-0 ${saveLoading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                           >
                              <Pencil className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </div>
                   </div>

                   {/* Personal Details */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-500 block">First name</label>
                        <input 
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full h-9 border border-slate-200 px-3 rounded-sm text-[14px] bg-white hover:border-slate-300 focus:border-[#249272] outline-none transition-colors shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-500 block">Last name</label>
                        <input 
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full h-9 border border-slate-200 px-3 rounded-sm text-[14px] bg-white hover:border-slate-300 focus:border-[#249272] outline-none transition-colors shadow-sm"
                        />
                      </div>
                      <div className="space-y-2 col-span-full">
                        <label className="text-[13px] font-medium text-slate-500 block">Job title</label>
                        <input 
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleChange}
                          className="w-full h-9 border border-slate-200 px-3 rounded-sm text-[14px] bg-white hover:border-slate-300 focus:border-[#249272] outline-none transition-colors shadow-sm"
                        />
                      </div>
                   </div>

                   <div className="pt-10 pb-12 border-t border-slate-50 flex items-center gap-4">
                      <button 
                       onClick={handleUpdate}
                       disabled={loading || saveLoading}
                       className="bg-[#249272] hover:bg-[#1e7a5f] text-white px-8 h-9 rounded-sm font-bold text-[14px] transition active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Update"}
                      </button>
                      {success && (
                        <span className="text-emerald-600 text-[13px] font-medium flex items-center gap-1">
                           <Check className="w-4 h-4" /> {success}
                        </span>
                      )}
                   </div>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center py-20 grayscale opacity-40">
                <Shield className="w-16 h-16 text-slate-400 mb-4 stroke-[1]" />
                <h3 className="text-xl font-bold text-slate-800">Section Under Development</h3>
                <p className="text-slate-500 mt-2">The {activeTab.replace('_', ' ')} settings are being finalized.</p>
             </div>
           )}
        </main>
      </div>

      <SignatureModal 
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={onSaveSignature}
        allowedModes={modalMode === 'stamp' ? ['upload'] : ['type', 'draw', 'upload']}
        title={modalMode === 'stamp' ? 'Upload stamp' : `Create Your ${modalMode === 'initial' ? 'Initials' : modalMode.charAt(0).toUpperCase() + modalMode.slice(1)}`}
      />

    </DashboardLayout>
  );
};

export default Settings;
