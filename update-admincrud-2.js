const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/components/AdminCRUD.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add additionalIds to formData
content = content.replace(
    /title: '', titleFr: '', type: 'written', is_common: false, is_reusable: false, content: '', contentFr: '' }/g,
    "title: '', titleFr: '', type: 'written', is_common: false, is_reusable: false, content: '', contentFr: '', additionalIds: [] }"
);

content = content.replace(
    /content: editData\.content \|\| '',\s*contentFr: editData\.contentFr \|\| ''\s*}/g,
    "content: editData.content || '',\n                contentFr: editData.contentFr || '',\n                additionalIds: []\n            }"
);

// 2. Find the current Domaine to get other specialties
content = content.replace(
    /const closeModal = \(\) => {/g,
    `
    const getCurrentDomaine = () => {
        if (modalConfig.type !== 'specialite' || !modalConfig.parentId) return null;
        for (const a of annexes) {
            for (const e of (a.exams || [])) {
                for (const s of (e.subjects || [])) {
                    for (const d of (s.domaines || [])) {
                        if (d.id === modalConfig.parentId) return d;
                    }
                }
            }
        }
        return null;
    };
    const closeModal = () => {`
);

// 3. Update the Modal UI to add checkboxes for additionalIds
const additionalUI = `
                                {(modalConfig.type === 'specialite' && modalConfig.editData) && (
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mt-4 mb-4">
                                        <label className="block text-sm font-bold text-slate-800 mb-2">نسخ هذا المحتوى إلى تخصصات أخرى في نفس المجال:</label>
                                        <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-200 bg-white p-2 rounded">
                                            {(() => {
                                                const d = getCurrentDomaine();
                                                if (!d || !d.specialties) return <div className="text-sm text-slate-500">لا توجد تخصصات أخرى.</div>;
                                                const otherSpecs = d.specialties.filter(s => s.id !== modalConfig.editData.id);
                                                if (otherSpecs.length === 0) return <div className="text-sm text-slate-500">لا توجد تخصصات أخرى.</div>;
                                                return otherSpecs.map(s => (
                                                    <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded text-primary focus:ring-primary"
                                                            checked={formData.additionalIds.includes(s.id)}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    setFormData({...formData, additionalIds: [...formData.additionalIds, s.id]});
                                                                } else {
                                                                    setFormData({...formData, additionalIds: formData.additionalIds.filter(id => id !== s.id)});
                                                                }
                                                            }}
                                                        />
                                                        {getLocalizedString(s, 'title')}
                                                    </label>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
`;
content = content.replace(
    /(\{\(modalConfig\.type === 'specialite' \|\| \(modalConfig\.type === 'subject' && formData\.is_common\) \|\| \(modalConfig\.type === 'exam' && formData\.type === 'oral'\)\) && \()/g,
    additionalUI + "\n$1"
);

// 4. Update the rendering of specialties to group and color code
const renderSpecialties = `
                                                                        {expanded[\`d-\${domaine.id}\`] && (
                                                                            <div className="p-2 space-y-1">
                                                                                {(() => {
                                                                                    if (!domaine.specialties || domaine.specialties.length === 0) return <div className="text-xs text-slate-400 ml-6 p-1">لا توجد تخصصات</div>;
                                                                                    
                                                                                    const emptySpecs = [];
                                                                                    const filledSpecsGroups = {};
                                                                                    
                                                                                    domaine.specialties.forEach(spec => {
                                                                                        if (!spec.content || spec.content.trim() === '') {
                                                                                            emptySpecs.push(spec);
                                                                                        } else {
                                                                                            const key = spec.content.trim();
                                                                                            if (!filledSpecsGroups[key]) filledSpecsGroups[key] = { titles: [], specs: [] };
                                                                                            filledSpecsGroups[key].titles.push(getLocalizedString(spec, 'title'));
                                                                                            filledSpecsGroups[key].specs.push(spec);
                                                                                        }
                                                                                    });

                                                                                    return (
                                                                                        <>
                                                                                            {Object.values(filledSpecsGroups).map((group, idx) => (
                                                                                                <div key={\`filled-\${idx}\`} className={\`flex items-center justify-between p-2 bg-green-50 rounded border border-green-200 \${language === 'ar' ? 'ml-6' : 'mr-6'}\`}>
                                                                                                    <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                                                                                        <BookOpen size={14} className="text-green-500" />
                                                                                                        {group.titles.join(' + ')}
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <button onClick={() => openModal('specialite', domaine.id, group.specs[0])} className="text-slate-400 hover:text-blue-500"><Edit2 size={14} /></button>
                                                                                                        <button onClick={() => handleDelete('specialite', group.specs[0].id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                            {emptySpecs.map(spec => (
                                                                                                <div key={\`empty-\${spec.id}\`} className={\`flex items-center justify-between p-2 bg-red-50 rounded border border-red-200 \${language === 'ar' ? 'ml-6' : 'mr-6'}\`}>
                                                                                                    <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                                                                                                        <BookOpen size={14} className="text-red-400" />
                                                                                                        {getLocalizedString(spec, 'title')}
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <button onClick={() => openModal('specialite', domaine.id, spec)} className="text-slate-400 hover:text-blue-500"><Edit2 size={14} /></button>
                                                                                                        <button onClick={() => handleDelete('specialite', spec.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
`;

content = content.replace(
    /\{expanded\[`d-\$\{domaine\.id\}`\] && \([\s\S]*?\{\(!domaine\.specialties \|\| domaine\.specialties\.length === 0\) && <div className="text-xs text-slate-400 ml-6 p-1">لا توجد تخصصات<\/div>\}\s*<\/div>\s*\)\}/g,
    renderSpecialties
);

fs.writeFileSync(filePath, content);
console.log("AdminCRUD updated successfully");
