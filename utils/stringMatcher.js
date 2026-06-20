/**
 * stringMatcher.js
 * Utility to perform fuzzy matching on Arabic strings.
 * It normalizes Alef, Taa Marbouta, Yaa, and removes extra spaces.
 */

function normalizeArabic(text) {
    if (!text) return '';
    return text
        .trim()
        .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics
        .replace(/[أإآا]/g, 'ا') // Normalize Alef
        .replace(/[ةه]/g, 'ه') // Normalize Taa Marbouta
        .replace(/[ىي]/g, 'ي') // Normalize Yaa/Alef Maksoura
        .replace(/\s+/g, ' ') // Remove extra spaces
        .toLowerCase(); // Just in case of latin characters
}

/**
 * Checks if two strings are fuzzy equal.
 */
function isFuzzyMatch(str1, str2) {
    if (!str1 || !str2) return false;
    const norm1 = normalizeArabic(str1);
    const norm2 = normalizeArabic(str2);
    return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1);
}

module.exports = {
    normalizeArabic,
    isFuzzyMatch
};
