/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Scale, Calendar, Trash2, AlertCircle, Plus, Compass } from 'lucide-react';
export default function WeightTrackerView({ user, weightLogs, onWeightLogged, triggerToast }) {
    const [weight, setWeight] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [isLogging, setIsLogging] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // Helper to resolve BMI with dark mode styling variables
    function resolveBmiCategory(bmi) {
        if (bmi < 18.5) {
            return {
                label: 'Underweight',
                desc: 'Slightly below healthy metrics.',
                color: 'text-amber-400',
                bg: 'bg-amber-950/20 border border-amber-900/30'
            };
        }
        else if (bmi >= 18.5 && bmi < 25) {
            return {
                label: 'Healthy Weight',
                desc: 'Perfect metabolic index range.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-950/20 border border-emerald-900/30'
            };
        }
        else if (bmi >= 25 && bmi < 30) {
            return {
                label: 'Overweight',
                desc: 'Mildly above standard benchmarks.',
                color: 'text-orange-400',
                bg: 'bg-orange-950/20 border border-orange-900/30'
            };
        }
        else {
            return {
                label: 'Obese',
                desc: 'Significant cardiovascular loads.',
                color: 'text-red-400',
                bg: 'bg-red-950/20 border border-red-900/30'
            };
        }
    }
    const currentBmi = user.height && user.weight
        ? Number((user.weight / ((user.height / 100) * (user.height / 100))).toFixed(1))
        : 0;
    const bmiMeta = resolveBmiCategory(currentBmi);
    async function handleLogWeight(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        if (!weight || Number(weight) <= 0) {
            setError('Please provide a positive weight parameter.');
            setLoading(false);
            return;
        }
        try {
            const token = localStorage.getItem('fitsync_token');
            const resp = await fetch('/api/weights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date,
                    weight: Number(weight),
                    notes: notes.trim()
                })
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || 'Failed saving weight log.');
            }
            if (triggerToast) {
                triggerToast(`Scale updated! Logged ${weight}kg to your athlete profile. ⚖️`, 'success');
            }
            setWeight('');
            setNotes('');
            setIsLogging(false);
            onWeightLogged();
        }
        catch (err) {
            setError(err.message || 'Error occurred.');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleDeleteWeight(id) {
        if (!confirm('Are you sure you want to delete this weight log entry?')) {
            return;
        }
        try {
            const token = localStorage.getItem('fitsync_token');
            const resp = await fetch(`/api/weights/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.error || 'Failed deleting weight log.');
            }
            if (triggerToast) {
                triggerToast('Weight log deleted.', 'info');
            }
            onWeightLogged();
        }
        catch (err) {
            alert(err.message || 'An error occurred.');
        }
    }
    return (<div id="weight-tracker-root" className="space-y-6 text-left font-sans text-[#E0E0E0]">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif italic text-white font-bold">Scale & Body weight tracker</h2>
          <p className="text-xs text-white/40">Compare weight indexes dynamically, analyze BMI scores, and record progress</p>
        </div>
        {!isLogging && (<button type="button" onClick={() => {
                setIsLogging(true);
                setDate(new Date().toISOString().split('T')[0]);
                setError(null);
            }} className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all cursor-pointer shadow-xl">
            <Plus className="h-4 w-4"/>
            Add Weight Entry
          </button>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side weight log form & values overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Collapsible form log entry */}
          {isLogging && (<form onSubmit={handleLogWeight} className="bg-[#0E0E0E] p-6 rounded-sm border border-white/10 shadow-lg space-y-5">
              <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                  <Scale className="h-4.5 w-4.5 text-emerald-400"/>
                  Record Body Weight
                </h3>
                <button type="button" onClick={() => setIsLogging(false)} className="text-xs text-white/40 hover:text-white underline decoration-white/20 underline-offset-4 font-serif italic cursor-pointer transition-all">
                  Discard
                </button>
              </div>

              {error && (<div className="p-3 bg-red-950/45 border border-red-900/40 text-red-105 text-xs rounded-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400"/>
                  <span>{error}</span>
                </div>)}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="w-date" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                    Log Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-white/30"/>
                    <input id="w-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="block w-full pl-9 pr-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white font-sans focus:bg-black focus:border-[#FFFFFF] focus:outline-none transition-all"/>
                  </div>
                </div>

                <div>
                  <label htmlFor="w-weight-val" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                    Current Weight (kg)
                  </label>
                  <input id="w-weight-val" type="number" step="0.01" required placeholder="e.g. 68.3" value={weight} onChange={(e) => setWeight(e.target.value)} className="block w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white font-sans focus:bg-black focus:border-[#FFFFFF] focus:outline-none transition-all"/>
                </div>
              </div>

              <div>
                <label htmlFor="w-notes" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                  Benchmarking Notes
                </label>
                <input id="w-notes" type="text" placeholder="e.g. Woke up, tested fasted. Feeling light and active." value={notes} onChange={(e) => setNotes(e.target.value)} className="block w-full px-3.5 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-[#FFFFFF] focus:outline-none transition-all"/>
              </div>

              <button type="submit" disabled={loading} className="w-full py-2 bg-white hover:bg-white/90 text-black font-semibold text-xs tracking-widest uppercase rounded-sm transition-all cursor-pointer disabled:opacity-50">
                {loading ? 'Logging into Database...' : 'Register Weight Entry'}
              </button>
            </form>)}

          {/* Table display */}
          <div className="bg-[#0E0E0E] rounded-sm border border-white/10 shadow-md overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-sans">Historical weight records</h3>
              <p className="text-xs text-white/40 font-sans mt-0.5">Chronological record parameters of weight and computed BMI scores</p>
            </div>

            {weightLogs.length === 0 ? (<div className="py-16 text-center text-white/30 text-xs">
                No individual weight readings logged yet. Record your weight to trigger reports!
              </div>) : (<div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs text-[#E0E0E0]">
                  <thead className="bg-white/[0.02] border-b border-white/10 font-mono text-[9px] uppercase tracking-widest font-semibold text-white/40">
                    <tr>
                      <th className="py-3 px-5">Logged Date</th>
                      <th className="py-2.5 px-3">Recorded Weight</th>
                      <th className="py-2.5 px-3">Computed BMI</th>
                      <th className="py-2.5 px-3 hidden md:table-cell">Observer Notes</th>
                      <th className="py-2.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {weightLogs.map((log) => {
                const logBmiMeta = resolveBmiCategory(log.bmi);
                return (<tr key={log.id} className="hover:bg-white/[0.01] transition-all font-sans">
                          <td className="py-3.5 px-5 font-mono text-white font-semibold">{log.date}</td>
                          <td className="py-3 px-3">
                            <span className="text-sm font-extrabold text-white">{log.weight}</span>
                            <span className="text-white/30 text-[10px] ml-0.5">kg</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">{log.bmi}</span>
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-semibold ${logBmiMeta.bg} ${logBmiMeta.color}`}>
                                {logBmiMeta.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-white/50 hidden md:table-cell max-w-xs truncate">{log.notes || '--'}</td>
                          <td className="py-3 px-5 text-right">
                            <button type="button" onClick={() => handleDeleteWeight(log.id)} className="text-white/40 hover:text-red-400 p-1.5 transition-all" title="Delete record">
                              <Trash2 className="h-4 w-4"/>
                            </button>
                          </td>
                        </tr>);
            })}
                  </tbody>
                </table>
              </div>)}
          </div>

        </div>

        {/* Right Side Healthy BMI Range Cards */}
        <div className="space-y-6">
          
          {/* General BMI gauge layout */}
          <div className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 shadow-xs space-y-4 font-sans">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Compass className="h-5 w-5 text-white/40"/>
              <h3 className="text-sm font-serif italic text-white font-bold">BMI Diagnostic Gauge</h3>
            </div>

            {user.height && user.weight ? (<div className="space-y-4 text-xs">
                <div className="text-center p-5 rounded-sm bg-white/[0.015] border border-white/5 space-y-1">
                  <div className="text-2xl font-black font-mono text-white">{currentBmi}</div>
                  <div className={`font-bold ${bmiMeta.color}`}>{bmiMeta.label}</div>
                  <p className="text-[11px] text-white/40 font-sans">{bmiMeta.desc}</p>
                </div>

                <div className="space-y-2 font-sans text-[11px]">
                  <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-1.5">
                    <span>Underweight Scale</span>
                    <span className="font-mono text-white/40">&lt; 18.5 Range</span>
                  </div>
                  <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-1.5">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                      Standard Healthy Weight
                    </span>
                    <span className="font-mono text-emerald-400/80 font-semibold">18.5 - 24.9 Range</span>
                  </div>
                  <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-1.5">
                    <span>Overweight Scale</span>
                    <span className="font-mono text-white/40">25.0 - 29.9 Range</span>
                  </div>
                  <div className="flex justify-between items-center text-white/50 pb-1">
                    <span>Obesity Scale</span>
                    <span className="font-mono text-white/40">&ge; 30.0 Range</span>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.01] rounded-sm text-[10px] text-white/40 leading-relaxed font-sans border border-white/5">
                  <strong>Formulation:</strong> BMI ratio splits current kg relative to Height squared (m²). Standard index calculation matches WHO health definitions.
                </div>
              </div>) : (<div className="p-6 text-center text-white/30 text-xs font-sans leading-relaxed">
                  Please complete your Wellness Profile height and weight in dashboard to calculate clinical BMI diagnostic gauge trends.
                </div>)}
          </div>

          {/* Quick weight reduction insights helper */}
          <div className="p-5 rounded-sm border border-white/10 bg-[#0E0E0E] text-[#E0E0E0] space-y-3 shadow-md">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#E0E0E0]">Patience is metric</h4>
            <p className="text-xs leading-relaxed text-white/40 font-sans">
              Weight oscillates on hydration, muscle glycogen splits, and meals. Prefer consistent measurements (morning fasted) once a week to monitor true lean tissue trends.
            </p>
          </div>

        </div>

      </div>

    </div>);
}
