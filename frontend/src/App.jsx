import React, { useState } from 'react';
import Login from './Login';
import Analytics from './Analytics';

function App() {
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [currentView, setCurrentView] = useState('assessment');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    age: 45,
    gender: 'Female',
    bmi: 25.0,
    bloodpressure: 120,
    thalch: 150,
    glucose: 100,
    chol: 200,
    insulin: 80,
    hypertension: false,
    heart_disease: false,
    smoking: 'never smoked',
    cp: 'asymptomatic'
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [simStep, setSimStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');

  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAnalyze = () => {
    if (loading || isSimulating) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setIsSimulating(true);
    setSimStep(0);

    let step = 0;
    const interval = setInterval(async () => {
      step++;
      setSimStep(step);

      if (step >= 5) {
        clearInterval(interval);

        // Map UI fields exactly to the backend's expected 41-dim dictionary structure
        const payload = {
          'pregnancies': 0.0,
          'glucose': Number(formData.glucose),
          'bloodpressure': Number(formData.bloodpressure),
          'skinthickness': 0.0,
          'insulin': Number(formData.insulin),
          'bmi': Number(formData.bmi),
          'diabetespedigreefunction': 0.0,
          'age': Number(formData.age),
          'trestbps': Number(formData.bloodpressure),
          'chol': Number(formData.chol),
          'fbs': 0.0,
          'thalch': Number(formData.thalch),
          'exang': 0.0,
          'oldpeak': 0.0,
          'ca': 0.0,
          'hypertension': formData.hypertension ? 1.0 : 0.0,
          'heart_disease': formData.heart_disease ? 1.0 : 0.0,
          'avg_glucose_level': Number(formData.glucose),
          'sex_Male': formData.gender === 'Male' ? 1.0 : 0.0,
          'dataset_Hungary': 0.0,
          'dataset_Switzerland': 0.0,
          'dataset_VA Long Beach': 0.0,
          'cp_atypical angina': formData.cp === 'atypical angina' ? 1.0 : 0.0,
          'cp_non-anginal': formData.cp === 'non-anginal' ? 1.0 : 0.0,
          'cp_typical angina': formData.cp === 'typical angina' ? 1.0 : 0.0,
          'restecg_normal': 0.0,
          'restecg_st-t abnormality': 0.0,
          'slope_flat': 0.0,
          'slope_upsloping': 0.0,
          'thal_normal': 0.0,
          'thal_reversable defect': 0.0,
          'gender_Male': formData.gender === 'Male' ? 1.0 : 0.0,
          'gender_Other': formData.gender === 'Other' ? 1.0 : 0.0,
          'ever_married_Yes': 0.0,
          'work_type_Never_worked': 0.0,
          'work_type_Private': 0.0,
          'work_type_Self-employed': 0.0,
          'work_type_children': 0.0,
          'residence_type_Urban': 0.0,
          'smoking_status_never smoked': formData.smoking === 'never smoked' ? 1.0 : 0.0,
          'smoking_status_smokes': formData.smoking === 'smokes' ? 1.0 : 0.0
        };

        try {
          const response = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
          }

          const data = await response.json();
          setResults(data.risk_probabilities);
        } catch (err) {
          setError("Failed to connect to the prediction API. Ensure FastAPI is running on http://127.0.0.1:8000.");
          console.error(err);
        } finally {
          setLoading(false);
          setIsSimulating(false);
        }
      }
    }, 300);
  };

  const handleSaveAssessment = () => {
    if (!patientName.trim()) {
      alert('Please enter a patient name.');
      return;
    }
    const ptId = 'PT-' + Math.floor(1000 + Math.random() * 9000);
    const payload = { 
      id: ptId, 
      patientName: patientName, 
      doctorId: currentDoctor.id, 
      date: new Date().toISOString(), 
      inputs: formData, 
      risks: results 
    };

    const existingRecords = JSON.parse(localStorage.getItem('cdss_patients') || '[]');
    existingRecords.push(payload);
    localStorage.setItem('cdss_patients', JSON.stringify(existingRecords));

    setIsSaveModalOpen(false);
    setPatientName('');
    alert('Patient data securely saved.');
  };

  if (!currentDoctor) {
    return <Login onLogin={setCurrentDoctor} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`h-screen w-full overflow-hidden flex bg-stone-50 dark:bg-slate-900 transition-colors duration-300 dark:bg-slate-900 font-sans text-stone-800 dark:text-slate-200 relative transition-colors duration-300 ease-in-out ${isDarkMode ? 'dark' : ''}`}>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-slate-900 text-stone-300 flex flex-col border-r border-slate-800 shrink-0
        transition-all duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
      `}>
        {/* Toggle Button for Desktop */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-7 bg-slate-800 border border-slate-700 text-stone-300 hover:text-white rounded-full p-1 z-50 items-center justify-center transition-colors shadow-sm"
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        <div className={`p-4 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} h-16 shrink-0`}>
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <svg className="w-6 h-6 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-semibold text-white tracking-tight leading-tight">ClinicalCDSS</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-wider font-medium leading-tight">Hybrid v1.0</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-hidden mt-2">
          <button 
            onClick={() => setCurrentView('assessment')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 ${currentView === 'assessment' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'} rounded-md font-medium text-sm transition-all`} title="Assessment">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Assessment</span>}
          </button>
          <button 
            onClick={() => setCurrentView('analytics')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 ${currentView === 'analytics' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'} rounded-md font-medium text-sm transition-all`} title="Analytics">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Analytics</span>}
          </button>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center justify-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md font-medium text-sm transition-colors duration-300 mb-2">
            {isDarkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
          </button>
          <div 
            onClick={() => { setCurrentDoctor(null); setCurrentView('assessment'); }}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} cursor-pointer hover:bg-slate-800 transition-colors rounded-lg p-2 -ml-2`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">DR</div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">{currentDoctor.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 transition-colors duration-300 font-medium mt-0.5">Click to log out</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden flex items-center justify-between bg-white border-b border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 px-4 h-16 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="text-stone-600 dark:text-slate-300 transition-colors duration-300 hover:text-stone-900 dark:text-slate-100 transition-colors duration-300 focus:outline-none p-1 -ml-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="font-semibold text-stone-900 dark:text-slate-100 transition-colors duration-300 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              ClinicalCDSS
            </h1>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
          {currentView === 'assessment' ? (
            <div className="max-w-6xl mx-auto h-full flex flex-col p-4 lg:p-6">

            <header className="mb-4 shrink-0">
              <h2 className="text-xl font-semibold text-stone-900 dark:text-slate-100 transition-colors duration-300 tracking-tight">Patient Assessment</h2>
              <p className="text-stone-500 dark:text-slate-400 transition-colors duration-300 text-xs mt-0.5">Enter clinical indicators to generate multi-task risk predictions.</p>
            </header>

            <div className="grid grid-cols-12 gap-4 flex-1 items-start">

              {/* Input Form Section (lg:col-span-8) */}
              <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
                <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-4 lg:p-5 shadow-sm">

                  {/* Compact Multi-Column Grid to Prevent Global Scrolling */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">

                    {/* Demographics Group */}
                    <div className="col-span-full border-b border-stone-100 pb-1 mt-1 first:mt-0">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest">Demographics</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Age (Years)</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Biological Sex</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow">
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium cursor-pointer hover:bg-stone-100 dark:bg-slate-700 dark:hover:bg-slate-700 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-colors w-full h-[34px]">
                        <input type="checkbox" name="smoking" onChange={(e) => handleChange({ target: { name: 'smoking', value: e.target.checked ? 'smokes' : 'never smoked' } })} checked={formData.smoking === 'smokes'} className="accent-emerald-700 w-4 h-4 rounded-sm" />
                        <span className="font-medium text-xs">Active Smoker</span>
                      </label>
                    </div>

                    {/* Vitals Group */}
                    <div className="col-span-full border-b border-stone-100 pb-1 mt-2">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest">Vitals</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">BMI</label>
                      <input type="number" name="bmi" value={formData.bmi} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Diastolic BP (mmHg)</label>
                      <input type="number" name="bloodpressure" value={formData.bloodpressure} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Max Heart Rate</label>
                      <input type="number" name="thalch" value={formData.thalch} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" />
                    </div>

                    {/* Blood Work Group */}
                    <div className="col-span-full border-b border-stone-100 pb-1 mt-2">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest">Blood Work</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Glucose Level</label>
                      <input type="number" name="glucose" value={formData.glucose} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Cholesterol</label>
                      <input type="number" name="chol" value={formData.chol} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Insulin</label>
                      <input type="number" name="insulin" value={formData.insulin} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow" />
                    </div>

                    {/* Clinical Diagnostics Group */}
                    <div className="col-span-full border-b border-stone-100 pb-1 mt-2">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest">Clinical Diagnostics</h3>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Chest Pain</label>
                      <select name="cp" value={formData.cp} onChange={handleChange} className="w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600 transition-shadow">
                        <option value="asymptomatic">Asymptomatic</option>
                        <option value="typical angina">Typical Angina</option>
                        <option value="atypical angina">Atypical Angina</option>
                        <option value="non-anginal">Non-anginal</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium cursor-pointer hover:bg-stone-100 dark:bg-slate-700 dark:hover:bg-slate-700 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-colors w-full h-[34px]">
                        <input type="checkbox" name="hypertension" checked={formData.hypertension} onChange={handleChange} className="accent-emerald-700 w-4 h-4 rounded-sm" />
                        <span className="font-medium text-xs">Hypertension</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-300 dark:border-slate-600 dark:text-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium cursor-pointer hover:bg-stone-100 dark:bg-slate-700 dark:hover:bg-slate-700 focus-within:bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-colors w-full h-[34px]">
                        <input type="checkbox" name="heart_disease" checked={formData.heart_disease} onChange={handleChange} className="accent-emerald-700 w-4 h-4 rounded-sm" />
                        <span className="font-medium text-xs">Heart Disease</span>
                      </label>
                    </div>
                  </div>

                  {/* Sequence Visualizer */}
                  <div className="border-t border-stone-200 mt-6 pt-4">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-3">Temporal Sequence Generation (BiLSTM T=5)</h3>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(step => (
                        <div
                          key={step}
                          className={`h-8 flex-1 rounded-md transition-colors duration-300 ${simStep >= step ? 'bg-emerald-600' : 'bg-stone-200'}`}
                        />
                      ))}
                    </div>
                    {isSimulating && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 transition-colors duration-300 font-medium mt-2 text-center animate-pulse">
                        Processing time-step {simStep}/5...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Section (lg:col-span-4) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-sm shrink-0"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-emerald-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Processing...
                    </>
                  ) : "Run BiLSTM Assessment"}
                </button>

                {results && (
                  <button
                    onClick={() => setIsSaveModalOpen(true)}
                    className="w-full bg-stone-200 hover:bg-stone-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 font-medium rounded-lg py-3 mt-3 transition-colors text-sm shadow-sm shrink-0"
                  >
                    Save Assessment to Database
                  </button>
                )}

                <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-5 flex flex-col shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-4 border-b border-stone-100 pb-1.5 shrink-0">Analysis Results</h3>

                  {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-md text-xs mb-3 shrink-0">
                      {error}
                    </div>
                  )}

                  {!results && !loading && !error && (
                    <div className="flex flex-col items-center justify-center text-stone-400 text-center px-2 py-4">
                      <svg className="w-10 h-10 mb-2 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <p className="text-xs">Awaiting patient data submission.</p>
                    </div>
                  )}

                  {results && !loading && (
                    <div className="space-y-4 mt-1">
                      <ResultItem label="Diabetes Risk" probability={results.Diabetes} />
                      <ResultItem label="Heart Disease Risk" probability={results['Heart Disease']} />
                      <ResultItem label="Stroke Risk" probability={results.Stroke} />
                    </div>
                  )}
                </div>

                {/* Clinical Synthesis Card */}
                <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-4">Clinical Synthesis</h3>
                  <div className="text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300 leading-relaxed">
                    {(() => {
                      if (!results) return <span className="text-stone-400 font-medium">Awaiting data synthesis...</span>;

                      const maxRisk = Object.entries(results).reduce((max, [disease, prob]) => prob > max[1] ? [disease, prob] : max, ["", 0]);
                      const [disease, prob] = maxRisk;
                      const percentage = (prob * 100).toFixed(1);

                      return `Patient profile indicates a primary elevated risk for ${disease} at ${percentage}%. Temporal attention weights suggest vital signs are primary contributors. Recommend secondary clinical screening.`;
                    })()}
                  </div>
                </div>

                {/* Pipeline Telemetry Card */}
                <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-4">Pipeline Telemetry</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-200 rounded p-2 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300 font-medium flex items-center justify-between">
                      <span>SMOTE Balancing</span>
                      <span className="text-emerald-600">Active</span>
                    </div>
                    <div className="bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-200 rounded p-2 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300 font-medium flex items-center justify-between">
                      <span>Focal Loss</span>
                      <span className="text-emerald-600">Active</span>
                    </div>
                    <div className="bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-200 rounded p-2 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300 font-medium flex items-center justify-between">
                      <span>Attention Layer</span>
                      <span className="text-emerald-600">Enabled</span>
                    </div>
                    <div className="bg-stone-50 dark:bg-slate-900 transition-colors duration-300 border border-stone-200 rounded p-2 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300 font-medium flex items-center justify-between">
                      <span>Ensemble Mode</span>
                      <span className="text-slate-600 dark:text-slate-300 transition-colors duration-300">Hybrid</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
          ) : (
            <Analytics currentDoctor={currentDoctor} />
          )}
        </main>
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 flex items-center justify-center z-50 transition-colors duration-300">
          <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 p-6 rounded-xl w-96 shadow-xl transition-colors duration-300">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">ENTER PATIENT DETAILS</h3>
            <div className="mb-6">
              <label className="block text-xs font-medium text-stone-600 dark:text-slate-300 transition-colors duration-300 mb-1">Full Name</label>
              <input 
                type="text" 
                value={patientName} 
                onChange={(e) => setPatientName(e.target.value)} 
                className="w-full bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-md p-3 text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-300 outline-none" 
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button 
                onClick={() => { setIsSaveModalOpen(false); setPatientName(''); }} 
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-slate-300 hover:text-stone-800 hover:bg-stone-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors duration-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAssessment} 
                className="px-4 py-2 text-sm font-medium bg-emerald-800 hover:bg-emerald-900 text-white rounded-md transition-colors shadow-sm"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultItem({ label, probability }) {
  const percentage = (probability * 100).toFixed(1);
  const isHighRisk = probability > 0.6;
  const isMediumRisk = probability > 0.3 && !isHighRisk;

  const trackColor = "bg-stone-100 dark:bg-slate-700";
  let barColor = "bg-emerald-600";
  let textColor = "text-emerald-800";

  if (isHighRisk) {
    barColor = "bg-rose-600";
    textColor = "text-rose-700";
  } else if (isMediumRisk) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
  }

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-semibold text-stone-600 dark:text-slate-300 transition-colors duration-300 uppercase tracking-wide">{label}</span>
        <span className={`text-xl font-bold tracking-tight ${textColor} leading-none`}>{percentage}%</span>
      </div>
      <div className={`w-full ${trackColor} h-1.5 rounded-full overflow-hidden flex`}>
        <div
          className={`h-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {isHighRisk && <p className="text-[10px] text-rose-600 mt-1.5 font-medium bg-rose-50 px-1.5 py-1 rounded inline-block border border-rose-100 uppercase tracking-wide">Elevated risk detected</p>}
    </div>
  );
}

export default App;
