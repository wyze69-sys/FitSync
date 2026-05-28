/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Trash2, Plus, Users, Layers, BarChart3, AlertCircle, FileCheck, Scale, Edit2, RefreshCw, Info } from 'lucide-react';
export default function AdminPortalView({ token, onUnauthorized, onCategoryChanged }) {
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('stats');
    // Category management sub-states
    const [catName, setCatName] = useState('');
    const [catDesc, setCatDesc] = useState('');
    const [editingCatId, setEditingCatId] = useState(null);
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [catError, setCatError] = useState(null);
    const [adminError, setAdminError] = useState(null);
    const [loading, setLoading] = useState(false);
    async function requestJson(url, options = {}) {
        const resp = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        });
        let data = null;
        try {
            data = await resp.json();
        }
        catch (err) {
            data = null;
        }
        if (!resp.ok) {
            if (resp.status === 401 || resp.status === 403) {
                onUnauthorized();
            }
            throw new Error(data?.error || `Request failed with status ${resp.status}.`);
        }
        return data;
    }
    // Load Administrative Data
    async function loadAdminData() {
        if (!token) {
            setAdminError('Admin session is missing. Please log in again.');
            return;
        }
        setLoading(true);
        setAdminError(null);
        try {
            const [statsData, catData, usersData] = await Promise.all([
                requestJson('/api/admin/stats'),
                requestJson('/api/categories'),
                requestJson('/api/admin/users')
            ]);
            setStats(statsData);
            setCategories(catData);
            setUsers(usersData);
        }
        catch (err) {
            console.error('Failed fetching administrative metadata:', err);
            setAdminError(err.message || 'Failed fetching administrative metadata.');
        }
        finally {
            setLoading(false);
        }
    }
    // Load once on mounting
    useEffect(() => {
        loadAdminData();
    }, [token]);
    async function handleSaveCategory(e) {
        e.preventDefault();
        setCatError(null);
        if (!catName.trim() || !catDesc.trim()) {
            setCatError('Both category name and description fields are mandatory.');
            return;
        }
        try {
            const url = editingCatId ? `/api/admin/categories/${editingCatId}` : '/api/admin/categories';
            const method = editingCatId ? 'PUT' : 'POST';
            await requestJson(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: catName.trim(),
                    description: catDesc.trim()
                })
            });
            setCatName('');
            setCatDesc('');
            setEditingCatId(null);
            setIsAddingCat(false);
            // reload lists
            loadAdminData();
            onCategoryChanged();
        }
        catch (err) {
            setCatError(err.message || 'Error occurred during category creation.');
        }
    }
    async function handleDeleteCategory(id) {
        if (!confirm('Are you absolutely sure you want to remove this category from FitSync metadata? No training workouts already logged under it will be deleted, but it prevents future logging.')) {
            return;
        }
        try {
            await requestJson(`/api/admin/categories/${id}`, {
                method: 'DELETE'
            });
            loadAdminData();
            onCategoryChanged();
        }
        catch (err) {
            alert(err.message || 'Error executing delete command.');
        }
    }
    function handleStartEditCategory(cat) {
        setEditingCatId(cat.id);
        setCatName(cat.name);
        setCatDesc(cat.description);
        setIsAddingCat(true);
        setCatError(null);
    }
    return (<div id="admin-view-root" className="space-y-6 text-left font-sans text-[#E0E0E0]">
      
      {/* Branding Administration Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0E0E0E] p-6 rounded-sm border border-white/10 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400"/>
            <h2 className="text-base font-serif italic text-white font-bold">FitSync Administration Portal</h2>
          </div>
          <p className="text-xs text-white/40">Manage global categories, overview system activity telemetry, and review athlete accounts.</p>
        </div>
        <button type="button" onClick={loadAdminData} disabled={loading} className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-mono rounded-sm border border-white/10 cursor-pointer flex items-center gap-1.5 transition-all text-white/80">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>
          Refresh Registry Data
        </button>
      </div>

      {/* Tabs list navigation */}
      {adminError && (<div className="p-3.5 bg-red-950/45 border border-red-900/40 text-red-100 text-xs rounded-sm font-medium flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5"/>
        <span>{adminError}</span>
      </div>)}

      {/* Tabs list navigation */}
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-1 text-xs text-white/40">
        <button onClick={() => setActiveTab('stats')} className={`py-2 px-4 font-serif italic font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'stats' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          <BarChart3 className="h-4 w-4"/>
          General Platform Stats
        </button>
        <button onClick={() => setActiveTab('categories')} className={`py-2 px-4 font-serif italic font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'categories' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          <Layers className="h-4 w-4"/>
          Exercise Categories
        </button>
        <button onClick={() => setActiveTab('users')} className={`py-2 px-4 font-serif italic font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'users' ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>
          <Users className="h-4 w-4"/>
          User Account Registry
        </button>
      </div>

      {/* Tab Panel 1: Stats */}
      {activeTab === 'stats' && (<div id="stats-tab-panel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#0E0E0E] p-5 border border-white/10 rounded-sm shadow-sm relative">
              <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest block">Platform Athletes</span>
              <strong className="text-2xl font-black text-white mt-1 block font-mono">{stats?.totalUsers ?? '--'}</strong>
              <span className="text-[10px] text-white/40 font-sans mt-1.5 block flex items-center gap-1">
                <Users className="h-3 w-3 text-emerald-400"/>
                Normal registrations excluding Admin
              </span>
            </div>
            
            <div className="bg-[#0E0E0E] p-5 border border-white/10 rounded-sm shadow-sm relative">
              <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest block">Workout Logs tracked</span>
              <strong className="text-2xl font-black text-white mt-1 block font-mono">{stats?.totalWorkouts ?? '--'}</strong>
              <span className="text-[10px] text-white/40 font-sans mt-1.5 block flex items-center gap-1">
                <FileCheck className="h-3 w-3 text-emerald-400"/>
                Accumulated workout routines
              </span>
            </div>

            <div className="bg-[#0E0E0E] p-5 border border-white/10 rounded-sm shadow-sm relative">
              <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest block">Weight Entries</span>
              <strong className="text-2xl font-black text-white mt-1 block font-mono">{stats?.totalWeightEntries ?? '--'}</strong>
              <span className="text-[10px] text-white/40 font-sans mt-1.5 block flex items-center gap-1">
                <Scale className="h-3 w-3 text-emerald-400"/>
                Body weight logged indices
              </span>
            </div>

            <div className="bg-[#0E0E0E] p-5 border border-white/10 rounded-sm shadow-sm relative">
              <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest block">AI Insights Synthesized</span>
              <strong className="text-2xl font-black text-white mt-1 block font-mono">{stats?.totalInsightsGenerated ?? '--'}</strong>
              <span className="text-[10px] text-white/40 font-sans mt-1.5 block flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400"/>
                Gemini analysis requests answered
              </span>
            </div>
          </div>

          {/* Quick instructions panel details */}
          <div className="bg-[#0E0E0E] border border-white/10 p-6 rounded-sm shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 bg-white/5 rounded-sm border border-white/5 text-white/50 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-emerald-400"/>
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-serif italic font-bold text-white">Term 3 Evaluation Overview</h4>
              <p className="text-white/50 font-sans leading-relaxed">
                FitSync AI operates on structured relational tables (relational mapping) maintaining complete transactional links. Weight entries, profiles, workout routines, exercise divisions, sets and reps represent fully realized database tuples, satisfying Database Administration and Software Engineering constraints.
              </p>
            </div>
          </div>
        </div>)}

      {/* Tab Panel 2: Category Management */}
      {activeTab === 'categories' && (<div id="categories-tab-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List of categories */}
          <div className="lg:col-span-2 bg-[#0E0E0E] rounded-sm border border-white/10 shadow-sm overflow-hidden text-[#E0E0E0]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif italic text-white font-bold">Exercise category metrics</h3>
                <p className="text-xs text-white/40">Platform-wide workout categories. Core default units are protected.</p>
              </div>
              {!isAddingCat && (<button onClick={() => {
                    setIsAddingCat(true);
                    setEditingCatId(null);
                    setCatName('');
                    setCatDesc('');
                    setCatError(null);
                }} className="px-3 py-1.5 bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center gap-1 cursor-pointer transition-all">
                  <Plus className="h-3 w-3"/>
                  Add Custom Category
                </button>)}
            </div>

            <div className="divide-y divide-white/5">
              {categories.map((cat) => (<div key={cat.id} className="p-5 flex items-start justify-between gap-4 hover:bg-white/[0.005] transition-all font-sans text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{cat.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold ${cat.isCustom ? 'bg-indigo-950/20 text-indigo-400 border border-indigo-900/30' : 'bg-white/5 text-white/50 border border-white/5'}`}>
                        {cat.isCustom ? 'Custom Category' : 'Core Default'}
                      </span>
                    </div>
                    <p className="text-white/40 font-sans leading-relaxed">{cat.description}</p>
                  </div>

                  {cat.isCustom && (<div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleStartEditCategory(cat)} className="text-white/40 hover:text-emerald-400 p-1.5 transition-all cursor-pointer" title="Edit Description">
                        <Edit2 className="h-3.5 w-3.5"/>
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-white/40 hover:text-red-400 p-1.5 transition-all cursor-pointer" title="Delete custom category">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    </div>)}
                </div>))}
            </div>
          </div>

          {/* Form to manage custom category */}
          <div>
            {isAddingCat ? (<form onSubmit={handleSaveCategory} className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 shadow-md space-y-4">
                <div className="border-b border-white/10 pb-2.5 flex justify-between items-center">
                  <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-widest">
                    {editingCatId ? 'Edit Category Description' : 'Add Custom Exercise Category'}
                  </h4>
                  <button type="button" onClick={() => setIsAddingCat(false)} className="text-xs text-white/45 hover:text-white underline decoration-white/20 underline-offset-4 cursor-pointer transition-all font-serif italic">
                    Cancel
                  </button>
                </div>

                {catError && (<div className="p-2.5 bg-red-950/45 border border-red-900/40 text-red-105 text-xs rounded-lg font-semibold flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-400"/>
                    <span>{catError}</span>
                  </div>)}

                <div>
                  <label htmlFor="cat-name" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                    Category Name
                  </label>
                  <input id="cat-name" type="text" required disabled={!!editingCatId} // cannot change name after creation
             placeholder="e.g. Swimming Laps" value={catName} onChange={(e) => setCatName(e.target.value)} className="block w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"/>
                  {editingCatId && <span className="text-[10px] text-white/30 mt-1 block">Names are locked in database references</span>}
                </div>

                <div>
                  <label htmlFor="cat-desc" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                    Description / Scope Rules
                  </label>
                  <textarea id="cat-desc" required rows={3} placeholder="e.g. Free swimming styles, interval breaststrokes and lap workouts." value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className="block w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"/>
                </div>

                <button type="submit" className="w-full py-2 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-sm transition-all cursor-pointer hover:bg-white/95">
                  {editingCatId ? 'Apply New Descriptors' : 'Append to Category Register'}
                </button>
              </form>) : (<div className="p-5 bg-white/[0.015] rounded-sm border border-dashed border-white/10 text-center space-y-3">
                <Layers className="h-8 w-8 text-white/25 mx-auto"/>
                <p className="text-xs text-white/40 font-sans leading-relaxed">
                  Need an additional workout division? Create standard administrative custom exercise categories to expand user choices.
                </p>
                <button onClick={() => setIsAddingCat(true)} className="mx-auto py-1 px-3 bg-white text-black hover:bg-white/90 transition-all font-bold uppercase tracking-widest rounded-sm text-xs cursor-pointer block">
                  Configure New Category
                </button>
              </div>)}
          </div>

        </div>)}

      {/* Tab Panel 3: Users Accounts List registry */}
      {activeTab === 'users' && (<div id="users-tab-panel" className="bg-[#0E0E0E] rounded-sm border border-white/10 shadow-sm overflow-hidden text-[#E0E0E0]">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">Active Athletes registry</h3>
            <p className="text-xs text-white/40">Review total registered client accounts and physical profile indices.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 font-mono text-[9px] uppercase tracking-widest font-semibold text-white/40">
                <tr>
                  <th className="py-2.5 px-5">Registered User</th>
                  <th className="py-2.5 px-4">Contact Email</th>
                  <th className="py-2.5 px-4">Metrics Info</th>
                  <th className="py-2.5 px-4">User Stated Goal</th>
                  <th className="py-2.5 px-5">Member Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {users.map((item) => (<tr key={item.id} className="hover:bg-white/[0.005] transition-all font-sans">
                    <td className="py-3.5 px-5 font-semibold text-white">{item.name}</td>
                    <td className="py-3 px-4 font-mono text-white/50">{item.email}</td>
                    <td className="py-3 px-4">
                      {item.height && item.weight ? (<span className="font-mono text-[11px] text-white">
                          {item.height}cm | {item.weight}kg ({item.gender})
                        </span>) : (<span className="text-white/30 text-[10px]">Unconfigured Profile</span>)}
                    </td>
                    <td className="py-3 px-4 text-white/60 max-w-xs truncate">{item.goal || 'General Health'}</td>
                    <td className="py-3 px-5 text-white/30 font-mono text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

    </div>);
}
