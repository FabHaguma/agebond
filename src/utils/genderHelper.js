// Helper function to get gendered relationship terms
export function getGenderedRelationship(relationship, gender) {
  const genderMap = {
    'parent': { 'Male': 'father', 'Female': 'mother' },
    'child': { 'Male': 'son', 'Female': 'daughter' },
    'sibling': { 'Male': 'brother', 'Female': 'sister' },
    'grandparent': { 'Male': 'grandfather', 'Female': 'grandmother' },
    'grandchild': { 'Male': 'grandson', 'Female': 'granddaughter' },
    'stepparent': { 'Male': 'stepfather', 'Female': 'stepmother' },
    'stepchild': { 'Male': 'stepson', 'Female': 'stepdaughter' },
    'stepsibling': { 'Male': 'stepbrother', 'Female': 'stepsister' },
  };

  if (genderMap[relationship] && genderMap[relationship][gender]) {
    return genderMap[relationship][gender];
  }

  return relationship;
}

// Helper function to get the appropriate pronoun
export function getPronoun(gender, type = 'subject') {
  const pronouns = {
    'Male': {
      'subject': 'he',
      'object': 'him',
      'possessive': 'his'
    },
    'Female': {
      'subject': 'she',
      'object': 'her',
      'possessive': 'her'
    }
  };

  return pronouns[gender]?.[type] || 'they';
}

// Helper function to format relationship for display
export function formatRelationshipForDisplay(person) {
  if (!person.relationship || person.relationship === 'self') {
    return person.relationship === 'self' ? 'You' : 'Unknown';
  }

  const genderedRelationship = getGenderedRelationship(person.relationship, person.gender);
  return genderedRelationship.charAt(0).toUpperCase() + genderedRelationship.slice(1).replace('-', ' ');
}
