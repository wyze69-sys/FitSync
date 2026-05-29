import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Trash2,
  Plus,
  Users,
  Layers,
  BarChart3,
  FileCheck,
  Scale,
  Edit2,
  RefreshCw,
  Info,
  Flame,
  Search,
  Eye,
  UserCheck,
  UserX,
  X
} from "lucide-react";
import adminService from "../services/adminService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Spinner from "./common/Spinner.jsx";
import ErrorBanner from "./common/ErrorBanner.jsx";
import ConfirmDialog from "./modals/ConfirmDialog.jsx";

const INPUT =
  "px-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all";

function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="bg-[#0E0E0E] p-5 border border-white/10 rounded-sm shadow-sm">
      <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest block">
        {label}
      </span>
      <strong className="text-2xl font-black text-white mt-1 block font-mono">
        {value ?? "--"}
      </strong>
      {hint && (
        <span className="text-[10px] text-white/40 mt-1.5 flex items-center gap-1">
          <Icon className="h-3 w-3 text-emerald-400" aria-hidden="true" /> {hint}
        </span>
      )}
    </div>
  );
}

export default function AdminPortalView() {
  const { user: currentUser } = useAuth();
  const { push } = useToast();

  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [userFilters, setUserFilters] = useState({ search: "", role: "", status: "" });
  const [detail, setDetail] = useState(null);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catError, setCatError] = useState(null);
  const [pendingDeleteCat, setPendingDeleteCat] = useState(null);

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
    } catch (err) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

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
        push("Category updated.", "success");
      } else {
        await adminService.createCategory({ name: catName.trim(), description: catDesc.trim() });
        push("Category created.", "success");
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

  async function confirmDeleteCategory() {
    const id = pendingDeleteCat;
    setPendingDeleteCat(null);
    try {
      await adminService.deleteCategory(id);
      push("Category removed.", "info");
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
    { key: "stats", label: "Platform Stats", icon: BarChart3 },
    { key: "categories", label: "Categories", icon: Layers },
    { key: "users", label: "Users", icon: Users }
  ];

  return (
    <div className="space-y-6 text-left text-[#E0E0E0]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0E0E0E] p-6 rounded-sm border border-white/10 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <h1 className="text-base font-serif italic text-white font-bold">
              Administration Portal
            </h1>
          </div>
          <p className="text-xs text-white/40">
            Manage categories, review platform activity, and administer user accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCoreData}
          disabled={loading}
          className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-mono rounded-sm border border-white/10 cursor-pointer flex items-center gap-1.5 transition-all text-white/80"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onRetry={loadCoreData} />

      <div className="flex items-center gap-2.5 border-b border-white/10 pb-1 text-xs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 font-serif italic font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.key
                ? "border-white text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" /> {tab.label}
          </button>
        ))}
      </div>

      {loading && !stats ? (
        <Spinner label="Loading admin data..." className="py-16" />
      ) : (
        <>
          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  label="Platform users"
                  value={stats?.totalUsers}
                  icon={Users}
                  hint="Excluding admins"
                />
                <StatCard
                  label="Workouts logged"
                  value={stats?.totalWorkouts}
                  icon={FileCheck}
                  hint="All sessions"
                />
                <StatCard
                  label="Weight entries"
                  value={stats?.totalWeightEntries}
                  icon={Scale}
                  hint="Body weight logs"
                />
                <StatCard
                  label="Weekly insights"
                  value={stats?.totalInsightsGenerated}
                  icon={ShieldCheck}
                  hint="Gemini reports"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Active (7 days)"
                  value={stats?.gamification?.activeUsersLast7Days}
                  icon={Flame}
                  hint="Users with recent activity"
                />
                <StatCard
                  label="Avg current streak"
                  value={stats?.gamification?.averageCurrentStreak}
                  icon={Flame}
                  hint="Across all users"
                />
                <StatCard
                  label="Total check-ins"
                  value={stats?.gamification?.totalCheckins}
                  icon={UserCheck}
                  hint="Wellness check-ins"
                />
              </div>

              <div className="bg-[#0E0E0E] rounded-sm border border-white/10 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-white/10">
                  <h2 className="text-sm font-bold text-white">Category usage analytics</h2>
                  <p className="text-xs text-white/40">
                    How often each exercise category is logged across all users.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.02] border-b border-white/10 font-mono text-[9px] uppercase tracking-widest font-semibold text-white/40">
                      <tr>
                        <th className="py-2.5 px-5">Category</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Times logged</th>
                        <th className="py-2.5 px-4">Minutes</th>
                        <th className="py-2.5 px-5">Calories</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {analytics.map((row) => (
                        <tr key={row.id} className="hover:bg-white/[0.005] transition-all">
                          <td className="py-3 px-5 font-semibold text-white">{row.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${row.isCustom ? "bg-indigo-950/20 text-indigo-400 border border-indigo-900/30" : "bg-white/5 text-white/50 border border-white/5"}`}
                            >
                              {row.isCustom ? "Custom" : "Core"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-white">{row.usageCount}</td>
                          <td className="py-3 px-4 font-mono text-white/60">{row.totalMinutes}m</td>
                          <td className="py-3 px-5 font-mono text-emerald-400">
                            {row.totalCalories}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#0E0E0E] rounded-sm border border-white/10 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-serif italic text-white font-bold">
                      Exercise categories
                    </h2>
                    <p className="text-xs text-white/40">
                      Core categories are protected; custom ones can be edited or removed.
                    </p>
                  </div>
                  {!isAddingCat && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCat(true);
                        setEditingCatId(null);
                        setCatName("");
                        setCatDesc("");
                        setCatError(null);
                      }}
                      className="px-3 py-1.5 bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  )}
                </div>
                <div className="divide-y divide-white/5">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="p-5 flex items-start justify-between gap-4 hover:bg-white/[0.005] transition-all text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{category.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${category.isCustom ? "bg-indigo-950/20 text-indigo-400 border border-indigo-900/30" : "bg-white/5 text-white/50 border border-white/5"}`}
                          >
                            {category.isCustom ? "Custom" : "Core"}
                          </span>
                        </div>
                        <p className="text-white/40 leading-relaxed">{category.description}</p>
                      </div>
                      {category.isCustom && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCategory(category)}
                            aria-label={`Edit ${category.name}`}
                            className="text-white/40 hover:text-emerald-400 p-1.5 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteCat(category.id)}
                            aria-label={`Delete ${category.name}`}
                            className="text-white/40 hover:text-red-400 p-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {isAddingCat ? (
                  <form
                    onSubmit={handleSaveCategory}
                    className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 shadow-md space-y-4"
                  >
                    <div className="border-b border-white/10 pb-2.5 flex justify-between items-center">
                      <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-widest">
                        {editingCatId ? "Edit category" : "Add category"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddingCat(false)}
                        className="text-xs text-white/45 hover:text-white underline decoration-white/20 underline-offset-4 cursor-pointer font-serif italic"
                      >
                        Cancel
                      </button>
                    </div>
                    <ErrorBanner message={catError} />
                    <div>
                      <label
                        htmlFor="cat-name"
                        className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
                      >
                        Name
                      </label>
                      <input
                        id="cat-name"
                        type="text"
                        required
                        disabled={Boolean(editingCatId)}
                        placeholder="e.g. Swimming"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className={`${INPUT} w-full disabled:opacity-60`}
                      />
                      {editingCatId && (
                        <span className="text-[10px] text-white/30 mt-1 block">
                          Category names are locked once created.
                        </span>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="cat-desc"
                        className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
                      >
                        Description
                      </label>
                      <textarea
                        id="cat-desc"
                        required
                        rows={3}
                        placeholder="What this category covers."
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                        className={`${INPUT} w-full`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer hover:bg-white/95"
                    >
                      {editingCatId ? "Save changes" : "Create category"}
                    </button>
                  </form>
                ) : (
                  <div className="p-5 bg-white/[0.015] rounded-sm border border-dashed border-white/10 text-center space-y-3">
                    <Layers className="h-8 w-8 text-white/25 mx-auto" aria-hidden="true" />
                    <p className="text-xs text-white/40 leading-relaxed">
                      Add a custom exercise category for users to log against.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(true)}
                      className="mx-auto py-1 px-3 bg-white text-black hover:bg-white/90 transition-all font-bold uppercase tracking-widest rounded-sm text-xs cursor-pointer block"
                    >
                      New category
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="bg-[#0E0E0E] border border-white/10 rounded-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-2.5 h-4 w-4 text-white/30"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    aria-label="Search users"
                    placeholder="Search name or email"
                    value={userFilters.search}
                    onChange={(e) => setUserFilters((f) => ({ ...f, search: e.target.value }))}
                    className={`${INPUT} w-full pl-9`}
                  />
                </div>
                <select
                  aria-label="Filter by role"
                  value={userFilters.role}
                  onChange={(e) => setUserFilters((f) => ({ ...f, role: e.target.value }))}
                  className={`${INPUT} cursor-pointer`}
                >
                  <option value="">All roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  aria-label="Filter by status"
                  value={userFilters.status}
                  onChange={(e) => setUserFilters((f) => ({ ...f, status: e.target.value }))}
                  className={`${INPUT} cursor-pointer`}
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="bg-[#0E0E0E] rounded-sm border border-white/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.02] border-b border-white/10 font-mono text-[9px] uppercase tracking-widest font-semibold text-white/40">
                      <tr>
                        <th className="py-2.5 px-5">User</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Activity</th>
                        <th className="py-2.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {users.map((item) => {
                        const isSelf = item.id === currentUser.id;
                        return (
                          <tr key={item.id} className="hover:bg-white/[0.005] transition-all">
                            <td className="py-3.5 px-5">
                              <div className="font-semibold text-white">{item.name}</div>
                              <div className="font-mono text-white/40 text-[11px]">
                                {item.email}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${item.role === "admin" ? "bg-blue-950/30 text-blue-300 border border-blue-900/40" : "bg-white/5 text-white/60 border border-white/10"}`}
                              >
                                {item.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${item.isActive ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30" : "bg-rose-950/20 text-rose-400 border border-rose-900/30"}`}
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-white/50 text-[11px]">
                              {item.workoutCount}w · {item.weightCount}wt
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openUserDetail(item.id)}
                                  aria-label={`View ${item.name}`}
                                  title="View detail"
                                  className="text-white/40 hover:text-white p-1.5 transition-all cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {!isSelf && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => toggleRole(item)}
                                      aria-label="Toggle role"
                                      title={item.role === "admin" ? "Make user" : "Make admin"}
                                      className="text-white/40 hover:text-blue-300 p-1.5 transition-all cursor-pointer"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleStatus(item)}
                                      aria-label="Toggle status"
                                      title={item.isActive ? "Deactivate" : "Activate"}
                                      className={`p-1.5 transition-all cursor-pointer ${item.isActive ? "text-white/40 hover:text-rose-400" : "text-white/40 hover:text-emerald-400"}`}
                                    >
                                      {item.isActive ? (
                                        <UserX className="h-3.5 w-3.5" />
                                      ) : (
                                        <UserCheck className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-white/30 text-xs">
                            No users match these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {detail && (
        <div
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-[#0E0E0E] w-full max-w-lg rounded-sm border border-white/10 p-6 space-y-5 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-serif italic text-white font-bold">
                  {detail.user.name}
                </h2>
                <p className="text-xs text-white/40 font-mono">{detail.user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Close"
                className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Workouts" value={detail.stats.workoutCount} />
              <Metric label="Calories" value={detail.stats.totalCalories} />
              <Metric label="Minutes" value={detail.stats.totalMinutes} />
              <Metric label="Weight logs" value={detail.stats.weightCount} />
              <Metric label="Insights" value={detail.stats.insightCount} />
              <Metric label="Role" value={detail.user.role} />
            </div>
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                Recent workouts
              </h3>
              {detail.recentWorkouts.length === 0 ? (
                <p className="text-xs text-white/30">No workouts logged.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.recentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between text-xs bg-white/[0.02] border border-white/5 rounded-sm px-3 py-2"
                    >
                      <span className="text-white/80">{workout.title}</span>
                      <span className="font-mono text-white/40">
                        {workout.date} · {workout.caloriesTotal} kcal
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteCat)}
        title="Delete this category?"
        message="Existing workouts keep their logged data, but this category can no longer be selected."
        confirmLabel="Delete"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setPendingDeleteCat(null)}
      />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-sm p-3">
      <div className="text-sm font-black text-white capitalize">{value}</div>
      <div className="text-[8px] font-mono uppercase tracking-wider text-white/40 mt-0.5">
        {label}
      </div>
    </div>
  );
}
