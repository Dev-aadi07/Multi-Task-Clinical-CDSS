const fs = require('fs');

function applyDarkTheme(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // App.jsx specific
  content = content.replace('const [currentView, setCurrentView] = useState(\'assessment\');', 'const [currentView, setCurrentView] = useState(\'assessment\');\n  const [isDarkMode, setIsDarkMode] = useState(false);');
  content = content.replace('<Login onLogin={setCurrentDoctor} />', '<Login onLogin={setCurrentDoctor} isDarkMode={isDarkMode} />');
  content = content.replace('<div className=\"h-screen w-full overflow-hidden flex bg-stone-50 font-sans text-stone-800 relative\">', '<div className={\`h-screen w-full overflow-hidden flex bg-stone-50 dark:bg-slate-900 font-sans text-stone-800 dark:text-slate-200 relative transition-colors duration-300 ease-in-out \${isDarkMode ? \'dark\' : \'\'}\`}>');
  
  // Sidebar Dark Mode Toggle
  content = content.replace(
    '<div className=\"p-3 border-t border-slate-800\">\n          <div \n            onClick={() => { setCurrentDoctor(null); setCurrentView(\'assessment\'); }}', 
    '<div className=\"p-3 border-t border-slate-800\">\n          <button onClick={() => setIsDarkMode(!isDarkMode)} className=\"w-full flex items-center justify-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md font-medium text-sm transition-colors duration-300 mb-2\">\n            {isDarkMode ? \'☀ Light Mode\' : \'🌙 Dark Mode\'}\n          </button>\n          <div \n            onClick={() => { setCurrentDoctor(null); setCurrentView(\'assessment\'); }}'
  );

  // Global replacements
  content = content.replaceAll('bg-stone-50 ', 'bg-stone-50 dark:bg-slate-900 transition-colors duration-300 ');
  content = content.replaceAll('bg-stone-50\"', 'bg-stone-50 dark:bg-slate-900 transition-colors duration-300\"');
  content = content.replaceAll('bg-white border border-stone-200', 'bg-white border border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300');
  content = content.replaceAll('bg-white border-b border-stone-200', 'bg-white border-b border-stone-200 dark:bg-slate-800 dark:border-slate-700 transition-colors duration-300');
  content = content.replaceAll('text-slate-800', 'text-slate-800 dark:text-slate-200 transition-colors duration-300');
  content = content.replaceAll('text-stone-900', 'text-stone-900 dark:text-slate-100 transition-colors duration-300');
  content = content.replaceAll('text-slate-500', 'text-slate-500 dark:text-slate-400 transition-colors duration-300');
  content = content.replaceAll('text-stone-500', 'text-stone-500 dark:text-slate-400 transition-colors duration-300');
  content = content.replaceAll('text-stone-600', 'text-stone-600 dark:text-slate-300 transition-colors duration-300');
  content = content.replaceAll('text-slate-600', 'text-slate-600 dark:text-slate-300 transition-colors duration-300');
  
  // Inputs and dropdowns specific
  content = content.replaceAll('border-stone-300', 'border-stone-300 dark:border-slate-600 dark:text-slate-200');
  content = content.replaceAll('focus:bg-white', 'focus:bg-white dark:focus:bg-slate-800');
  content = content.replaceAll('focus:border-emerald-600', 'focus:border-emerald-600 dark:focus:border-emerald-500');
  
  // Secondary Buttons
  content = content.replaceAll('bg-stone-200 hover:bg-stone-300 text-slate-700', 'bg-stone-200 hover:bg-stone-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600');
  content = content.replaceAll('hover:bg-stone-100', 'hover:bg-stone-100 dark:hover:bg-slate-700');
  content = content.replaceAll('bg-stone-100', 'bg-stone-100 dark:bg-slate-700');
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
}

['src/App.jsx', 'src/Analytics.jsx', 'src/Login.jsx'].forEach(applyDarkTheme);

// Also need to wrap Login.jsx with the dark class conditional if we pass it as a prop
let loginContent = fs.readFileSync('src/Login.jsx', 'utf8');
loginContent = loginContent.replace('export default function Login({ onLogin }) {', 'export default function Login({ onLogin, isDarkMode }) {');
loginContent = loginContent.replace('<div className=\"h-screen w-full bg-stone-50 flex items-center justify-center font-sans text-stone-800 p-4 relative\">', '<div className={\`h-screen w-full bg-stone-50 dark:bg-slate-900 transition-colors duration-300 flex items-center justify-center font-sans text-stone-800 dark:text-slate-200 p-4 relative \${isDarkMode ? \\\'dark\\\' : \\\'\\\'}\`}>');
fs.writeFileSync('src/Login.jsx', loginContent);

// Add custom-variant dark to index.css
let indexCss = fs.readFileSync('src/index.css', 'utf8');
if (!indexCss.includes('@custom-variant dark')) {
  indexCss = indexCss.replace('@import \"tailwindcss\";', '@import \"tailwindcss\";\n\n@custom-variant dark (&:where(.dark, .dark *));');
  fs.writeFileSync('src/index.css', indexCss);
}
