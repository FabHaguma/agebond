import {
    calculateDateWhenPersonAIsAgeOfPersonBAtEvent,
    calculateDateWhenPersonWasAgePersonIsNow,
    calculateHowOldPersonWasWhenEventHappened,
    calculateWhenChildIsAgeParentIsNow,
    calculateWhenPersonIsAge,
    calculateWhenCombinedAgeEqualsPersonAge,
} from './calculationEngine';

export const QUERY_TEMPLATES = [
    {
        id: 'personA_is_age_personB_was_at_eventB',
        category: 'Direct Age Comparisons',
        description: 'When will [Person A] be the age [Person B] was at [Event B]?',
        params: ['personA', 'personB', 'eventB'],
        calculate: calculateDateWhenPersonAIsAgeOfPersonBAtEvent,
    },
    {
        id: 'personA_was_age_personB_is_now',
        category: 'Direct Age Comparisons',
        description: 'When was [Person A] the age [Person B] is now?',
        params: ['personA', 'personB'],
        calculate: calculateDateWhenPersonWasAgePersonIsNow,
    },
    {
        id: 'personA_age_at_eventB',
        category: 'Direct Age Comparisons',
        description: 'How old was [Person A] at [Event B]?',
        params: ['personA', 'eventB'],
        calculate: calculateHowOldPersonWasWhenEventHappened,
    },
    {
        id: 'child_is_age_parent_is_now',
        category: 'Future Projections',
        description: 'When will [Person A] be the age [Person B] is now?',
        params: ['personA', 'personB'],
        calculate: calculateWhenChildIsAgeParentIsNow,
    },
    {
        id: 'when_personA_turns_18',
        category: 'Future Projections',
        description: 'When will [Person A] turn 18?',
        params: ['personA'],
        calculate: (p, ppl, ev) => calculateWhenPersonIsAge({ ...p, age: '18' }, ppl, ev),
    },
    {
        id: 'how_old_personB_when_personA_turns_18',
        category: 'Future Projections',
        description: 'How old will [Person B] be when [Person A] turns 18?',
        params: ['personA', 'personB'],
        calculate: async (params, people, events) => {
            const turn18Result = await calculateWhenPersonIsAge({ ...params, age: '18' }, people, events);
            if (turn18Result.error || !turn18Result.date) return turn18Result;
            
            const eventB = {
                id: 'temp_event',
                personId: params.personA,
                name: `${people.find(p=>p.id===params.personA)?.name} turns 18`,
                date: turn18Result.date.toISOString().split('T')[0]
            };
            return calculateHowOldPersonWasWhenEventHappened({personA: params.personB, eventB: 'temp_event'}, people, [...events, eventB]);
        },
    },
    {
        id: 'combined_AB_equals_C',
        category: 'Combined Age Dynamics',
        description: "When will [Person A]'s and [Person B]'s combined ages equal [Person C]'s age?",
        params: ['personA', 'personB', 'personC'],
        calculate: calculateWhenCombinedAgeEqualsPersonAge,
    },
];
