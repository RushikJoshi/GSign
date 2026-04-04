import { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { Menu, LogOut, Bell, Search, User, ChevronDown } from "lucide-react";

const DashboardLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Enhancement */}
        <header className="h-[60px] bg-white border-b border-slate-200 px-6 flex items-center justify-between z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-lg transition"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 w-[280px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-sm focus:outline-none w-full text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 font-medium text-slate-600">
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors relative">
               <Bell className="w-4 h-4" />
               <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-sky-500 rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700">{user?.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{user?.role}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <User className="w-4 h-4" />
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all text-slate-400"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
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
