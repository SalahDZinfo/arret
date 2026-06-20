const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseWordDocument } = require('../utils/parser');
const { Annexe, Exam, Subject, Domaine, Specialite } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Upload and Parse Documents
router.post('/upload', authMiddleware, adminMiddleware, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const parsedAnnexes = await parseWordDocument(req.file.buffer, req.file.originalname);
        const results = [];
        for (const parsedData of parsedAnnexes) {
            const annexe = await Annexe.create({ title: parsedData.title });
            const writtenExam = await Exam.create({
                title: 'الاختبارات الكتابية للقبول',
                type: 'written',
                annexeId: annexe.id
            });
            await Exam.create({
                title: 'المحادثة / المقابلة الشفهية',
                type: 'oral',
                content: '<p>محادثة مع أعضاء لجنة الامتحان في موضوع عام أو ذي علاقة بالتخصص بهدف تقييم قدرة المترشح على التواصل، ومهارته في التعبير، ومدى استعداده للقيام بالمهام المرتبطة بالرتبة.</p>',
                annexeId: annexe.id
            });
            for (const sub of parsedData.subjects) {
                const subject = await Subject.create({
                    title: sub.title,
                    is_common: sub.is_common,
                    content: sub.content,
                    examId: writtenExam.id
                });
                if (!sub.is_common && sub.domaines) {
                    for (const dom of sub.domaines) {
                        const domaine = await Domaine.create({ title: dom.title, subjectId: subject.id, userId: req.user.id });
                        if (dom.specialties) {
                            for (const spec of dom.specialties) {
                                await Specialite.create({
                                    title: spec.title,
                                    content: spec.content,
                                    domaineId: domaine.id
                                });
                            }
                        }
                    }
                }
            }
            results.push({ annexeId: annexe.id, title: annexe.title });
        }
        res.json({ message: 'Documents parsed and saved successfully', results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Assign Domaines to Institute (Admin only)
router.post('/admin/assign-domaines', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { instituteId, domaineIds } = req.body;
        if (!instituteId || !Array.isArray(domaineIds)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        
        // 1. Unassign all domains currently owned by this institute
        await Domaine.update({ userId: null }, { where: { userId: instituteId } });
        
        // 2. Assign the selected domains to this institute
        if (domaineIds.length > 0) {
            await Domaine.update({ userId: instituteId }, { where: { id: domaineIds } });
        }
        
        res.json({ message: 'Domaines assigned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get All Annexes (Public)
router.get('/annexes', async (req, res) => {
    try {
        const annexes = await Annexe.findAll({
            include: [
                {
                    model: Exam, as: 'exams',
                    include: [
                        {
                            model: Subject, as: 'subjects',
                            include: [
                                {
                                    model: Domaine, as: 'domaines',
                                    include: [{ model: Specialite, as: 'specialties' }]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        res.json(annexes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Admin/Institute Annexes (Filtered by Role)
router.get('/admin/annexes', authMiddleware, async (req, res) => {
    try {
        let domaineWhere = {};
        if (req.user.role === 'INSTITUTE') {
            domaineWhere = { userId: req.user.id };
        }

        const annexes = await Annexe.findAll({
            include: [
                {
                    model: Exam, as: 'exams',
                    include: [
                        {
                            model: Subject, as: 'subjects',
                            include: [
                                {
                                    model: Domaine, as: 'domaines',
                                    where: Object.keys(domaineWhere).length ? domaineWhere : undefined,
                                    required: req.user.role === 'INSTITUTE' ? false : false, // We still want subjects without domains maybe?
                                    // Actually, if we use where on include, it acts as INNER JOIN and hides subjects with NO matching domains.
                                    // We need to fetch all annexes/subjects, but only matching domains.
                                    // Sequelize: required: false makes it a LEFT JOIN
                                    required: false,
                                    include: [{ model: Specialite, as: 'specialties' }]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        res.json(annexes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- CRUD FOR ANNEXES (Admin Only) ---
router.post('/annexes', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const annexe = await Annexe.create(req.body);
        res.json(annexe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/annexes/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const annexe = await Annexe.findByPk(req.params.id);
        if (!annexe) return res.status(404).json({ error: 'Not found' });
        await annexe.update(req.body);
        res.json(annexe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/annexes/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const annexe = await Annexe.findByPk(req.params.id);
        if (!annexe) return res.status(404).json({ error: 'Not found' });
        await annexe.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD FOR EXAMS (Admin Only) ---
router.post('/exams', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const exam = await Exam.create(req.body);
        res.json(exam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/exams/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Not found' });
        await exam.update(req.body);
        res.json(exam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/exams/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Not found' });
        await exam.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD FOR SUBJECTS (Admin Only) ---
router.get('/subjects/reusable', async (req, res) => {
    try {
        const reusableSubjects = await Subject.findAll({
            where: { is_reusable: true },
            include: [{ model: Domaine, as: 'domaines', include: [{ model: Specialite, as: 'specialties' }] }]
        });
        res.json(reusableSubjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/exams/:id/clone-subject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { subjectId } = req.body;
        const targetExamId = req.params.id;
        const originalSubject = await Subject.findByPk(subjectId, {
            include: [{ model: Domaine, as: 'domaines', include: [{ model: Specialite, as: 'specialties' }] }]
        });
        if (!originalSubject) return res.status(404).json({ error: 'Original subject not found' });
        
        const newSubject = await Subject.create({
            title: originalSubject.title,
            is_common: originalSubject.is_common,
            is_reusable: false,
            content: originalSubject.content,
            examId: targetExamId
        });

        if (originalSubject.domaines && originalSubject.domaines.length > 0) {
            for (const dom of originalSubject.domaines) {
                const newDomaine = await Domaine.create({ title: dom.title, subjectId: newSubject.id });
                if (dom.specialties && dom.specialties.length > 0) {
                    for (const spec of dom.specialties) {
                        await Specialite.create({ title: spec.title, content: spec.content, domaineId: newDomaine.id });
                    }
                }
            }
        }
        res.json({ message: 'Subject cloned successfully', newSubjectId: newSubject.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/subjects', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.create(req.body);
        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/subjects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Not found' });
        await subject.update(req.body);
        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/subjects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Not found' });
        await subject.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD FOR DOMAINES (Admin & Institute) ---
router.post('/domaines', authMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (req.user.role === 'INSTITUTE') {
            payload.userId = req.user.id;
        }
        const domaine = await Domaine.create(payload);
        res.json(domaine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/domaines/:id', authMiddleware, async (req, res) => {
    try {
        const domaine = await Domaine.findByPk(req.params.id);
        if (!domaine) return res.status(404).json({ error: 'Not found' });
        // Optional: Ensure institute owns this domaine before updating
        if (req.user.role === 'INSTITUTE' && domaine.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await domaine.update(req.body);
        res.json(domaine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/domaines/:id', authMiddleware, async (req, res) => {
    try {
        const domaine = await Domaine.findByPk(req.params.id);
        if (!domaine) return res.status(404).json({ error: 'Not found' });
        if (req.user.role === 'INSTITUTE' && domaine.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await domaine.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD FOR SPECIALTIES (Admin & Institute) ---
router.post('/specialties', authMiddleware, async (req, res) => {
    try {
        // Optional: Check if Institute owns the Domaine
        if (req.user.role === 'INSTITUTE') {
            const domaine = await Domaine.findByPk(req.body.domaineId);
            if (!domaine || domaine.userId !== req.user.id) {
                return res.status(403).json({ error: 'Access denied to this domain' });
            }
        }

        const titles = req.body.title.split(/[,،]/).map(t => t.trim()).filter(t => t.length > 0);
        const createdSpecs = [];
        for (const title of titles) {
            const specialite = await Specialite.create({
                title: title,
                content: req.body.content,
                domaineId: req.body.domaineId
            });
            createdSpecs.push(specialite);
        }
        res.json(createdSpecs[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/specialties/:id', authMiddleware, async (req, res) => {
    try {
        const specialite = await Specialite.findByPk(req.params.id, { include: ['domaine'] });
        if (!specialite) return res.status(404).json({ error: 'Not found' });
        if (req.user.role === 'INSTITUTE' && specialite.domaine.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const additionalIds = Array.isArray(req.body.additionalIds) ? req.body.additionalIds.map(id => parseInt(id, 10)) : [];
        const content = req.body.content || '';
        const contentFr = req.body.contentFr || '';

        await specialite.update(req.body);

        // Update additional specialties if provided
        if (additionalIds.length > 0) {
            await Specialite.update(
                { content: content, contentFr: contentFr },
                { where: { id: additionalIds } }
            );
        }

        res.json(specialite);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/specialties/:id', authMiddleware, async (req, res) => {
    try {
        const specialite = await Specialite.findByPk(req.params.id, { include: ['domaine'] });
        if (!specialite) return res.status(404).json({ error: 'Not found' });
        if (req.user.role === 'INSTITUTE' && specialite.domaine.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await specialite.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
