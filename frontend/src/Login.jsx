import React, { useState } from 'react';

const MOCK_DOCTORS = [
  { id: 'DR101', name: 'Dr. Sarah Jenkins', pass: 'admin' },
  { id: 'DR102', name: 'Dr. Marcus Vance', pass: 'admin' },
  { id: 'DR103', name: 'Dr. Emily Chen', pass: 'admin' }
];

export default function Login({ onLogin, isDarkMode }) {
  const [doctorId, setDoctorId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const matchedDoctor = MOCK_DOCTORS.find(doc => doc.id === doctorId && doc.pass === password);
    if (matchedDoctor) {
      setError(false);
      onLogin(matchedDoctor);
    } else {
      setError(true);
    }
  };

  return (
    <div className="h-screen w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 flex items-center justify-center font-sans text-stone-800 p-4 relative">
      <div className="absolute top-6 right-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm max-w-xs">
        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2">Demo Access</h3>
        <ul className="space-y-1">
          {MOCK_DOCTORS.map(doc => (
            <li key={doc.id} className="text-sm text-emerald-700">
              <span className="font-semibold">{doc.id}</span> / pass: <span className="font-mono">{doc.pass}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-8 max-w-md w-full shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <svg className="w-10 h-10 text-emerald-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-slate-100 transition-colors duration-300 tracking-tight flex items-center gap-2">
            ClinicalCDSS
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 transition-colors duration-300 mt-1">Provider Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Doctor ID</label>
            <input 
              type="text" 
              value={doctorId} 
              onChange={(e) => setDoctorId(e.target.value)} 
              className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" 
              placeholder="e.g. DR101"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" 
            />
          </div>

          {error && (
            <div className="text-xs font-medium text-rose-600 mt-2 text-center bg-rose-50 border border-rose-200 rounded p-2">
              Invalid ID or Password
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-2 text-sm shadow-sm"
          >
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}
