import { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { Menu, LogOut, Bell, Search, User, ChevronDown, Settings, HelpCircle, Activity } from "lucide-react";
import AdvancedSearch from "../dashboard/AdvancedSearch";

const DashboardLayout = ({ title, subtitle, children, hideBreadcrumbs }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden relative font-inter">
      {/* Sidebar Navigation */}
      <Sidebar setSidebarOpen={setSidebarOpen} />

      {/* Primary Layout Engine */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <AdvancedSearch 
          isOpen={advancedSearchOpen} 
          onClose={() => setAdvancedSearchOpen(false)} 
        />

        {/* Simple Global Header */}
        <header className="h-[64px] bg-white border-b border-slate-200 px-8 flex items-center justify-between z-40 shrink-0 sticky top-0 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl w-full max-w-[480px] focus-within:border-emerald-400 focus-within:bg-white transition-all shadow-inner group">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-[13.5px] focus:outline-none w-full text-slate-600"
              />
              <div className="h-4 w-[1px] bg-slate-200 mx-1" />
              <button 
                onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                className={`p-1 hover:bg-slate-200 rounded transition-all ${advancedSearchOpen ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}
                title="Advanced Search"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${advancedSearchOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-emerald-600 transition-all relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>

            <div className="flex items-center gap-3 p-1 rounded-full border border-slate-100 pr-4 hover:border-emerald-200 cursor-pointer transition-all shadow-sm group">
               <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-100 flex items-center justify-center text-emerald-600 shadow-inner overflow-hidden">
                 {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-[16px] h-[16px]" />}
               </div>
               <span className="hidden sm:block text-[13px] font-bold text-slate-700 leading-none">{user?.name}</span>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Minimal Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pt-8">
          <div className="flex-1 px-8 pb-10 space-y-6">
            {!hideBreadcrumbs && (
                <div className="pb-4">
                    <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">{title}</h1>
                    {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
                </div>
            )}

            <div>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Interactive Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[2px] transition-all animate-in fade-in duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
