import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
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
  "px-3 py-2 bg-surface border border-border rounded-sm text-xs text-text focus:bg-bg focus:border-primary focus:outline-none transition-all";

function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="bg-surface p-5 border border-border rounded-sm hover:border-primary/30 hover:bg-bg/50 transition-all duration-200">
      <span className="text-muted/70 font-mono text-[9px] uppercase tracking-widest block">
        {label}
      </span>
      <strong className="text-2xl font-black text-text mt-1 block font-mono">
        {value ?? "--"}
      </strong>
      {hint && (
        <span className="text-[10px] text-muted mt-1.5 flex items-center gap-1">
          <Icon className="h-3 w-3 text-primary" aria-hidden="true" /> {hint}
        </span>
      )}
    </div>
  );
}

export default function AdminPortalView() {
  const { user: currentUser } = useAuth();
  const { push } = useToast();
  const { section } = useParams();
  const navigate = useNavigate();

  // Map the URL section to the panel to show. Dashboard and statistics both
  // surface the platform stats/analytics panel.
  const SECTION_TO_TAB = {
    dashboard: "stats",
    statistics: "stats",
    users: "users",
    categories: "categories"
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
    { key: "stats", label: "Platform Stats", icon: BarChart3, path: "/admin/dashboard" },
    { key: "categories", label: "Categories", icon: Layers, path: "/admin/categories" },
    { key: "users", label: "Users", icon: Users, path: "/admin/users" }
  ];

  // Unknown section in the URL (e.g. /admin/foo) -> send to the default panel.
  if (!activeTab) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="space-y-6 text-left text-text">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-6 rounded-sm border border-border ">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-base text-text font-bold tracking-tight">
              Platform Health Admin
            </h1>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Monitor system activity, manage user accounts, and maintain workout categories so FitSync stays simple and useful for students.
          </p>
          <p className="text-xs text-muted/70 mt-1">
            Admin role: platform quality, account control, and category maintenance — not personal coaching.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCoreData}
          disabled={loading}
          className="px-3.5 py-1.5 bg-bg hover:bg-border/40 text-xs font-mono rounded-sm border border-border cursor-pointer flex items-center gap-1.5 transition-all text-text"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <ErrorBanner message={error} onRetry={loadCoreData} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-5 border border-border rounded-sm flex flex-col justify-between hover:border-primary/30 hover:bg-bg/50 transition-all duration-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-text">Monitor platform activity</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Review users, workouts, weight logs, insights, streaks, and check-ins to understand system engagement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="mt-4 w-full py-2 bg-bg hover:bg-border/40 text-xs font-mono rounded-sm border border-border cursor-pointer transition-all text-text text-center font-semibold uppercase tracking-wider text-[11px]"
          >
            View Platform Stats
          </button>
        </div>

        <div className="bg-surface p-5 border border-border rounded-sm flex flex-col justify-between hover:border-primary/30 hover:bg-bg/50 transition-all duration-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-text">Manage user accounts</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Search users, view account activity, update roles, and activate or deactivate accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="mt-4 w-full py-2 bg-bg hover:bg-border/40 text-xs font-mono rounded-sm border border-border cursor-pointer transition-all text-text text-center font-semibold uppercase tracking-wider text-[11px]"
          >
            View Users
          </button>
        </div>

        <div className="bg-surface p-5 border border-border rounded-sm flex flex-col justify-between hover:border-primary/30 hover:bg-bg/50 transition-all duration-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-text">Maintain workout categories</h3>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Add, edit, or remove custom categories so students can log workouts clearly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="mt-4 w-full py-2 bg-bg hover:bg-border/40 text-xs font-mono rounded-sm border border-border cursor-pointer transition-all text-text text-center font-semibold uppercase tracking-wider text-[11px]"
          >
            View Categories
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-b border-border pb-1 text-xs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`py-2 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-text"
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
              <div>
                <h2 className="text-base text-text font-bold">Platform activity overview</h2>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  These metrics help the admin understand whether students are actively using FitSync.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  label="Platform users"
                  value={stats?.totalUsers}
                  icon={Users}
                  hint="Student accounts tracked by FitSync"
                />
                <StatCard
                  label="Workouts logged"
                  value={stats?.totalWorkouts}
                  icon={FileCheck}
                  hint="Workout sessions saved by users"
                />
                <StatCard
                  label="Weight entries"
                  value={stats?.totalWeightEntries}
                  icon={Scale}
                  hint="Body weight progress logs"
                />
                <StatCard
                  label="Weekly insights"
                  value={stats?.totalInsightsGenerated}
                  icon={ShieldCheck}
                  hint="AI progress summaries generated"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Active (7 days)"
                  value={stats?.gamification?.activeUsersLast7Days}
                  icon={Flame}
                  hint="Users with activity in the last 7 days"
                />
                <StatCard
                  label="Avg current streak"
                  value={stats?.gamification?.averageCurrentStreak}
                  icon={Flame}
                  hint="Average current streak across users"
                />
                <StatCard
                  label="Total check-ins"
                  value={stats?.gamification?.totalCheckins}
                  icon={UserCheck}
                  hint="Total user check-in activity"
                />
              </div>

              <div className="bg-surface p-5 border border-border rounded-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-text">What admin should look for</h3>
                </div>
                <ul className="list-disc pl-5 text-xs text-muted space-y-1.5 leading-relaxed">
                  <li>Low workout activity may mean users are not reaching the Log page easily.</li>
                  <li>Low check-ins may mean the daily action is not visible enough.</li>
                  <li>Low category usage may mean a workout type is unclear or hidden.</li>
                </ul>
              </div>

              <div className="bg-surface rounded-sm border border-border overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h2 className="text-sm font-bold text-text">Category usage and logging quality</h2>
                  <p className="text-xs text-muted leading-relaxed mt-1">
                    Category usage helps the admin understand which workout options students actually use. Low usage may signal unclear naming, poor placement, or low relevance.
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    Admin job: keep categories simple, clear, and useful for quick logging.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg border-b border-border font-mono text-[9px] uppercase tracking-widest font-semibold text-muted">
                      <tr>
                        <th className="py-2.5 px-5">Category</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Workouts using this category</th>
                        <th className="py-2.5 px-4">Total workout minutes</th>
                        <th className="py-2.5 px-5">Total calories recorded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-text">
                      {analytics.map((row) => (
                        <tr key={row.id} className="hover:bg-bg transition-all">
                          <td className="py-3 px-5 font-semibold text-text">{row.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${row.isCustom ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-bg text-muted border border-border"}`}
                            >
                              {row.isCustom ? "Custom" : "Core"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-text">{row.usageCount}</td>
                          <td className="py-3 px-4 font-mono text-muted">{row.totalMinutes}m</td>
                          <td className="py-3 px-5 font-mono text-primary font-semibold">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-surface rounded-sm border border-border overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="text-base text-text font-bold">
                      Workout category management
                    </h2>
                    <p className="text-xs text-muted leading-relaxed mt-1">
                      Maintain the workout options students choose from when logging activity.
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
                      className="px-3 py-1.5 bg-primary text-white text-xs font-medium uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="p-5 flex items-start justify-between gap-4 hover:bg-bg transition-all text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text">{category.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${category.isCustom ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-bg text-muted border border-border"}`}
                          >
                            {category.isCustom ? "Custom" : "Core"}
                          </span>
                        </div>
                        <p className="text-muted leading-relaxed">{category.description}</p>
                      </div>
                      {category.isCustom && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCategory(category)}
                            aria-label={`Edit ${category.name}`}
                            className="text-muted hover:text-primary p-1.5 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteCat(category.id)}
                            aria-label={`Delete ${category.name}`}
                            className="text-muted hover:text-red-500 p-1.5 transition-all cursor-pointer"
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
                    className="bg-surface p-5 rounded-sm border border-border space-y-4"
                  >
                    <div className="border-b border-border pb-2.5 flex justify-between items-center">
                      <h3 className="text-xs font-mono font-semibold text-text uppercase tracking-widest">
                        {editingCatId ? "Edit category" : "Add category"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddingCat(false)}
                        className="text-xs text-muted hover:text-text underline decoration-muted/20 underline-offset-4 cursor-pointer "
                      >
                        Cancel
                      </button>
                    </div>
                    <ErrorBanner message={catError} />
                    <div>
                      <label
                        htmlFor="cat-name"
                        className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5"
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
                        <span className="text-[10px] text-muted mt-1 block">
                          Category names are locked once created.
                        </span>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="cat-desc"
                        className="block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1.5"
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
                      className="w-full py-2 bg-primary text-white font-medium uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer"
                    >
                      {editingCatId ? "Save changes" : "Create category"}
                    </button>
                  </form>
                ) : (
                  <div className="p-5 bg-bg rounded-sm border border-dashed border-border text-center space-y-3 hover:border-primary/20 transition-all duration-200">
                    <Layers className="h-8 w-8 text-muted/40 mx-auto" aria-hidden="true" />
                    <p className="text-xs text-muted leading-relaxed">
                      Add a custom exercise category to make workout logging clearer for students.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(true)}
                      className="mx-auto py-1 px-3 bg-primary text-white transition-all font-medium uppercase tracking-widest rounded-sm text-xs cursor-pointer block"
                    >
                      New category
                    </button>
                  </div>
                )}

                <div className="bg-surface p-5 border border-border rounded-sm mt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h4 className="text-xs font-mono uppercase tracking-widest font-semibold text-text">Admin responsibility</h4>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Core categories stay protected to keep the system stable. Custom categories can be adjusted when students need clearer workout options.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base text-text font-bold">User account management</h2>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  Search, filter, and review user accounts. Admin actions here control access and roles, not personal fitness plans.
                </p>
              </div>
              <div className="bg-surface border border-border rounded-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-2.5 h-4 w-4 text-muted/40"
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

              <div className="bg-surface rounded-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg border-b border-border font-mono text-[9px] uppercase tracking-widest font-semibold text-muted">
                      <tr>
                        <th className="py-2.5 px-5">User</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Account activity</th>
                        <th className="py-2.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-text">
                      {users.map((item) => {
                        const isSelf = item.id === currentUser.id;
                        return (
                          <tr key={item.id} className="hover:bg-bg transition-all">
                            <td className="py-3.5 px-5">
                              <div className="font-semibold text-text">{item.name}</div>
                              <div className="font-mono text-muted text-[11px]">
                                {item.email}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${item.role === "admin" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-bg text-muted border border-border"}`}
                              >
                                {item.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${item.isActive ? "bg-primary/10 text-primary border border-primary/30" : "bg-rose-50 text-rose-700 border border-rose-100"}`}
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-muted text-[11px]">
                              {item.workoutCount}w · {item.weightCount}wt
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openUserDetail(item.id)}
                                  aria-label={`View ${item.name}`}
                                  title="View account activity"
                                  className="text-muted hover:text-text p-1.5 transition-all cursor-pointer"
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
                                      className="text-muted hover:text-blue-600 p-1.5 transition-all cursor-pointer"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleStatus(item)}
                                      aria-label="Toggle status"
                                      title={item.isActive ? "Deactivate" : "Activate"}
                                      className={`p-1.5 transition-all cursor-pointer ${item.isActive ? "text-muted hover:text-rose-600" : "text-muted hover:text-primary"}`}
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
                          <td colSpan={5} className="py-10 text-center text-muted text-xs">
                            No users match these filters. Try clearing search, role, or status.
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
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-surface w-full max-w-lg rounded-sm border border-border p-6 space-y-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base text-text font-bold">
                  {detail.user.name}
                </h2>
                <p className="text-xs text-muted font-mono">{detail.user.email}</p>
                <p className="text-xs text-muted/70 mt-1">
                  Account activity summary for admin review. This is not health advice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Close"
                className="h-7 w-7 rounded-sm bg-bg border border-border flex items-center justify-center text-muted hover:text-text"
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
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
                Recent workouts
              </h3>
              {detail.recentWorkouts.length === 0 ? (
                <p className="text-xs text-muted">No workouts logged yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.recentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between text-xs bg-bg border border-border rounded-sm px-3 py-2"
                    >
                      <span className="text-text font-semibold">{workout.title}</span>
                      <span className="font-mono text-muted">
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
    <div className="bg-bg border border-border rounded-sm p-3">
      <div className="text-sm font-black text-text capitalize">{value}</div>
      <div className="text-[8px] font-mono uppercase tracking-wider text-muted mt-0.5">
        {label}
      </div>
    </div>
  );
}
