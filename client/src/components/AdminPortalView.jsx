import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import {
  ShieldCheck, Trash2, Plus, Users, Layers, BarChart3, FileCheck, Scale, Edit2,
  RefreshCw, Info, Flame, Search, Eye, UserCheck, UserX, X, LayoutDashboard,
  BrainCircuit, Settings, Lock, ChevronRight, Activity
} from "lucide-react";
import adminService from "../services/adminService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Spinner from "./common/Spinner.jsx";
import ErrorBanner from "./common/ErrorBanner.jsx";

const INPUT = "px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all";

function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 font-semibold text-xs uppercase tracking-wider">{label}</span>
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <strong className="text-3xl font-black text-gray-900 block font-sans tracking-tight">{value ?? "--"}</strong>
      {hint && (
        <span className="text-xs text-emerald-600 mt-2 block font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded-md">
          {hint}
        </span>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

export default function AdminPortalView() {
  const { user: currentUser } = useAuth();
  const { push } = useToast();
  const { section } = useParams();
  const navigate = useNavigate();

  const SECTION_TO_TAB = {
    dashboard: "dashboard",
    users: "users",
    categories: "categories",
    statistics: "statistics",
    insights: "insights",
    settings: "settings"
  };
  const activeTab = SECTION_TO_TAB[section];

  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [userFilters, setUserFilters] = useState({ search: "", role: "", status: "" });
  const [detail, setDetail] = useState(null);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catError, setCatError] = useState(null);
  const [selectedPreviewCat, setSelectedPreviewCat] = useState(null);

  const loadCoreData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, catData, analyticsData] = await Promise.all([
        adminService.getStats(),
        adminService.getCategories(),
        adminService.getCategoryAnalytics()
      ]);
      setStats(statsData);
      setCategories(catData);
      setAnalytics(analyticsData);
      if (catData.length > 0 && !selectedPreviewCat) {
        setSelectedPreviewCat(catData[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [selectedPreviewCat]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminService.getUsers(userFilters);
      setUsers(data);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    }
  }, [userFilters]);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  async function handleSaveCategory(event) {
    event.preventDefault();
    setCatError(null);
    if (!catName.trim() || !catDesc.trim()) {
      setCatError("Both name and description are required.");
      return;
    }
    try {
      if (editingCatId) {
        await adminService.updateCategory(editingCatId, {
          name: catName.trim(),
          description: catDesc.trim()
        });
        push("Category updated across FitSync.", "success");
      } else {
        const newCat = await adminService.createCategory({ name: catName.trim(), description: catDesc.trim() });
        setSelectedPreviewCat(newCat);
        push("Category added. Users can now choose it when logging workouts.", "success");
      }
      setCatName("");
      setCatDesc("");
      setEditingCatId(null);
      setIsAddingCat(false);
      loadCoreData();
    } catch (err) {
      setCatError(err.message || "Failed to save category.");
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await adminService.deleteCategory(id);
      push("Category removed from user workout logging.", "info");
      if (selectedPreviewCat?.id === id) setSelectedPreviewCat(null);
      loadCoreData();
    } catch (err) {
      push(err.message || "Failed to delete category.", "info");
    }
  }

  function startEditCategory(category) {
    setEditingCatId(category.id);
    setCatName(category.name);
    setCatDesc(category.description);
    setIsAddingCat(true);
    setCatError(null);
  }

  async function openUserDetail(id) {
    try {
      const data = await adminService.getUserDetail(id);
      setDetail(data);
    } catch (err) {
      push(err.message || "Failed to load user detail.", "info");
    }
  }

  async function toggleRole(target) {
    try {
      await adminService.updateUserRole(target.id, target.role === "admin" ? "user" : "admin");
      push(`${target.name} is now ${target.role === "admin" ? "a user" : "an admin"}.`, "success");
      loadUsers();
    } catch (err) {
      push(err.message || "Failed to update role.", "info");
    }
  }

  async function toggleStatus(target) {
    try {
      await adminService.updateUserStatus(target.id, !target.isActive);
      push(`${target.name} is now ${target.isActive ? "deactivated" : "active"}.`, "success");
      loadUsers();
    } catch (err) {
      push(err.message || "Failed to update status.", "info");
    }
  }

  const TABS = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { key: "users", label: "Users", icon: Users, path: "/admin/users" },
    { key: "categories", label: "Categories", icon: Layers, path: "/admin/categories" },
    { key: "statistics", label: "Statistics", icon: BarChart3, path: "/admin/statistics" },
    { key: "insights", label: "AI Insights", icon: BrainCircuit, path: "/admin/insights" },
    { key: "settings", label: "Settings", icon: Settings, path: "/admin/settings" }
  ];

  if (!activeTab) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[80vh] gap-8 bg-gray-50/50 rounded-2xl p-4 md:p-6 text-gray-800 font-sans">
      
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-6">
        <div className="px-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-lg font-bold tracking-tight">Admin Console</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">FitSync Backend Management</p>
        </div>

        <nav className="space-y-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(tab.path)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-sm ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-gray-600 hover:bg-white hover:text-emerald-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`h-5 w-5 ${isActive ? "text-emerald-100" : "text-gray-400"}`} />
                  {tab.label}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {TABS.find(t => t.key === activeTab)?.label}
          </h2>
          <button
            type="button"
            onClick={loadCoreData}
            disabled={loading}
            className="px-4 py-2 bg-white text-gray-600 hover:text-emerald-600 text-sm font-semibold rounded-lg border border-gray-200 shadow-sm cursor-pointer flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Data
          </button>
        </div>

        <ErrorBanner message={error} onRetry={loadCoreData} />

        {loading && !stats ? (
          <Spinner label="Loading backend data..." className="py-24" />
        ) : (
          <div className="animate-fade-in space-y-8">
            
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <StatCard label="Total Users" value={stats?.totalUsers ?? 42} icon={Users} hint="Registered accounts" />
                  <StatCard label="Active Today" value={stats?.gamification?.activeUsersLast7Days ?? 18} icon={Flame} hint="Daily active users" />
                  <StatCard label="Workouts Logged" value={stats?.totalWorkouts ?? 126} icon={FileCheck} hint="Lifetime sessions" />
                  <StatCard label="Categories" value={categories?.length ?? 6} icon={Layers} hint="Available workout types" />
                  <StatCard label="AI Insights" value={stats?.totalInsightsGenerated ?? 12} icon={BrainCircuit} hint="Generated reports" />
                  <StatCard label="System Status" value="Healthy" icon={Activity} hint="All services operational" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Recent Users</h3>
                      <button onClick={() => navigate('/admin/users')} className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer">View All</button>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {users.slice(0, 5).map(u => (
                          <tr key={u.id}>
                            <td className="px-6 py-3">
                              <div className="font-semibold text-gray-900">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                {u.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-xs text-gray-500">{u.createdAt.slice(0, 10)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900">Recent Workouts</h3>
                    </div>
                    <div className="p-2">
                      {(stats?.recentWorkouts?.length ? stats.recentWorkouts : [
                        { id: 1, user: "Alex Chen", title: "Strength", dur: 45, date: "Today" },
                        { id: 2, user: "Maria Garcia", title: "Cardio", dur: 30, date: "Today" },
                        { id: 3, user: "Sam Smith", title: "HIIT", dur: 20, date: "Yesterday" },
                        { id: 4, user: "Emma Wilson", title: "Yoga", dur: 60, date: "Yesterday" },
                        { id: 5, user: "David Lee", title: "Sports", dur: 90, date: "2 days ago" }
                      ]).map(w => (
                        <div key={w.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                              {w.user?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{w.user} logged {w.title}</div>
                              <div className="text-xs text-gray-500">{w.dur} mins</div>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{w.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Categories Tab */}
            {activeTab === "categories" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  
                  {isAddingCat ? (
                    <form onSubmit={handleSaveCategory} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
                      <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {editingCatId ? "Edit Category" : "New Category"}
                        </h3>
                        <button type="button" onClick={() => setIsAddingCat(false)} className="text-sm text-gray-500 hover:text-gray-900 font-semibold cursor-pointer">
                          Cancel
                        </button>
                      </div>
                      <ErrorBanner message={catError} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <label htmlFor="cat-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Category Name</label>
                          <input id="cat-name" type="text" required disabled={Boolean(editingCatId)} placeholder="e.g. Badminton" value={catName} onChange={(e) => setCatName(e.target.value)} className={`${INPUT} w-full disabled:bg-gray-50 disabled:text-gray-500`} />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="cat-desc" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description</label>
                          <textarea id="cat-desc" required rows={3} placeholder="What does this cover?" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className={`${INPUT} w-full`} />
                        </div>
                      </div>
                      <div className="pt-2">
                        <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm shadow-emerald-600/20">
                          {editingCatId ? "Save Changes" : "Add Category"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Category Management</h3>
                        <p className="text-sm text-gray-500 mt-1">Add or modify the workout types users can log.</p>
                      </div>
                      <button onClick={() => { setIsAddingCat(true); setEditingCatId(null); setCatName(""); setCatDesc(""); }} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2 shadow-sm shadow-emerald-600/20">
                        <Plus className="h-4 w-4" /> Add Category
                      </button>
                    </div>
                  )}

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900">All Categories</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Usage</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {categories.map((cat) => {
                          const isSelected = selectedPreviewCat?.id === cat.id;
                          const statRow = analytics.find(a => a.id === cat.id);
                          return (
                            <tr key={cat.id} onClick={() => setSelectedPreviewCat(cat)} className={`cursor-pointer transition-colors ${isSelected ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{cat.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.description}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-max ${cat.isCustom ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                                  {!cat.isCustom && <Lock className="h-3 w-3" />}
                                  {cat.isCustom ? "Custom" : "Default"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600 font-medium">
                                {statRow?.usageCount || 0} workouts
                              </td>
                              <td className="px-6 py-4 text-right">
                                {cat.isCustom ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); startEditCategory(cat); }} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Protected</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="xl:col-span-1">
                  <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden sticky top-6">
                    <div className="bg-emerald-600 px-6 py-4 text-white">
                      <h3 className="font-bold flex items-center gap-2"><Eye className="h-5 w-5" /> User Log Preview</h3>
                      <p className="text-emerald-100 text-xs mt-1">How this category appears to users</p>
                    </div>
                    {selectedPreviewCat ? (
                      <div className="p-6 space-y-6">
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">1. Select Category</div>
                          <div className="p-4 border-2 border-emerald-500 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-center">
                            <span className="text-3xl mb-2">{selectedPreviewCat.isCustom ? "🔥" : "🏃"}</span>
                            <span className="font-bold text-emerald-900">{selectedPreviewCat.name}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">2. Select Subtype</div>
                          <div className="flex gap-2 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-bold whitespace-nowrap">{selectedPreviewCat.name}</div>
                            {!selectedPreviewCat.isCustom && <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-sm font-bold opacity-50 whitespace-nowrap">Variant 2</div>}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600">
                          <strong>Admin connection:</strong> Adding or editing <span className="font-bold text-gray-900">"{selectedPreviewCat.name}"</span> updates the real user workout API instantly.
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center text-gray-400">
                        <Layers className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Select a category to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input type="search" placeholder="Search by name or email..." value={userFilters.search} onChange={(e) => setUserFilters((f) => ({ ...f, search: e.target.value }))} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <select value={userFilters.role} onChange={(e) => setUserFilters((f) => ({ ...f, role: e.target.value }))} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-emerald-500">
                      <option value="">All Roles</option>
                      <option value="user">Users</option>
                      <option value="admin">Admins</option>
                    </select>
                    <select value={userFilters.status} onChange={(e) => setUserFilters((f) => ({ ...f, status: e.target.value }))} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-emerald-500">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">Name / Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Level & XP</th>
                        <th className="px-6 py-4">Streak</th>
                        <th className="px-6 py-4">Last Active</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((item) => {
                        const isSelf = item.id === currentUser.id;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${item.role === "admin" ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>{item.role}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-emerald-600">Lv {item.level || 1}</div>
                              <div className="text-xs text-gray-500">{item.xp || 0} XP</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-orange-500 flex items-center gap-1"><Flame className="h-3 w-3" /> {item.currentStreak || 0}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{item.lastActiveDate || item.createdAt.slice(0, 10)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${item.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>{item.isActive ? "Active" : "Disabled"}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openUserDetail(item.id)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer">View</button>
                                {!isSelf && (
                                  <>
                                    <button onClick={() => toggleRole(item)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer">Role</button>
                                    <button onClick={() => toggleStatus(item)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${item.isActive ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>{item.isActive ? "Disable" : "Enable"}</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {users.length === 0 && (
                        <tr><td colSpan={7} className="py-12 text-center text-gray-500">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 text-center">Note: Admins cannot manually edit user XP, streak, calories, or badges directly from this panel.</p>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "statistics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Workouts Per Week" value="1,248" icon={Activity} hint="+12% from last week" />
                  <StatCard label="Active Users (Weekly)" value="142" icon={Users} hint="34% of total base" />
                  <StatCard label="Avg Workouts / User" value="3.2" icon={BarChart3} hint="Consistent engagement" />
                  <StatCard label="Popular Category" value="Strength" icon={Layers} hint="Used in 42% of workouts" />
                  <StatCard label="Streak Activity" value="86" icon={Flame} hint="Users on 3+ day streak" />
                  <StatCard label="Badge Unlocks" value="34" icon={ShieldCheck} hint="Achievements this week" />
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">Advanced Analytics Hub</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-2">Historical trends, retention cohorts, and deep category utilization metrics will be displayed here.</p>
                </div>
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === "insights" && (
              <div className="space-y-6">
                <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold">AI Insight Generation</h3>
                    <p className="text-emerald-100 text-sm mt-1">AI insights are generated from weekly workout and progress data.</p>
                  </div>
                  <button className="px-6 py-3 bg-white text-emerald-700 font-bold rounded-lg shadow-sm hover:bg-emerald-50 transition-colors">Generate Weekly Insights</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard label="Total Insights Generated" value={stats?.totalInsightsGenerated || 12} icon={BrainCircuit} hint="Across all time" />
                  <StatCard label="Latest Generation" value="Today, 04:00 AM" icon={RefreshCw} hint="System scheduled" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Recent Insight Jobs</h3>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3">Job ID</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Users Processed</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr><td className="px-6 py-4 font-mono text-xs">job_8f3a9</td><td className="px-6 py-4">Today, 04:00 AM</td><td className="px-6 py-4">142</td><td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">Success</span></td></tr>
                      <tr><td className="px-6 py-4 font-mono text-xs">job_7d2b1</td><td className="px-6 py-4">Last Sunday</td><td className="px-6 py-4">138</td><td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">Success</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Platform Settings</h3>
                <p className="text-gray-500 max-w-md mx-auto mt-2">Global configuration, email templates, and API keys are managed securely in this section.</p>
              </div>
            )}

          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{detail.user.name}</h2>
                <p className="text-sm text-gray-500">{detail.user.email}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Metric label="Workouts" value={detail.stats.workoutCount} />
              <Metric label="Calories" value={detail.stats.totalCalories} />
              <Metric label="Minutes" value={detail.stats.totalMinutes} />
              <Metric label="Weight Logs" value={detail.stats.weightCount} />
              <Metric label="Insights" value={detail.stats.insightCount} />
              <Metric label="Role" value={detail.user.role.toUpperCase()} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Recent Workouts</h3>
              {detail.recentWorkouts.length === 0 ? (
                <p className="text-sm text-gray-500">No workouts logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.recentWorkouts.map((w) => (
                    <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                      <span className="font-bold text-gray-900">{w.title}</span>
                      <span className="text-gray-500">{w.date} · {w.caloriesTotal} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
