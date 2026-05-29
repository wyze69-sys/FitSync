/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Trash, ChevronDown, ChevronUp, Calendar, Dumbbell, Flame, Clock, AlertCircle, History } from 'lucide-react';
export default function WorkoutView({ workouts, onWorkoutLogged, prefilledTemplate, onClearPrefilledTemplate, triggerToast }) {
    const [categories, setCategories] = useState([]);
    const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
    const [editingWorkoutId, setEditingWorkoutId] = useState(null);
    // Auto-fill form from starter templates
    useEffect(() => {
        if (prefilledTemplate) {
            setTitle(prefilledTemplate.title);
            setNotes('Logged from Workout Template.');
            setDate(new Date().toISOString().split('T')[0]);
            const mapped = prefilledTemplate.exercises.map((ex) => ({
                categoryId: ex.categoryId || 'cat_3',
                categoryName: ex.categoryName || 'Strength & Core',
                exerciseName: ex.exerciseName || '',
                duration: ex.duration?.toString() || '30',
                caloriesBurned: ex.caloriesBurned?.toString() || '150',
                sets: (ex.sets || []).map((s) => ({
                    reps: s.reps?.toString() || '10',
                    weight: s.weight?.toString() || '0'
                }))
            }));
            setFormExercises(mapped);
            setIsLoggingWorkout(true);
            setEditingWorkoutId(null);
            setError(null);
            if (onClearPrefilledTemplate) {
                onClearPrefilledTemplate();
            }
        }
    }, [prefilledTemplate]);
    // Core form parameters
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [formExercises, setFormExercises] = useState([]);
    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // Fetch available categories from API
    useEffect(() => {
        async function loadCategories() {
            try {
                const token = localStorage.getItem('fitsync_token');
                const resp = await fetch('/api/categories', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setCategories(data);
                }
            }
            catch (err) {
                console.error('Error fetching categories:', err);
            }
        }
        loadCategories();
    }, []);
    function handleAddExerciseToForm() {
        const defaultCat = categories[0] || { id: 'cat_1', name: 'Cardio Training' };
        setFormExercises([
            ...formExercises,
            {
                categoryId: defaultCat.id,
                categoryName: defaultCat.name,
                exerciseName: '',
                duration: '',
                caloriesBurned: '',
                sets: [{ reps: '', weight: '' }]
            }
        ]);
    }
    function handleRemoveExerciseFromForm(index) {
        setFormExercises(formExercises.filter((_, idx) => idx !== index));
    }
    function handleExerciseFieldChange(exIndex, field, value) {
        const updated = [...formExercises];
        if (field === 'categoryId') {
            const cat = categories.find(c => c.id === value);
            updated[exIndex].categoryId = value;
            updated[exIndex].categoryName = cat ? cat.name : 'General Exercise';
        }
        else {
            updated[exIndex][field] = value;
        }
        setFormExercises(updated);
    }
    function handleAddSetToExercise(exIndex) {
        const updated = [...formExercises];
        updated[exIndex].sets.push({ reps: '', weight: '' });
        setFormExercises(updated);
    }
    function handleRemoveSetFromExercise(exIndex, setIndex) {
        const updated = [...formExercises];
        updated[exIndex].sets = updated[exIndex].sets.filter((_, idx) => idx !== setIndex);
        setFormExercises(updated);
    }
    function handleSetFieldChange(exIndex, setIndex, field, value) {
        const updated = [...formExercises];
        updated[exIndex].sets[setIndex][field] = value;
        setFormExercises(updated);
    }
    function initEmptyWorkoutForm() {
        setDate(new Date().toISOString().split('T')[0]);
        setTitle('');
        setNotes('');
        const defaultCat = categories[0] || { id: 'cat_1', name: 'Cardio Training' };
        setFormExercises([
            {
                categoryId: defaultCat.id,
                categoryName: defaultCat.name,
                exerciseName: '',
                duration: '15',
                caloriesBurned: '100',
                sets: [{ reps: '10', weight: '20' }]
            }
        ]);
    }
    async function handleSaveWorkout(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        if (formExercises.length === 0) {
            setError('Please attach at least one exercise to log a complete workout session.');
            setLoading(false);
            return;
        }
        // Validate that required fields are loaded
        for (let i = 0; i < formExercises.length; i++) {
            const ex = formExercises[i];
            if (!ex.exerciseName.trim()) {
                setError(`Please specify Name or Routine for Exercise #${i + 1}.`);
                setLoading(false);
                return;
            }
        }
        const payload = {
            date,
            title: title.trim(),
            notes: notes.trim(),
            exercises: formExercises.map(ex => ({
                categoryId: ex.categoryId,
                categoryName: ex.categoryName,
                exerciseName: ex.exerciseName.trim(),
                duration: Number(ex.duration) || 0,
                caloriesBurned: Number(ex.caloriesBurned) || 0,
                sets: ex.sets.map(s => ({
                    reps: Number(s.reps) || 0,
                    weight: Number(s.weight) || 0
                }))
            }))
        };
        try {
            const token = localStorage.getItem('fitsync_token');
            const url = editingWorkoutId ? `/api/workouts/${editingWorkoutId}` : '/api/workouts';
            const method = editingWorkoutId ? 'PUT' : 'POST';
            const resp = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || 'Failed saving workout block.');
            }
            if (triggerToast) {
                triggerToast(editingWorkoutId
                    ? 'Workout log synchronized successfully! 🏆'
                    : 'Unbelievable effort! Workout logged into MySQL database! 🔥', 'success');
            }
            onWorkoutLogged();
            setIsLoggingWorkout(false);
            setEditingWorkoutId(null);
        }
        catch (err) {
            setError(err.message || 'An error occurred while tracking.');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleDeleteWorkout(id) {
        if (!confirm('Are you absolutely sure you want to delete this workout log?')) {
            return;
        }
        try {
            const token = localStorage.getItem('fitsync_token');
            const resp = await fetch(`/api/workouts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resp.ok) {
                const data = await resp.json();
                throw new Error(data.error || 'Failed deleting workout.');
            }
            if (triggerToast) {
                triggerToast('Workout history entry deleted.', 'info');
            }
            onWorkoutLogged();
        }
        catch (err) {
            alert(err.message || 'Failed executing delete.');
        }
    }
    function handleStartEditWorkout(w) {
        setEditingWorkoutId(w.id);
        setDate(w.date);
        setTitle(w.title);
        setNotes(w.notes || '');
        setFormExercises(w.exercises.map(ex => ({
            categoryId: ex.categoryId,
            categoryName: ex.categoryName,
            exerciseName: ex.exerciseName,
            duration: ex.duration.toString(),
            caloriesBurned: ex.caloriesBurned.toString(),
            sets: ex.sets.map(s => ({
                reps: s.reps.toString(),
                weight: s.weight.toString()
            }))
        })));
        setIsLoggingWorkout(true);
    }
    return (<div id="workouts-view-root" className="space-y-6 text-left font-sans text-[#E0E0E0]">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif italic text-white">Active Workout Tracker</h2>
          <p className="text-xs text-white/40">Track routine metrics, physical splits, sets and reps with durability</p>
        </div>
        {!isLoggingWorkout && (<button type="button" onClick={() => {
                initEmptyWorkoutForm();
                setIsLoggingWorkout(true);
                setEditingWorkoutId(null);
                setError(null);
            }} className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-sm text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-white/90 transition-all shadow-xl">
            <Plus className="h-4 w-4"/>
            Track Session Log
          </button>)}
      </div>

      {/* Main logging Form */}
      {isLoggingWorkout && (<form onSubmit={handleSaveWorkout} className="bg-[#0E0E0E] p-6 rounded-sm border border-white/10 shadow-lg space-y-6">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-serif italic text-white flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-400"/>
              {editingWorkoutId ? 'Modify Session Log' : 'Configure New Training Session'}
            </h3>
            <button type="button" onClick={() => {
                setIsLoggingWorkout(false);
                setEditingWorkoutId(null);
            }} className="text-xs text-white/40 hover:text-white underline decoration-white/25 underline-offset-4 font-serif italic cursor-pointer transition-all">
              Discard Changes
            </button>
          </div>

          {error && (<div className="p-3 bg-red-950/45 border border-red-900/40 text-red-200 text-xs rounded-sm font-medium flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-red-400"/>
              <span>{error}</span>
            </div>)}

          {/* Form Top Level Configs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="w-date-field" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                Workout Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-white/30"/>
                <input id="w-date-field" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="block w-full pl-9 pr-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"/>
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="w-title-field" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                Workout Title / Program Routine Name
              </label>
              <input id="w-title-field" type="text" required placeholder="e.g. Upper Body Push Recovery, Evening Walk" value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full px-3.5 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"/>
            </div>
          </div>

          <div>
            <label htmlFor="w-notes" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5">
              General Session Feeling Notes (Optional)
            </label>
            <input id="w-notes" type="text" placeholder="e.g. Set a personal record on Dumbbells shoulder rows! Hydrated and energized." value={notes} onChange={(e) => setNotes(e.target.value)} className="block w-full px-3.5 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"/>
          </div>

          {/* SubForm: Nested Exercises & Sets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Exercises list ({formExercises.length})</h4>
              <button type="button" onClick={handleAddExerciseToForm} className="py-1 px-3 border border-white/10 hover:bg-white/5 bg-white/5 rounded-sm text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer transition-all">
                <Plus className="h-3.5 w-3.5"/>
                Add Exercise Activity
              </button>
            </div>

            {formExercises.length === 0 ? (<div className="p-8 bg-white/[0.01] text-center rounded-sm border border-dashed border-white/10 text-white/40 text-xs">
                No physical exercises attached yet. Click the button to add.
              </div>) : (<div className="space-y-4">
                {formExercises.map((ex, exIdx) => (<div key={exIdx} className="p-4 rounded-sm border border-white/15 bg-white/[0.01] space-y-4 relative">
                    <button type="button" onClick={() => handleRemoveExerciseFromForm(exIdx)} className="absolute top-4 right-4 text-white/40 hover:text-red-400 transition-all cursor-pointer" title="Delete exercise">
                      <Trash2 className="h-4 w-4"/>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                      {/* Exercise Category Selection */}
                      <div>
                        <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                          Training Split Category
                        </label>
                        <select value={ex.categoryId} onChange={(e) => handleExerciseFieldChange(exIdx, 'categoryId', e.target.value)} className="block w-full px-2 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none cursor-pointer transition-all">
                          {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                      </div>

                      {/* Exercise Name input */}
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                          Exercise / Activity Name
                        </label>
                        <input type="text" required placeholder="e.g. Barbell Squats, Kettlebell Swings" value={ex.exerciseName} onChange={(e) => handleExerciseFieldChange(exIdx, 'exerciseName', e.target.value)} className="block w-full px-2.5 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all"/>
                      </div>

                      {/* Calorie / Minute Details */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                            Min Duration
                          </label>
                          <input type="number" required placeholder="Min" value={ex.duration} onChange={(e) => handleExerciseFieldChange(exIdx, 'duration', e.target.value)} className="block w-full px-2 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-center text-white"/>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">
                            Est. Calories
                          </label>
                          <input type="number" required placeholder="kcal" value={ex.caloriesBurned} onChange={(e) => handleExerciseFieldChange(exIdx, 'caloriesBurned', e.target.value)} className="block w-full px-2 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-center text-white"/>
                        </div>
                      </div>
                    </div>

                    {/* Sets Details Container */}
                    <div className="border-t border-white/10 pt-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/50 block">Sets and Load details</span>
                        <button type="button" onClick={() => handleAddSetToExercise(exIdx)} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition-all">
                          + Append Set Index
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3 items-center">
                        {ex.sets.map((set, setIdx) => (<div key={setIdx} className="flex items-center gap-1.5 bg-[#050505] px-2.5 py-1.5 rounded-sm border border-white/10 text-xs text-white">
                            <span className="font-mono text-[9px] text-white/30 font-semibold">#{setIdx + 1}</span>
                            <input type="number" required placeholder="Reps" value={set.reps} onChange={(e) => handleSetFieldChange(exIdx, setIdx, 'reps', e.target.value)} className="w-11 px-1 py-0.5 bg-black border border-white/10 rounded-sm text-center text-xs text-white focus:border-white focus:outline-none" title="Reps"/>
                            <span className="text-white/40 text-[10px]">reps</span>
                            <span className="text-white/10">|</span>
                            <input type="number" required placeholder="kg" value={set.weight} onChange={(e) => handleSetFieldChange(exIdx, setIdx, 'weight', e.target.value)} className="w-11 px-1 py-0.5 bg-black border border-white/10 rounded-sm text-center text-xs text-white focus:border-white focus:outline-none" title="Weight"/>
                            <span className="text-white/40 text-[10px]">kg</span>
                            {ex.sets.length > 1 && (<button type="button" onClick={() => handleRemoveSetFromExercise(exIdx, setIdx)} className="text-white/40 hover:text-red-400 ml-1 cursor-pointer transition-all">
                                <Trash className="h-3 w-3"/>
                              </button>)}
                          </div>))}
                      </div>
                    </div>

                  </div>))}
              </div>)}
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-white text-black font-bold uppercase tracking-widest rounded-sm text-xs transition-all cursor-pointer hover:bg-white/95 disabled:opacity-50">
            {loading ? 'Processing Transaction with Database...' : (editingWorkoutId ? 'Update Workout Record' : 'Log Workout Session')}
          </button>
        </form>)}

      {/* Historical List */}
      {!isLoggingWorkout && (<div className="space-y-4">
          <div className="flex items-center gap-2 text-white/40">
            <History className="h-4 w-4"/>
            <h3 className="text-xs font-semibold uppercase tracking-widest font-mono">Workout Training Logs History</h3>
          </div>

          {workouts.length === 0 ? (<div className="bg-[#0E0E0E] py-16 px-6 text-center rounded-sm border border-white/10 shadow-xl flex flex-col items-center justify-center">
              <Dumbbell className="h-10 w-10 text-white/20 mb-3"/>
              <p className="text-sm font-medium text-white/80">No training workouts registered yet</p>
              <p className="text-xs text-white/40 max-w-sm mt-1.5 leading-relaxed">Please press the Training Log configuration button to record exercises and review metrics trends.</p>
            </div>) : (<div className="space-y-4">
              {workouts.map((w) => {
                    const isExpanded = expandedWorkoutId === w.id;
                    return (<div key={w.id} className="bg-[#0E0E0E] border border-white/10 hover:border-white/15 rounded-sm shadow-md overflow-hidden transition-all duration-300">
                    {/* Header bar click to expand */}
                    <div onClick={() => setExpandedWorkoutId(isExpanded ? null : w.id)} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.015] transition-all">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white/60 text-[9px] font-mono font-bold uppercase tracking-widest">
                            {w.date}
                          </span>
                          <h4 className="text-sm font-bold text-white font-sans">{w.title}</h4>
                        </div>
                        {w.notes && (<p className="text-xs text-white/40 font-sans leading-relaxed line-clamp-1">{w.notes}</p>)}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="flex items-center gap-6 text-xs font-mono">
                          <div className="text-right">
                            <span className="text-white/30 block text-[8px] font-mono uppercase tracking-wider">Duration</span>
                            <span className="font-semibold text-white">{w.durationTotal}m</span>
                          </div>
                          <div className="text-right border-l border-white/10 pl-6">
                            <span className="text-white/30 block text-[8px] font-mono uppercase tracking-wider">Kcal Burn</span>
                            <span className="font-semibold text-emerald-400">{w.caloriesTotal}</span>
                          </div>
                          <div className="text-right border-l border-white/10 pl-6">
                            <span className="text-white/30 block text-[8px] font-mono uppercase tracking-wider">Exercises</span>
                            <span className="font-semibold text-white">{w.exercises.length}</span>
                          </div>
                        </div>

                        <div className="text-white/40 hover:text-white transition-all">
                          {isExpanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                        </div>
                      </div>
                    </div>

                    {/* Expandable exercises block */}
                    {isExpanded && (<div className="bg-white/[0.005] border-t border-white/10 p-5 space-y-4 font-sans text-xs text-[#E0E0E0]">
                        <div className="space-y-4">
                          {w.exercises.map((ex, exIdx) => (<div key={ex.id} className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 last:pb-0 border-b border-white/5 last:border-b-0">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/50 font-mono text-[9px] uppercase tracking-wider">
                                    {ex.categoryName}
                                  </span>
                                  <span className="font-bold text-white">{ex.exerciseName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-white/40">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-white/30"/>
                                    {ex.duration} mins
                                  </span>
                                  <span className="text-white/10">•</span>
                                  <span className="flex items-center gap-1">
                                    <Flame className="h-3.5 w-3.5 text-emerald-500"/>
                                    {ex.caloriesBurned} kcal
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 items-center">
                                {ex.sets.map((set, sIdx) => (<span key={sIdx} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-white/80 text-center">
                                    Set {sIdx + 1}: <strong className="text-white">{set.reps}</strong> reps × <strong className="text-white">{set.weight}</strong> kg
                                  </span>))}
                              </div>
                            </div>))}
                        </div>

                        {/* Edit delete buttons */}
                        <div className="pt-3 flex justify-end gap-5 border-t border-white/10">
                          <button type="button" onClick={() => handleStartEditWorkout(w)} className="text-xs font-serif italic text-white/60 hover:text-white transition-all cursor-pointer underline decoration-white/15 underline-offset-4">
                            Edit Workout
                          </button>
                          <button type="button" onClick={() => handleDeleteWorkout(w.id)} className="text-xs font-serif italic text-red-400 hover:text-red-300 transition-all cursor-pointer underline decoration-red-900/40 underline-offset-4">
                            Delete Record
                          </button>
                        </div>
                      </div>)}
                  </div>);
                })}
            </div>)}
        </div>)}

    </div>);
}
