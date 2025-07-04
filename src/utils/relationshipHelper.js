// Helper functions for relationship-aware natural language processing

export const RELATIONSHIP_SYNONYMS = {
    'self': ['I', 'me', 'myself'],
    'parent': ['parent', 'mom', 'mama', 'maman', 'mum', 'mummy', 'mother', 'dad', 'papa', 'daddy', 'father'],
    'child': ['child', 'kid', 'son', 'boy', 'daughter', 'girl'],
    'sibling': ['sibling', 'brother', 'bro', 'sister', 'sis'],
    'spouse': ['spouse', 'wife', 'husband', 'partner'],
    'grandparent': ['grandparent', 'grandma', 'grandmother', 'granny', 'nana', 'grandpa', 'grandfather', 'granddad'],
    'grandchild': ['grandchild', 'grandson', 'granddaughter'],
    'uncle': ['uncle'],
    'aunt': ['aunt', 'auntie'],
    'cousin': ['cousin'],
    'nephew': ['nephew'],
    'niece': ['niece'],
};

export const POSSESSIVE_PRONOUNS = {
    'my': 'self',
    'our': 'self', // Could be ambiguous, but assume referring to self
};

/**
 * Extract relationship mentions from natural language text
 * @param {string} text - The input text
 * @returns {Array} Array of found relationship mentions
 */
export function extractRelationshipMentions(text) {
    const mentions = [];
    const lowerText = text.toLowerCase();
    
    // Look for possessive patterns like "my mom", "my sister"
    const possessivePattern = /\b(my|our)\s+(\w+)\b/g;
    let match;
    
    while ((match = possessivePattern.exec(lowerText)) !== null) {
        const possessive = match[1];
        const relationshipTerm = match[2];
        
        // Find matching relationship type
        for (const [relType, synonyms] of Object.entries(RELATIONSHIP_SYNONYMS)) {
            if (synonyms.includes(relationshipTerm)) {
                mentions.push({
                    type: relType,
                    originalText: match[0],
                    isPersonal: possessive === 'my'
                });
                break;
            }
        }
    }
    
    // Look for direct relationship mentions
    for (const [relType, synonyms] of Object.entries(RELATIONSHIP_SYNONYMS)) {
        for (const synonym of synonyms) {
            const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
            if (regex.test(text)) {
                mentions.push({
                    type: relType,
                    originalText: synonym,
                    isPersonal: false
                });
            }
        }
    }
    
    return mentions;
}

/**
 * Find person by relationship type
 * @param {Array} people - Array of people
 * @param {string} relationshipType - The relationship type to find
 * @returns {Object|null} The person with that relationship, or null
 */
export function findPersonByRelationship(people, relationshipType) {
    return people.find(person => person.relationship === relationshipType) || null;
}

/**
 * Get the main person (self)
 * @param {Array} people - Array of people
 * @returns {Object|null} The main person, or null
 */
export function getMainPerson(people) {
    return people.find(person => person.relationship === 'self') || null;
}

/**
 * Create relationship context for AI prompts
 * @param {Array} people - Array of people
 * @returns {string} Formatted relationship context
 */
export function createRelationshipContext(people) {
    const mainPerson = getMainPerson(people);
    if (!mainPerson) return '';
    
    const relationshipMap = people
        .filter(person => person.id !== mainPerson.id)
        .map(person => `${person.name} is your ${person.relationship || 'family member'}`)
        .join(', ');
    
    return `You are ${mainPerson.name}. ${relationshipMap}.`;
}

/**
 * Enhanced relationship information for AI context
 * @param {Array} people - Array of people
 * @returns {Object} Enhanced context object
 */
export function getEnhancedRelationshipContext(people) {
    const mainPerson = getMainPerson(people);
    const relationships = {};
    
    people.forEach(person => {
        if (person.relationship && person.relationship !== 'self') {
            if (!relationships[person.relationship]) {
                relationships[person.relationship] = [];
            }
            relationships[person.relationship].push(person);
        }
    });
    
    return {
        mainPerson,
        relationships,
        totalPeople: people.length,
        relationshipTypes: Object.keys(relationships)
    };
}
