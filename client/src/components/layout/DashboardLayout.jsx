import { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { Menu, LogOut, Bell, Search, User, ChevronDown } from "lucide-react";
import AdvancedSearch from "../dashboard/AdvancedSearch";

const DashboardLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      {/* Sidebar Component */}
      <Sidebar setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Advanced Search Overlay Component */}
        <AdvancedSearch 
          isOpen={advancedSearchOpen} 
          onClose={() => setAdvancedSearchOpen(false)} 
        />

        {/* Header Enhancement */}
        <header className="h-[60px] bg-white border-b border-slate-100 px-8 flex items-center justify-between z-40 flex-shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-lg transition"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded border border-slate-200 w-full max-w-[500px] focus-within:border-[#249272] focus-within:bg-white transition-all group">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-[13px] focus:outline-none w-full text-slate-600 font-medium placeholder:text-slate-400"
              />
              <button 
                onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                className={`p-1 hover:bg-slate-200 rounded transition-colors ${advancedSearchOpen ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'}`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <div className="flex items-center gap-2 group cursor-pointer border-l border-slate-100 pl-6">
               <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                 {user?.avatar ? <img src={user.avatar} /> : <User className="w-4 h-4" />}
               </div>
               <div className="hidden sm:flex items-center gap-2">
                 <span className="text-[13px] font-bold text-slate-700">{user?.name}</span>
                 <ChevronDown className="w-3 h-3 text-slate-400" />
               </div>
            </div>

            <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <button 
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <div className="w-full min-h-full px-8 py-6">
            {/* Dynamic Page Header */}
            <div className="mb-6">
              <h1 className="text-[22px] font-medium text-slate-800 tracking-tight">{title}</h1>
              {subtitle && <p className="text-[12px] text-slate-500 font-medium mt-1">{subtitle}</p>}
            </div>

            {/* Content Injection */}
            <div className="pb-24">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
