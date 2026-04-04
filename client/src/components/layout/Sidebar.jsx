import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  FileStack, 
  SquarePen, 
  BarChart3, 
  Settings, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  History
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";

const Sidebar = ({ setSidebarOpen }) => {
  const { user } = useAuth();
  const [documentsExpanded, setDocumentsExpanded] = useState(true);

  const mainLinks = [
    { label: "Dashboard", to: user.role === ROLES.SUPERADMIN ? "/super-admin" : "/company-admin", icon: LayoutDashboard },
    { label: "Templates", to: "/templates", icon: FileStack },
    { label: "SignForms", to: "/sign-forms", icon: SquarePen },
    { label: "Reports", to: "/reports", icon: BarChart3 },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const sentSubLinks = [
    { label: "All", to: "/documents/sent/all", icon: History },
    { label: "In Progress", to: "/documents/sent/in-progress", icon: Clock },
    { label: "Completed", to: "/documents/sent/completed", icon: CheckCircle2 },
    { label: "Declined", to: "/documents/sent/declined", icon: XCircle },
  ];

  return (
    <aside className="sf-sidebar h-screen flex flex-col bg-[#1e293b] text-slate-400 w-[240px] fixed lg:static inset-y-0 z-50">
      {/* Branding */}
      <div className="h-[60px] flex items-center px-6 gap-3 border-b border-white/5">
        <div className="w-7 h-7 rounded bg-sky-500 flex items-center justify-center text-white font-bold text-sm">S</div>
        <span className="text-lg font-bold text-white tracking-tight">SignFlow</span>
      </div>

      {/* Menu Area */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="px-3 space-y-0.5">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-[13px] transition-colors ${
                  isActive 
                    ? "bg-sky-500/10 text-sky-400 font-semibold" 
                    : "hover:bg-white/5 hover:text-slate-200"
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Documents Expandable Section */}
        <div className="mt-6 px-3">
          <button 
            onClick={() => setDocumentsExpanded(!documentsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span className="text-[13px] font-semibold">Documents</span>
            </div>
            {documentsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {documentsExpanded && (
            <div className="mt-1 space-y-0.5">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest py-1.5 px-3 pl-10">Sent</div>
              {sentSubLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 pl-10 pr-3 py-1.5 rounded text-[12px] transition-colors ${
                      isActive ? "text-sky-400 bg-sky-500/5 font-medium" : "hover:bg-white/5 hover:text-slate-300"
                    }`
                  }
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </NavLink>
              ))}
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest py-1.5 px-3 pl-10 mt-2">Received</div>
              <NavLink
                to="/documents/received/all"
                className={({ isActive }) =>
                  `flex items-center gap-3 pl-10 pr-3 py-1.5 rounded text-[12px] transition-colors ${
                    isActive ? "text-sky-400 bg-sky-500/5 font-medium" : "hover:bg-white/5 hover:text-slate-300"
                  }`
                }
              >
                <Inbox className="w-3.5 h-3.5" />
                Action Required
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Floating Create Button Area */}
      <div className="p-4 border-t border-white/5">
        <NavLink 
          to="/request/new" 
          className="flex items-center justify-center gap-2 w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-[13px] font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New</span>
        </NavLink>
      </div>

      {/* User Area Bottom */}
      <div className="p-4 bg-slate-900/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
          <p className="text-[10px] text-slate-500 truncate uppercase font-medium">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
