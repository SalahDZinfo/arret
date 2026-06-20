const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/components/AdminCRUD.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Compute stats logic
const statsLogicPos = content.indexOf('return (');
const computeStatsLogic = `
    const instituteStats = React.useMemo(() => {
        if (!users || !annexes || user?.role !== 'ADMIN') return [];
        
        return users.filter(u => u.role === 'INSTITUTE').map(inst => {
            let totalSpecialties = 0;
            let filledSpecialties = 0;
            let totalDomaines = 0;

            annexes.forEach(a => {
                a.exams?.forEach(ex => {
                    ex.subjects?.forEach(s => {
                        s.domaines?.forEach(d => {
                            if (d.userId === inst.id) {
                                totalDomaines++;
                                d.specialties?.forEach(spec => {
                                    totalSpecialties++;
                                    const isEmpty = !spec.content || spec.content.trim() === '' || spec.content.trim() === '<p><br></p>' || spec.content.trim() === '<p></p>';
                                    if (!isEmpty) filledSpecialties++;
                                });
                            }
                        });
                    });
                });
            });

            const percentage = totalSpecialties === 0 ? 0 : Math.round((filledSpecialties / totalSpecialties) * 100);

            return {
                id: inst.id,
                name: inst.name,
                username: inst.username,
                totalSpecialties,
                filledSpecialties,
                totalDomaines,
                percentage
            };
        }).sort((a, b) => b.percentage - a.percentage);
    }, [users, annexes, user]);

`;

content = content.slice(0, statsLogicPos) + computeStatsLogic + content.slice(statsLogicPos);

// 2. Add UI above "إدارة الهيكلة"
const addHeaderPos = content.indexOf('<div className="flex justify-between items-center mb-6 border-t border-slate-100 pt-6">');
const statsUI = `
            {user?.role === 'ADMIN' && instituteStats.length > 0 && (
                <div className="mb-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" size={24} /> تقدم المعاهد الجهوية
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {instituteStats.map(stat => (
                            <div key={stat.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{stat.name}</h3>
                                        <div className="text-xs text-slate-500 font-mono">@{stat.username}</div>
                                    </div>
                                    <div className={\`px-2 py-1 rounded text-xs font-bold \${stat.percentage === 100 ? 'bg-green-100 text-green-700' : stat.percentage > 50 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}\`}>
                                        {stat.percentage}%
                                    </div>
                                </div>
                                
                                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
                                    <div className={\`h-2.5 rounded-full \${stat.percentage === 100 ? 'bg-green-500' : stat.percentage > 50 ? 'bg-blue-500' : 'bg-orange-500'}\`} style={{ width: \`\${stat.percentage}%\` }}></div>
                                </div>
                                
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500"/> {stat.filledSpecialties} / {stat.totalSpecialties} تخصص</span>
                                    <span className="flex items-center gap-1"><Folder size={12} className="text-purple-500"/> {stat.totalDomaines} مجالات</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
`;

content = content.slice(0, addHeaderPos) + statsUI + content.slice(addHeaderPos);

// We need to import TrendingUp and CheckCircle2 if they don't exist
if (!content.includes('TrendingUp')) {
    content = content.replace('import { Plus, Edit2, Trash2, Layers, Book, Search, PlusCircle, Check, X, FileText, ChevronDown, ChevronRight, Folder } from \'lucide-react\';', 
                              'import { Plus, Edit2, Trash2, Layers, Book, Search, PlusCircle, Check, X, FileText, ChevronDown, ChevronRight, Folder, TrendingUp, CheckCircle2 } from \'lucide-react\';');
}

fs.writeFileSync(targetFile, content);
console.log('AdminCRUD updated successfully with Institute Stats');
