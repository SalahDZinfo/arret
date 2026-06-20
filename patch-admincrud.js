const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/components/AdminCRUD.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add state variables
const stateHookPos = content.indexOf('const [expanded, setExpanded] = useState({});');
const stateVars = `
    const [users, setUsers] = useState([]);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedInstituteId, setSelectedInstituteId] = useState('');
    const [assignedDomaineIds, setAssignedDomaineIds] = useState([]);
`;
content = content.slice(0, stateHookPos) + stateVars + '\n    ' + content.slice(stateHookPos);

// 2. Add fetchUsers and useEffect logic
const fetchDataPos = content.indexOf('const fetchData = () => {');
const fetchUsersLogic = `
    const fetchUsers = async () => {
        if (user?.role !== 'ADMIN') return;
        try {
            const res = await axios.get('http://localhost:5000/api/auth/users');
            setUsers(res.data.filter(u => u.role === 'INSTITUTE'));
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user]);

    const handleAssignModalOpen = () => {
        setAssignModalOpen(true);
        setSelectedInstituteId('');
        setAssignedDomaineIds([]);
    };

    const handleInstituteChange = (e) => {
        const id = e.target.value;
        setSelectedInstituteId(id);
        if (!id) {
            setAssignedDomaineIds([]);
            return;
        }
        
        // Find domains currently assigned to this user
        const assigned = [];
        annexes.forEach(a => {
            a.exams?.forEach(ex => {
                ex.subjects?.forEach(s => {
                    s.domaines?.forEach(d => {
                        if (d.userId === parseInt(id)) {
                            assigned.push(d.id);
                        }
                    });
                });
            });
        });
        setAssignedDomaineIds(assigned);
    };

    const handleAssignSubmit = async () => {
        if (!selectedInstituteId) return;
        try {
            await axios.post('http://localhost:5000/api/admin/assign-domaines', {
                instituteId: parseInt(selectedInstituteId),
                domaineIds: assignedDomaineIds
            });
            alert('تم إسناد المجالات بنجاح');
            setAssignModalOpen(false);
            fetchData(); // refresh the data to see ownership updates
        } catch (error) {
            console.error("Error assigning domaines", error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };
`;
content = content.slice(0, fetchDataPos) + fetchUsersLogic + '\n    ' + content.slice(fetchDataPos);

// 3. Add the Assign Button next to the "Add Annexe" button
const btnPos = content.indexOf('{user?.role === \'ADMIN\' && (');
if (btnPos !== -1) {
    const afterBtnPos = content.indexOf('<button onClick={() => openModal(\'annexe\')}', btnPos);
    const assignBtn = `
                    <button onClick={handleAssignModalOpen} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition ml-2">
                        <Folder size={18} /> إسناد المجالات للمعاهد
                    </button>
                    `;
    content = content.slice(0, afterBtnPos) + assignBtn + content.slice(afterBtnPos);
}

// 4. Add the AssignModal JSX at the end, right before the last closing div
const lastDivPos = content.lastIndexOf('</div>');
const assignModalJsx = `
            {/* Assign Domaines Modal */}
            {assignModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b flex justify-between items-center bg-purple-50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                                <Folder size={20} /> إسناد المجالات للمعاهد الجهوية
                            </h3>
                            <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">اختر المعهد الجهوي:</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    value={selectedInstituteId}
                                    onChange={handleInstituteChange}
                                >
                                    <option value="">-- اختر المعهد --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedInstituteId && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-800 border-b pb-2">اختر المجالات (Domaines) التي سيشرف عليها هذا المعهد:</h4>
                                    {annexes.map(annexe => (
                                        <div key={annexe.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                                            <h5 className="font-bold text-lg text-slate-700 mb-2 flex items-center gap-2">
                                                <FileText size={18} className="text-primary" /> {getLocalizedString(annexe, 'title')}
                                            </h5>
                                            <div className="pl-6 space-y-3">
                                                {annexe.exams?.filter(e => e.type === 'written').map(exam => (
                                                    <div key={exam.id}>
                                                        {exam.subjects?.filter(s => !s.is_common && s.domaines && s.domaines.length > 0).map(subject => (
                                                            <div key={subject.id} className="mb-3">
                                                                <div className="text-sm font-semibold text-blue-700 mb-1">{getLocalizedString(subject, 'title')}</div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-4 border-r-2 border-slate-200">
                                                                    {subject.domaines?.map(domaine => (
                                                                        <label key={domaine.id} className="flex items-center gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                                                            <input 
                                                                                type="checkbox"
                                                                                className="rounded text-purple-600 focus:ring-purple-500"
                                                                                checked={assignedDomaineIds.includes(domaine.id)}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        setAssignedDomaineIds(prev => [...prev, domaine.id]);
                                                                                    } else {
                                                                                        setAssignedDomaineIds(prev => prev.filter(id => id !== domaine.id));
                                                                                    }
                                                                                }}
                                                                            />
                                                                            {getLocalizedString(domaine, 'title')}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button onClick={() => setAssignModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">إلغاء</button>
                            <button onClick={handleAssignSubmit} disabled={!selectedInstituteId} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">حفظ التعيينات</button>
                        </div>
                    </div>
                </div>
            )}
`;

content = content.slice(0, lastDivPos) + assignModalJsx + '\n' + content.slice(lastDivPos);

fs.writeFileSync(targetFile, content);
console.log('AdminCRUD updated successfully with Assign Modal');
