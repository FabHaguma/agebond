import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// Available relationship types (simplified with gender-neutral terms)
export const RELATIONSHIP_TYPES = [
  'parent', 'child', 'sibling', 'spouse', 'partner',
  'grandparent', 'grandchild',
  'uncle', 'aunt', 'cousin', 'nephew', 'niece',
  'stepparent', 'stepchild', 'stepsibling',
  'in-law', 'friend', 'other'
];

// Gender options
export const GENDER_OPTIONS = ['Male', 'Female'];

// Start with empty family data - users create their own identity first
const initialFamilyData = [];

export const useFamilyStore = create(
  persist(
    (set, get) => ({
      family: initialFamilyData,
      
      // Migration function to add relationships to existing data
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
      
      // Migrate existing data to include relationships and gender
      migrateData: () => {
        set((state) => ({
          family: state.family.map((member) => ({
            ...member,
            relationship: member.relationship || (member.id === 'you' ? 'self' : 'other'),
            gender: member.gender || 'Male' // Default gender for existing members
          }))
        }));
      },
      
      addMember: (name, dob, relationship = 'other', gender = 'Male') => {
        // If trying to add a "self" person, ensure no other "self" exists
        if (relationship === 'self') {
          const existingSelf = get().family.find(member => member.relationship === 'self');
          if (existingSelf) {
            throw new Error('Only one person can have the "self" relationship. Please update the existing person instead.');
          }
        }
        
        const newMember = { id: uuidv4(), name, dob, relationship, gender, events: [] };
        set((state) => ({ family: [...state.family, newMember] }));
      },

      removeMember: (memberId) => {
        set((state) => ({
          family: state.family.filter((member) => member.id !== memberId),
        }));
      },

      addEvent: (memberId, title, date) => {
        set((state) => ({
          family: state.family.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  events: [...member.events, { id: uuidv4(), title, date }],
                }
              : member
          ),
        }));
      },

      removeEvent: (memberId, eventId) => {
        set((state) => ({
          family: state.family.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  events: member.events.filter((event) => event.id !== eventId),
                }
              : member
          ),
        }));
      },

      updateMemberRelationship: (memberId, relationship) => {
        // If trying to set someone as "self", ensure no other "self" exists
        if (relationship === 'self') {
          const existingSelf = get().family.find(member => member.relationship === 'self' && member.id !== memberId);
          if (existingSelf) {
            throw new Error('Only one person can have the "self" relationship. Please update the existing person instead.');
          }
        }
        
        set((state) => ({
          family: state.family.map((member) =>
            member.id === memberId
              ? { ...member, relationship }
              : member
          ),
        }));
      },

      updateMemberGender: (memberId, gender) => {
        set((state) => ({
          family: state.family.map((member) =>
            member.id === memberId
              ? { ...member, gender }
              : member
          ),
        }));
      },

      getMemberById: (id) => {
        return get().family.find(member => member.id === id);
      },

      getMainPerson: () => {
        return get().family.find(member => member.relationship === 'self');
      },

      hasMainPerson: () => {
        return get().family.some(member => member.relationship === 'self');
      },
    }),
    {
      name: 'agebond-family-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
        // Migrate data after rehydration
        if (state) {
          state.migrateData();
          state.setHasHydrated(true);
        }
      },
    }
  )
);