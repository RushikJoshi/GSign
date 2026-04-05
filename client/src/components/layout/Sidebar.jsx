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

  const mainLinks = [
    { 
      label: "Sign", 
      to: user.role === ROLES.SUPERADMIN ? "/super-admin" : "/company-admin", 
      icon: LayoutDashboard 
    },
    { 
      label: "Documents", 
      to: "/history", 
      icon: FileText,
      hasFlyout: true,
      sections: [
        {
          title: "Sent",
          links: [
            { label: "All", to: "/history" },
            { label: "Scheduled", to: "/history" },
            { label: "In progress", to: "/history" },
            { label: "Completed", to: "/history" },
            { label: "Declined", to: "/history" },
            { label: "Expired", to: "/history" },
            { label: "Recalled", to: "/history" },
            { label: "Draft", to: "/history" },
            { label: "Bulk send", to: "/history" },
          ]
        },
        {
          title: "Received",
          links: [
            { label: "All", to: "/history" },
            { label: "Action required", to: "/history" },
          ]
        }
      ]
    },
    { label: "Templates", to: "/templates", icon: FileStack },
    { label: "SignForms", to: "/sign-forms", icon: SquarePen },
    { label: "Reports", to: "/reports", icon: BarChart3 },
    { 
      label: "Settings", 
      to: "/settings", 
      icon: Settings,
      hasFlyout: true,
      sections: [
        {
          title: "General",
          links: [
            { label: "My profile", to: "/settings" },
            { label: "Integrations", to: "/settings" },
            { label: "My notifications", to: "/settings" },
            { label: "Contacts", to: "/settings" },
            { label: "Trash", to: "/settings" },
          ]
        },
        {
          title: "Admin",
          links: [
            { label: "Users and control", to: "/settings" },
            { label: "Account settings", to: "/settings" },
            { label: "Subscription details", to: "/settings" },
            { label: "Branding", to: "/settings" },
          ]
        }
      ]
    },
  ];

  return (
    <aside className="h-screen flex flex-col bg-[#272d37] w-[90px] fixed lg:static inset-y-0 z-50">
      {/* Branding - matching Zoho Logo area */}
      <div className="h-[60px] flex items-center justify-center border-b border-white/5">
        <LayoutDashboard className="w-6 h-6 text-slate-400 opacity-50" />
      </div>

      {/* Menu Area */}
      <div className="flex-1 py-4 flex flex-col items-center">
        <nav className="w-full space-y-4">
          {mainLinks.map((link) => (
            <div key={link.label} className="relative group flex justify-center">
              <NavLink
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 w-full py-3 transition-colors ${
                    isActive 
                      ? "text-[#4fd1c5]" 
                      : "text-slate-400 hover:text-white"
                  }`
                }
              >
                <link.icon className={`w-5 h-5 ${link.label === 'Sign' ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[11px] font-medium">{link.label}</span>
              </NavLink>

              {/* Flyout Menu */}
              {link.hasFlyout && (
                <div className={`absolute left-full ${link.label === 'Settings' ? 'bottom-0' : 'top-0'} ml-0.5 w-[240px] bg-[#2d3748] shadow-2xl rounded-r-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-[100] border-l border-white/5`}>
                   <div className="p-6 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                     {link.sections.map((section) => (
                       <div key={section.title}>
                         <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 opacity-100">{section.title}</h4>
                         <div className="space-y-3">
                            {section.links.map((sublink) => (
                              <NavLink 
                                key={sublink.label} 
                                to={sublink.to} 
                                className="block text-[13px] text-slate-300 hover:text-white transition-colors"
                              >
                                {sublink.label}
                              </NavLink>
                            ))}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Floating Create Button at the bottom (Big Green Plus like Zoho) */}
      <div className="p-6 mt-auto flex justify-center">
         <NavLink 
           to="/request/new" 
           className="w-11 h-11 bg-[#249272] hover:bg-[#1e7a5f] text-white rounded-md shadow-lg flex items-center justify-center transition-all active:scale-95"
           title="Create New"
         >
           <Plus className="w-6 h-6 stroke-[3]" />
         </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
