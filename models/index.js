const sequelize = require('../config/database');
const Annexe = require('./Annexe');
const Exam = require('./Exam');
const Subject = require('./Subject');
const Domaine = require('./Domaine');
const Specialite = require('./Specialite');
const User = require('./User');

// Define Relationships
Annexe.hasMany(Exam, { foreignKey: 'annexeId', as: 'exams', onDelete: 'CASCADE' });
Exam.belongsTo(Annexe, { foreignKey: 'annexeId', as: 'annexe' });

Exam.hasMany(Subject, { foreignKey: 'examId', as: 'subjects', onDelete: 'CASCADE' });
Subject.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

Subject.hasMany(Domaine, { foreignKey: 'subjectId', as: 'domaines', onDelete: 'CASCADE' });
Domaine.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

Domaine.hasMany(Specialite, { foreignKey: 'domaineId', as: 'specialties', onDelete: 'CASCADE' });
Specialite.belongsTo(Domaine, { foreignKey: 'domaineId', as: 'domaine' });

User.hasMany(Domaine, { foreignKey: 'userId', as: 'domaines' });
Domaine.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
    sequelize,
    Annexe,
    Exam,
    Subject,
    Domaine,
    Specialite,
    User
};
