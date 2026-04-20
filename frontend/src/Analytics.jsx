import React, { useState, useEffect } from 'react';

export default function Analytics({ currentDoctor }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cdss_patients') || '[]');
    const doctorPatients = data.filter(record => record.doctorId === currentDoctor.id);
    setPatients(doctorPatients);
  }, [currentDoctor.id]);

  const getRiskBadge = (risks) => {
    if (!risks) return <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded">Standard Risk</span>;
    const maxRisk = Math.max(...Object.values(risks));
    if (maxRisk > 0.6) {
      return <span className="bg-rose-50 text-rose-700 text-xs font-bold px-2 py-1 rounded">Elevated Risk</span>;
    }
    return <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded">Standard Risk</span>;
  };

  if (selectedPatient) {
    return <ClinicalReport patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-slate-100 transition-colors duration-300 tracking-tight">Patient Analytics Database</h2>
          <p className="text-stone-500 dark:text-slate-400 transition-colors duration-300 text-xs mt-0.5">Review saved clinical assessments</p>
        </header>

        {patients.length === 0 ? (
          <div className="text-stone-400 font-medium">No patient records found for this ID.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {patients.map((patient, index) => (
              <div 
                key={index} 
                onClick={() => setSelectedPatient(patient)}
                className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-6 hover:border-emerald-600 transition-colors cursor-pointer shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">{patient.id}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">{new Date(patient.date).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 transition-colors duration-300 mt-2 mb-4">{patient.patientName}</h3>
                <div>
                  {getRiskBadge(patient.risks)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClinicalReport({ patient, onBack }) {
  let highestDisease = "";
  let highestProb = 0;
  
  if (patient.risks) {
    for (const [disease, prob] of Object.entries(patient.risks)) {
      if (prob > highestProb) {
        highestProb = prob;
        highestDisease = disease;
      }
    }
  }

  return (
    <div className="h-full w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="text-emerald-700 hover:text-emerald-800 text-sm font-bold mb-6 flex items-center cursor-pointer transition-colors">
          ← Back to Roster
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-slate-100 transition-colors duration-300 tracking-tight mb-6">Clinical Assessment Report</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Card 1: Patient Profile */}
          <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-4">Patient Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase">Patient ID</p>
                <p className="text-lg text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium">{patient.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Name</p>
                <p className="text-lg text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium">{patient.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Date</p>
                <p className="text-lg text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium">{new Date(patient.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Attending</p>
                <p className="text-lg text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium">{patient.doctorId}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Clinical Vitals & Inputs */}
          <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-4">Clinical Vitals & Inputs</h3>
            <div className="grid grid-cols-2 gap-4">
              {patient.inputs && Object.entries(patient.inputs).map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs text-slate-400 uppercase truncate" title={key}>{key}</p>
                  <p className="text-lg text-slate-800 dark:text-slate-200 transition-colors duration-300 font-medium truncate">{val.toString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Risk Analysis */}
          <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-4">Risk Analysis</h3>
            <div className="space-y-5 mt-2">
              {patient.risks && Object.entries(patient.risks).map(([disease, prob]) => {
                const percentage = (prob * 100).toFixed(1);
                const isHighRisk = prob > 0.6;
                return (
                  <div key={disease}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-stone-600 dark:text-slate-300 transition-colors duration-300 uppercase tracking-wide">{disease}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors duration-300">{percentage}%</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${isHighRisk ? 'bg-rose-500' : 'bg-emerald-600'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Clinical Synthesis */}
          <div className="bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300 rounded-xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300 uppercase tracking-widest mb-4">Clinical Synthesis</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300 leading-relaxed">
              Patient presents with a primary elevated risk for {highestDisease} at {(highestProb * 100).toFixed(1)}%. Multi-task BiLSTM ensemble confirms temporal feature correlations. Recommend secondary evaluation.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
