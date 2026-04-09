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
  History,
  Workflow
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";

const Sidebar = ({ setSidebarOpen }) => {
  const { user } = useAuth();

  const mainLinks = [
    { 
      label: "Dashboard", 
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
          title: "Status",
          links: [
            { label: "All Documents", to: "/history" },
            { label: "In Progress", to: "/history?status=in_progress" },
            { label: "Completed", to: "/history?status=completed" },
            { label: "Declined", to: "/history?status=declined" },
            { label: "Expired", to: "/history?status=expired" },
            { label: "Draft", to: "/history?status=draft" },
          ]
        },
        {
          title: "Inbox",
          links: [
            { label: "Waiting for Me", to: "/history" },
            { label: "Needs Review", to: "/history" },
          ]
        }
      ]
    },
    { label: "Templates", to: "/templates", icon: FileStack },
    { label: "SignForms", to: "/sign-forms", icon: SquarePen },
    { label: "Workflows", to: "/workflows", icon: Workflow },
    { label: "Reports", to: "/reports", icon: BarChart3 },
    { 
      label: "Settings", 
      to: "/settings", 
      icon: Settings,
      hasFlyout: true,
      sections: [
        {
          title: "Preferences",
          links: [
            { label: "My Profile", to: "/settings" },
            { label: "Notifications", to: "/settings" },
            { label: "Integrations", to: "/settings" },
          ]
        },
        {
          title: "Organization",
          links: [
            { label: "Team Members", to: "/settings" },
            { label: "Account Settings", to: "/settings" },
            { label: "Branding", to: "/settings" },
          ]
        }
      ]
    },
  ];

  return (
    <aside className="h-screen flex flex-col bg-[#0F172A] w-[72px] fixed lg:static inset-y-0 z-50 border-r border-slate-800 shadow-2xl transition-all duration-300 overflow-visible">
      {/* Premium Logo Area */}
      <div className="h-[72px] flex items-center justify-center relative border-b border-slate-800/50">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform hover:rotate-6 transition-transform cursor-pointer">
           <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Navigation Area */}
      <div className="flex-1 py-8 flex flex-col items-center">
        <nav className="w-full space-y-3 px-3">
          {mainLinks.map((link) => (
            <div key={link.label} className="relative group">
              <NavLink
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all duration-300 relative group ${
                    isActive 
                      ? "text-emerald-400 bg-emerald-500/10 shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon className={`w-[20px] h-[20px] transition-all duration-300 ${isActive ? 'text-emerald-400' : 'group-hover:text-white text-slate-400'}`} />
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 border border-slate-700/50 text-white text-[12px] font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all whitespace-nowrap z-[110] shadow-2xl backdrop-blur-md">
                       {link.label}
                    </div>

                    {/* Active Indicator Bar */}
                    <div className={`absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full transition-all duration-300 origin-left ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                  </>
                )}
              </NavLink>

              {/* Advanced Flyout with Glassmorphism */}
              {link.hasFlyout && (
                <div className={`absolute left-full ${link.label === 'Settings' ? 'bottom-0' : 'top-0'} ml-2 w-[260px] bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-300 z-[100] border border-slate-700/50`}>
                   <div className="p-6 space-y-8">
                     {link.sections.map((section) => (
                       <div key={section.title}>
                         <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-4">{section.title}</h4>
                         <div className="space-y-1">
                            {section.links.map((sublink) => (
                              <NavLink 
                                key={sublink.label} 
                                to={sublink.to} 
                                className="block py-2 px-3 rounded-lg text-[13px] font-medium text-slate-300 hover:text-white hover:bg-emerald-500/10 transition-all font-inter"
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

      {/* Action Button at Bottom */}
      <div className="p-4 mt-auto border-t border-slate-800/50 flex justify-center">
         <NavLink 
           to="/request/new" 
           className="w-12 h-12 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
           title="Create New Request"
         >
           <Plus className="w-6 h-6 stroke-[3] group-hover:rotate-90 transition-transform duration-500" />
         </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
