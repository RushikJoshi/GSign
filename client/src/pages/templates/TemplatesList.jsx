import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { templateApi } from "../../services/api";
import Select from "../../components/common/Select";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Trash2,
  Edit,
  Play,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Settings,
  Share2,
  Copy,
  UserPlus,
  Download,
  Eye,
  Link
} from "lucide-react";

const TemplatesList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLimit, setShowLimit] = useState(10);
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();

  const limitOptions = [
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" }
  ];

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await templateApi.getTemplates({ search: searchQuery });
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [searchQuery]);

  const handleDuplicate = async (id) => {
    try {
      await templateApi.duplicateTemplate(id);
      fetchTemplates();
    } catch (err) {
      alert("Failed to duplicate template.");
    }
  };

  const handleToggleSignForm = async (template) => {
    try {
      const res = await templateApi.toggleSignForm(template._id, { isPublic: !template.isPublic });
      const updated = res.data.template;
      setTemplates(templates.map(t => t._id === updated._id ? updated : t));

      if (updated.isPublic) {
        const publicUrl = `${window.location.origin}/signform/${updated.signFormCode}`;
        navigator.clipboard.writeText(publicUrl);
        alert(`SignForm enabled! Public link copied to clipboard:\n${publicUrl}`);
      } else {
        alert("SignForm disabled.");
      }
    } catch (err) {
      alert("Failed to toggle SignForm.");
    }
  };

  const handleView = (id) => {
    navigate(`/templates/${id}/preview`);
  };

  const handleDownload = (id, name) => {
    const url = templateApi.templateFileUrl(id);
    const token = localStorage.getItem('sf_access_token');
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name || 'template.pdf';
        a.click();
      });
  };

  const handleCopyLink = (template) => {
    if (template.signFormCode) {
      const publicUrl = `${window.location.origin}/signform/${template.signFormCode}`;
      navigator.clipboard.writeText(publicUrl);
      alert("Public SignForm link copied to clipboard!");
    } else {
      alert("This template is not public. Enable 'SignForm' first.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await templateApi.deleteTemplate(id);
        fetchTemplates();
      } catch (err) {
        console.error("Failed to delete template", err);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <DashboardLayout title="Templates">
      <div className="flex flex-col gap-0 font-sans text-slate-700">

        {/* Info Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 px-5 mb-6 flex items-center gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-[13px] text-slate-600">
            Only admins can access all the templates by default. To let users use a template, use the 'Share' option.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-10 text-[24px] font-medium text-slate-800">Templates</div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 pl-10 pr-4 bg-slate-100 border-none rounded text-[13px] focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="flex border border-emerald-600 rounded overflow-hidden">
              <button
                onClick={() => navigate("/templates/create")}
                className="bg-[#249272] h-9 px-4 text-white text-[13px] font-bold flex items-center gap-2 hover:bg-[#1e7a5f] transition border-r border-emerald-700"
              >
                <Plus className="w-4 h-4" /> Create template
              </button>
              <button className="bg-[#249272] h-9 px-2 text-white hover:bg-[#1e7a5f] transition">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 py-3 mb-2 px-2">
          <div className="flex items-center gap-6">
            <span className="text-[12px] text-slate-500">View 1 - {templates.length} of {templates.length}</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-500">Show</span>
              <Select
                value={showLimit}
                onChange={setShowLimit}
                options={limitOptions}
                className="w-16 h-7 text-[12px]"
              />
            </div>
            <div className="relative">
              <button className="h-7 px-4 border border-slate-200 rounded text-[12px] text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition">
                Actions <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border-r border-slate-200 pr-4">
              <button className="p-1 text-slate-300"><ChevronsLeft className="w-4 h-4" /></button>
              <button className="p-1 text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
              <div className="h-7 w-7 flex items-center justify-center border border-slate-200 rounded text-[12px] text-emerald-600 font-bold bg-emerald-50">1</div>
              <button className="p-1 text-slate-400"><ChevronRight className="w-4 h-4" /></button>
              <button className="p-1 text-slate-400"><ChevronsRight className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
              <LayoutGrid className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <div className="overflow-visible">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left">
                <th className="w-12 py-3 px-4"><input type="checkbox" className="rounded-sm accent-emerald-600" /></th>
                <th className="py-3 px-4">Template name</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Active Signforms</th>
                <th className="py-3 px-4">Last modified on</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">Loading templates...</td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">No templates found.</td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template._id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="py-4 px-4"><input type="checkbox" className="rounded-sm accent-emerald-600" /></td>
                    <td className="py-4 px-4 font-bold text-slate-800">{template.name}</td>
                    <td className="py-4 px-4">{template.ownerName || "Me"}</td>
                    <td className="py-4 px-4 text-center">
                      {template.isPublic ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Active</span>
                      ) : "-"}
                    </td>
                    <td className="py-4 px-4">{formatDate(template.updatedAt)}</td>
                    <td className="py-4 px-4 relative text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === template._id ? null : template._id);
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition"
                      >
                        <MoreHorizontal className="w-5 h-5 text-slate-400" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenu === template._id && (
                        <div className="absolute right-12 top-0 w-56 bg-white border border-slate-200 rounded-lg shadow-2xl z-[100] py-2 text-left animate-in fade-in slide-in-from-top-1">
                          <button onClick={() => navigate(`/templates/${template._id}/edit`)} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] text-slate-700">
                            <Edit className="w-4 h-4 text-slate-400" /> Edit
                          </button>
                          <button onClick={() => navigate(`/templates/${template._id}/use`)} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] text-slate-700">
                            <Play className="w-4 h-4 text-slate-400" /> Use template
                          </button>
                          <button onClick={() => handleView(template._id)} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] text-slate-700 border-b border-slate-100">
                            <Eye className="w-4 h-4 text-slate-400" /> View template
                          </button>

                          <button onClick={() => handleToggleSignForm(template)} className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] border-b border-slate-100 mt-1 ${template.isPublic ? 'text-orange-600' : 'text-[#249272] font-medium'}`}>
                            <Link className="w-4 h-4" /> {template.isPublic ? 'Disable SignForm' : 'Create SignForm'}
                          </button>

                          <button onClick={() => handleDuplicate(template._id)} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] text-slate-700 mt-1">
                            <Copy className="w-4 h-4 text-slate-400" /> Edit as new
                          </button>
                          <button onClick={() => handleCopyLink(template)} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] text-slate-700">
                            <Share2 className="w-4 h-4 text-slate-400" /> Copy SignForm Link
                          </button>
                          <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] text-slate-700">
                            <UserPlus className="w-4 h-4 text-slate-400" /> Change ownership
                          </button>
                          <button onClick={() => handleDownload(template._id, template.name)} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 text-[13px] text-slate-700 border-b border-slate-100">
                            <Download className="w-4 h-4 text-slate-400" /> Export template
                          </button>

                          <button
                            onClick={() => handleDelete(template._id)}
                            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-rose-50 text-[13px] text-rose-500 font-medium mt-1"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Click Handler to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setActiveMenu(null)}
        ></div>
      )}
    </DashboardLayout>
  );
};

export default TemplatesList;
