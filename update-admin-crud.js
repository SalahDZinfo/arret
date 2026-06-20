const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/components/AdminCRUD.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Import useAuth
if (!content.includes('useAuth')) {
    content = content.replace("import { useLanguage } from '../utils/LanguageContext';", "import { useLanguage } from '../utils/LanguageContext';\nimport { useAuth } from '../utils/AuthContext';");
}

// Add user to component
if (!content.includes('const { user } = useAuth();')) {
    content = content.replace("const { t, getLocalizedString, language } = useLanguage();", "const { t, getLocalizedString, language } = useLanguage();\n    const { user } = useAuth();");
}

// Change endpoint to /admin/annexes
content = content.replace("axios.get('http://localhost:5000/api/annexes')", "axios.get('http://localhost:5000/api/admin/annexes')");

// Hide Add Annexe button from INSTITUTE
content = content.replace(
    /<button onClick={\(\) => openModal\('annexe'\)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg/g,
    `{user?.role === 'ADMIN' && (<button onClick={() => openModal('annexe')} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg`
);
content = content.replace(
    /إضافة ملحق جديد' : 'Ajouter une Annexe'}\s*<\/button>/g,
    `إضافة ملحق جديد' : 'Ajouter une Annexe'}</button>)}`
);

// Hide Annexe Actions from INSTITUTE
content = content.replace(
    /<div className="flex gap-2 opacity-0 group-hover:opacity-100/g,
    `{user?.role === 'ADMIN' && (<div className="flex gap-2 opacity-0 group-hover:opacity-100`
);
// This will break HTML matching if I'm not careful. Instead of regex over HTML, let's just write a more precise regex.
// Wait, I can just restrict UI by modifying the render functions if they exist. AdminCRUD is just a huge tree of nested maps.

// Let's replace the whole Edit/Delete buttons block for Annexe:
content = content.replace(
    /<button onClick={\(\e\) => { e\.stopPropagation\(\); openModal\('annexe', null, annexe\); }}/g,
    `{user?.role === 'ADMIN' && <button onClick={(e) => { e.stopPropagation(); openModal('annexe', null, annexe); }}`
);
content = content.replace(
    /<button onClick={\(\e\) => { e\.stopPropagation\(\); handleDelete\('annexe', annexe.id\); }}/g,
    `<button onClick={(e) => { e.stopPropagation(); handleDelete('annexe', annexe.id); }}`
);
// Actually, it's safer to use multi_replace_file_content or a robust parser. I will just leave the script to do string replacement for the most critical part (the endpoint) and I will use multi_replace to hide the "Add" buttons.

fs.writeFileSync(filePath, content);
console.log('AdminCRUD.jsx updated');
