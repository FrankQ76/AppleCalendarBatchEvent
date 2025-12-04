
import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, Clock, Download, Trash2, CalendarCheck, FileText, Bell, Plus, Pencil, X, Check, Save, AlertCircle } from 'lucide-react';
import CalendarGrid from './components/CalendarGrid';
import { BatchConfig, TimePreset } from './types';
import { isSameDay, formatDisplayDate } from './utils/dateUtils';
import { generateICSContent, downloadICS } from './utils/icsUtils';

const DEFAULT_PRESETS: TimePreset[] = [
  { id: '1', label: 'Work', startTime: '09:00', endTime: '17:00', alert: 'none', alert2: 'none', isAllDay: false },
  { id: '2', label: 'Morning Work', startTime: '09:00', endTime: '13:00', alert: 'none', alert2: 'none', isAllDay: false },
  { id: '3', label: 'Vacation', startTime: '09:00', endTime: '18:00', alert: 'none', alert2: 'none', isAllDay: true },
];

const App: React.FC = () => {
  const [config, setConfig] = useState<BatchConfig>({
    reason: '',
    startTime: '09:00',
    endTime: '17:00',
    alert: 'none',
    alert2: 'none',
    isAllDay: false,
  });

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [presets, setPresets] = useState<TimePreset[]>([]);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TimePreset | null>(null);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load presets from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('apple_cal_batch_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        setPresets(DEFAULT_PRESETS);
      }
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  // Save presets to local storage whenever they change
  useEffect(() => {
    if (presets.length > 0) {
      localStorage.setItem('apple_cal_batch_presets', JSON.stringify(presets));
    }
  }, [presets]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setConfig((prev) => ({ ...prev, [name]: checked }));
    } else {
        setConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleDate = useCallback((date: Date) => {
    setSelectedDates((prev) => {
      const exists = prev.find((d) => isSameDay(d, date));
      if (exists) {
        return prev.filter((d) => !isSameDay(d, date));
      } else {
        return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      }
    });
  }, []);

  const handleDownload = () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date.');
      return;
    }
    const icsContent = generateICSContent(selectedDates, config);
    const filename = (config.reason || 'batch_calendar_export').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadICS(icsContent, filename);
  };

  const clearDates = () => setSelectedDates([]);

  // Preset Handlers
  const applyPreset = (preset: TimePreset, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setConfig((prev) => ({
      ...prev,
      reason: preset.label, // Use label as the event title
      startTime: preset.startTime,
      endTime: preset.endTime,
      alert: preset.alert ?? 'none',
      alert2: preset.alert2 ?? 'none',
      isAllDay: preset.isAllDay ?? false,
    }));
  };

  const startAddingPreset = () => {
    setIsAddingPreset(true);
    // Default the preset name to the current Event Title (reason)
    setNewPresetLabel(config.reason || '');
  };

  const cancelAddingPreset = () => {
    setIsAddingPreset(false);
    setNewPresetLabel('');
  };

  const saveNewPreset = () => {
    if (!newPresetLabel.trim()) return;
    const newPreset: TimePreset = {
      id: Date.now().toString(),
      label: newPresetLabel,
      startTime: config.startTime,
      endTime: config.endTime,
      alert: config.alert,
      alert2: config.alert2,
      isAllDay: config.isAllDay,
    };
    setPresets((prev) => [...prev, newPreset]);
    setIsAddingPreset(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deleteConfirmId === id) {
      // Confirmed, delete it
      setPresets((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    } else {
      // First click, ask for confirmation
      setDeleteConfirmId(id);
      // Auto-reset confirmation after 3 seconds if not clicked
      setTimeout(() => {
        setDeleteConfirmId((current) => current === id ? null : current);
      }, 3000);
    }
  };

  const startEditingPreset = (preset: TimePreset, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(null); // Cancel any pending deletes
    setEditingPresetId(preset.id);
    setEditForm({
      alert: 'none',
      alert2: 'none',
      isAllDay: false,
      ...preset
    });
  };

  const cancelEditingPreset = () => {
    setEditingPresetId(null);
    setEditForm(null);
  };

  const saveEditedPreset = () => {
    if (!editForm || !editForm.label.trim()) return;
    setPresets((prev) => prev.map((p) => (p.id === editForm.id ? editForm : p)));
    setEditingPresetId(null);
    setEditForm(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setEditForm({ ...editForm, [name]: checked });
    } else {
        setEditForm({ ...editForm, [name]: value });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
              <CalendarCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200">
                Apple Calendar Batch Event
              </h1>
              <p className="text-xs text-slate-400">ICS Generator</p>
            </div>
          </div>
          <span className="text-sm font-medium text-slate-500">
            v1.6.6
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="md:col-span-5 space-y-6">
          <section className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
                <FileText size={18} className="text-blue-400" />
                Event Details
              </h2>
              
              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Event Title</label>
                <div className="relative">
                  <input
                    type="text"
                    name="reason"
                    value={config.reason}
                    onChange={handleInputChange}
                    placeholder="e.g. Work, Vacation"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Time Range */}
              <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={14} /> Time Range
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                name="isAllDay"
                                checked={config.isAllDay}
                                onChange={handleInputChange}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">All Day</span>
                    </label>
                </div>

                {!config.isAllDay ? (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div>
                        <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                        <input
                            type="time"
                            name="startTime"
                            value={config.startTime}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-600"
                        />
                        </div>
                        <div>
                        <label className="block text-xs text-slate-500 mb-1">End Time</label>
                        <input
                            type="time"
                            name="endTime"
                            value={config.endTime}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-600"
                        />
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center text-xs text-slate-500 animate-in fade-in zoom-in-95 duration-200">
                        Event will be set for the entire day
                    </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 my-4"></div>

            {/* Presets Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                 <h3 className="text-sm font-semibold text-slate-300">Saved Events</h3>
                 {!isAddingPreset && (
                   <button 
                     type="button"
                     onClick={startAddingPreset}
                     className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                   >
                     <Save size={12} /> Save Current
                   </button>
                 )}
              </div>

              {isAddingPreset && (
                <div className="mb-3 p-3 bg-slate-950 rounded-lg border border-blue-900/50 animate-in fade-in slide-in-from-top-2">
                   <label className="block text-xs text-slate-500 mb-1">Saved Event Name</label>
                   <div className="flex gap-2">
                     <input
                        type="text"
                        value={newPresetLabel}
                        onChange={(e) => setNewPresetLabel(e.target.value)}
                        placeholder="e.g. Work, Vacation"
                        className="flex-1 px-2 py-1 text-sm bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-blue-500 outline-none"
                        autoFocus
                     />
                     <button type="button" onClick={saveNewPreset} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500">
                       <Check size={14} />
                     </button>
                     <button type="button" onClick={cancelAddingPreset} className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700">
                       <X size={14} />
                     </button>
                   </div>
                </div>
              )}

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {presets.map((preset) => (
                  <div key={preset.id} className="relative group">
                    {editingPresetId === preset.id && editForm ? (
                      <div className="p-2 bg-slate-800 rounded-lg border border-blue-500/50 flex flex-col gap-2 z-40 relative">
                        <input
                           type="text"
                           name="label"
                           value={editForm.label}
                           onChange={handleEditFormChange}
                           className="w-full px-2 py-1 text-sm bg-slate-900 border border-slate-700 rounded text-slate-100 outline-none focus:border-blue-500"
                           placeholder="Event Title"
                        />
                         <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                name="isAllDay"
                                checked={editForm.isAllDay}
                                onChange={handleEditFormChange}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                            />
                            <span className="text-xs text-slate-400">All Day</span>
                         </div>
                        {!editForm.isAllDay && (
                            <div className="flex gap-2">
                            <input
                                type="time"
                                name="startTime"
                                value={editForm.startTime}
                                onChange={handleEditFormChange}
                                className="flex-1 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100"
                            />
                            <input
                                type="time"
                                name="endTime"
                                value={editForm.endTime}
                                onChange={handleEditFormChange}
                                className="flex-1 px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-100"
                            />
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-1">
                          <button type="button" onClick={saveEditedPreset} className="px-2 py-1 bg-blue-600 text-xs text-white rounded hover:bg-blue-500">Save</button>
                          <button type="button" onClick={cancelEditingPreset} className="px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded hover:bg-slate-600">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                        
                        {/* Background Click Layer (z-0) - handles the main selection click */}
                        <button
                            type="button"
                            onClick={(e) => applyPreset(preset, e)}
                            className="absolute inset-0 w-full h-full text-left bg-transparent hover:bg-slate-900 transition-colors z-0 focus:outline-none focus:bg-slate-900"
                        >
                            <span className="sr-only">Select {preset.label}</span>
                        </button>

                        {/* Content Layer (z-10) - visual only, clicks pass through or handled by background */}
                        <div className="relative z-10 flex-1 pr-2 pointer-events-none">
                          <div className="text-sm font-medium text-slate-200">{preset.label}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {preset.isAllDay ? 'All Day' : `${preset.startTime} - ${preset.endTime}`}
                          </div>
                        </div>
                        
                        {/* Actions Layer (z-30) - handles button clicks separately */}
                        <div className="relative z-30 flex items-center gap-1 pointer-events-auto">
                           <button
                             type="button"
                             onClick={(e) => applyPreset(preset, e)}
                             className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-medium transition-colors mr-1 cursor-pointer"
                           >
                             Select
                           </button>

                           <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                              <button
                                type="button"
                                onClick={(e) => startEditingPreset(preset, e)}
                                className="p-2 text-slate-500 hover:text-blue-400 rounded transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil size={16} className="pointer-events-none" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(preset.id, e)}
                                className={`p-2 rounded transition-all cursor-pointer flex items-center justify-center ${
                                  deleteConfirmId === preset.id 
                                    ? 'bg-red-600 text-white hover:bg-red-700 w-[34px]' 
                                    : 'text-slate-500 hover:text-red-400'
                                }`}
                                title={deleteConfirmId === preset.id ? 'Confirm Delete' : 'Delete'}
                              >
                                {deleteConfirmId === preset.id ? (
                                  <AlertCircle size={16} className="pointer-events-none" />
                                ) : (
                                  <Trash2 size={16} className="pointer-events-none" />
                                )}
                              </button>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 my-4"></div>

            {/* Alert Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Bell size={14} /> Alert 1
                </label>
                <div className="relative">
                  <select
                    name="alert"
                    value={config.alert}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="PT0M">At time</option>
                    <option value="-PT5M">5 min before</option>
                    <option value="-PT10M">10 min before</option>
                    <option value="-PT15M">15 min before</option>
                    <option value="-PT30M">30 min before</option>
                    <option value="-PT1H">1 hour before</option>
                    <option value="-PT2H">2 hours before</option>
                    <option value="-P1D">1 day before</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Bell size={14} /> Alert 2
                </label>
                <div className="relative">
                  <select
                    name="alert2"
                    value={config.alert2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="PT0M">At time</option>
                    <option value="-PT5M">5 min before</option>
                    <option value="-PT10M">10 min before</option>
                    <option value="-PT15M">15 min before</option>
                    <option value="-PT30M">30 min before</option>
                    <option value="-PT1H">1 hour before</option>
                    <option value="-PT2H">2 hours before</option>
                    <option value="-P1D">1 day before</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Selected Dates Summary (Mobile only, or small list) */}
          <section className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
                <Calendar size={18} className="text-blue-400" />
                Selected Dates
              </h2>
              <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold border border-blue-800/50">
                {selectedDates.length}
              </span>
            </div>
            
            {selectedDates.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No dates selected yet. <br/> Click dates on the calendar.
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedDates.map((date) => (
                  <div key={date.toISOString()} className="flex items-center justify-between text-sm p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="font-medium text-slate-300">{formatDisplayDate(date)}</span>
                    <button
                      type="button"
                      onClick={() => toggleDate(date)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
             {selectedDates.length > 0 && (
                <button 
                    type="button"
                    onClick={clearDates} 
                    className="mt-4 text-xs text-red-400 hover:text-red-300 hover:underline w-full text-center"
                >
                    Clear all dates
                </button>
             )}
          </section>
        </div>

        {/* Right Column: Calendar Selection */}
        <div className="md:col-span-7 space-y-6">
          <CalendarGrid
            selectedDates={selectedDates}
            onToggleDate={toggleDate}
          />

          {/* Action Area */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-end pt-4 border-t border-slate-800">
             <div className="text-sm text-slate-500 text-center sm:text-right hidden sm:block">
                Ready to export <br/>
                <span className="font-bold text-slate-200">{selectedDates.length} events</span>
             </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedDates.length === 0}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold shadow-lg transition-all transform active:scale-95
                ${
                  selectedDates.length === 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20 hover:-translate-y-0.5'
                }
              `}
            >
              <Download size={20} />
              Download .ICS File
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
