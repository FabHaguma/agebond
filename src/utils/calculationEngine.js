// import { parseISO, differenceInYears, addYears, format, differenceInDays } from 'date-fns';

// --- UTILITY FUNCTIONS ---

const parseDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
        throw new Error('Invalid date string provided');
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const getAgeAtDate = (birthDate, targetDate) => {
    const age = targetDate.getUTCFullYear() - birthDate.getUTCFullYear();
    const m = targetDate.getUTCMonth() - birthDate.getUTCMonth();
    if (m < 0 || (m === 0 && targetDate.getUTCDate() < birthDate.getUTCDate())) {
        return age - 1;
    }
    return age;
};

const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const getPerson = (id, people) => people.find(p => p.id === id);
const getEvent = (id, events) => events.find(e => e.id === id);


// --- CALCULATION FUNCTIONS ---

export const calculateDateWhenPersonAIsAgeOfPersonBAtEvent = async (params, people, events) => {
    const { personA, personB, eventB } = params;
    if (!personA || !personB || !eventB) return { description: "", error: "Missing information. Please select all required fields." };

    const pA = getPerson(personA, people);
    const pB = getPerson(personB, people);
    const evB = getEvent(eventB, events);

    if (!pA || !pB || !evB) return { description: "", error: "Could not find one of the selected people or events." };
    if (!pA.dob || !pB.dob || !evB.date) return { description: "", error: "Missing birth date or event date information." };

    try {
        const birthDateA = parseDate(pA.dob);
        const birthDateB = parseDate(pB.dob);
        const eventDateB = parseDate(evB.date);

        const ageOfBAtEvent = getAgeAtDate(birthDateB, eventDateB);

        const targetDate = new Date(birthDateA);
        targetDate.setUTCFullYear(targetDate.getUTCFullYear() + ageOfBAtEvent);
        
        // check if day/month is correct
        const ageCheck = getAgeAtDate(birthDateA, targetDate);
        if(ageCheck !== ageOfBAtEvent) {
             // for leap years etc.
             targetDate.setUTCFullYear(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate() + (ageOfBAtEvent-ageCheck)*365)
        }

        return {
            date: targetDate,
            age: ageOfBAtEvent,
            description: `${pA.name} will be ${ageOfBAtEvent}, the age ${pB.name} was at the event "${evB.name}", on ${formatDate(targetDate)}.`,
        };
    } catch (error) {
        console.error("Error calculating date when person A is age of person B at event:", error);
        return { description: "", error: "Invalid date format in birth dates or event date." };
    }
};

export const calculateDateWhenPersonWasAgePersonIsNow = async (params, people) => {
    const { personA, personB } = params;
    if (!personA || !personB) return { description: "", error: "Please select both people." };

    const pA = getPerson(personA, people);
    const pB = getPerson(personB, people);
    if (!pA || !pB) return { description: "", error: "Could not find person." };
    if (!pA.dob || !pB.dob) return { description: "", error: "One or more selected people do not have a birth date set." };

    try {
        const birthDateA = parseDate(pA.dob);
        const birthDateB = parseDate(pB.dob);
        const today = new Date();

        const ageOfBNow = getAgeAtDate(birthDateB, today);
        
        const targetDate = new Date(birthDateA);
        targetDate.setUTCFullYear(targetDate.getUTCFullYear() + ageOfBNow);

        return {
            date: targetDate,
            age: ageOfBNow,
            description: `${pA.name} was (or will be) ${ageOfBNow}, the age ${pB.name} is now, on ${formatDate(targetDate)}.`,
        };
    } catch (error) {
        console.error("Error calculating when person was age:", error);
        return { description: "", error: "Invalid birth date format for one or more selected people." };
    }
};


export const calculateHowOldPersonWasWhenEventHappened = async (params, people, events) => {
    const { personA, eventB } = params;
    if (!personA || !eventB) return { description: "", error: "Please select a person and an event." };
    
    const pA = getPerson(personA, people);
    const evB = getEvent(eventB, events);

    if(!pA || !evB) return { description: "", error: "Could not find person or event." };
    if (!pA.dob || !evB.date) return { description: "", error: "Missing birth date or event date information." };

    try {
        const personBirthDate = parseDate(pA.dob);
        const eventDate = parseDate(evB.date);

        const age = getAgeAtDate(personBirthDate, eventDate);
        
        return {
            age,
            date: eventDate,
            description: `${pA.name} was ${age} years old at the event "${evB.name}".`
        };
    } catch (error) {
        console.error("Error calculating age at event:", error);
        return { description: "", error: "Invalid date format in birth date or event date." };
    }
};

export const calculateWhenPersonIsAge = async (params, people) => {
    const { personA, age } = params;
    if (!personA || !age) return { description: "", error: "Please select a person and provide an age." };

    const pA = getPerson(personA, people);
    if (!pA) return { description: "", error: "Could not find person." };
    if (!pA.dob) return { description: "", error: "Selected person does not have a birth date set." };

    try {
        const birthDate = parseDate(pA.dob);
        const targetAge = parseInt(age, 10);
        
        const targetDate = new Date(birthDate);
        targetDate.setUTCFullYear(targetDate.getUTCFullYear() + targetAge);

        return {
            date: targetDate,
            age: targetAge,
            description: `${pA.name} will turn ${targetAge} on ${formatDate(targetDate)}.`
        };
    } catch (error) {
        console.error("Error calculating when person is age:", error);
        return { description: "", error: "Invalid birth date format for selected person." };
    }
};

export const calculateWhenChildIsAgeParentIsNow = async (params, people) => {
    const { personA, personB } = params; // A is child, B is parent
    if (!personA || !personB) return { description: "", error: "Please select both people." };

    const pA = getPerson(personA, people);
    const pB = getPerson(personB, people);
    if (!pA || !pB) return { description: "", error: "Could not find person." };
    if (!pA.dob || !pB.dob) return { description: "", error: "One or more selected people do not have a birth date set." };

    try {
        const birthDateA = parseDate(pA.dob);
        const birthDateB = parseDate(pB.dob);
        const today = new Date();
        
        const ageOfBNow = getAgeAtDate(birthDateB, today);
        
        const targetDate = new Date(birthDateA);
        targetDate.setUTCFullYear(targetDate.getUTCFullYear() + ageOfBNow);

        return {
            date: targetDate,
            age: ageOfBNow,
            description: `${pA.name} will be the age ${pB.name} is now (${ageOfBNow}) on ${formatDate(targetDate)}.`,
        };
    } catch (error) {
        console.error("Error calculating when child is age parent is now:", error);
        return { description: "", error: "Invalid birth date format for one or more selected people." };
    }
}


export const calculateWhenCombinedAgeEqualsPersonAge = async (params, people) => {
    const { personA, personB, personC } = params;
    if (!personA || !personB || !personC) return { description: "", error: "Please select all three people." };
    
    const pA = getPerson(personA, people);
    const pB = getPerson(personB, people);
    const pC = getPerson(personC, people);
    if (!pA || !pB || !pC) return { description: "", error: "Could not find person." };
    if (!pA.dob || !pB.dob || !pC.dob) return { description: "", error: "One or more selected people do not have a birth date set." };
    
    try {
        const bdA = parseDate(pA.dob).getTime();
        const bdB = parseDate(pB.dob).getTime();
        const bdC = parseDate(pC.dob).getTime();

        // Let D be the target date's timestamp.
        // (D - bdA)/ms_per_year + (D - bdB)/ms_per_year = (D - bdC)/ms_per_year
        // D - bdA + D - bdB = D - bdC
        // D = bdA + bdB - bdC
        
        const targetTimestamp = bdA + bdB - bdC;
        const targetDate = new Date(targetTimestamp);
        
        if (targetDate.getTime() < Math.max(bdA, bdB, bdC)) {
            return { description: "", error: "This combination of ages is not possible in the future." };
        }

        const ageA = getAgeAtDate(parseDate(pA.dob), targetDate);
        const ageB = getAgeAtDate(parseDate(pB.dob), targetDate);
        const ageC = getAgeAtDate(parseDate(pC.dob), targetDate);

        return {
            date: targetDate,
            description: `On ${formatDate(targetDate)}, ${pA.name} (${ageA}) and ${pB.name} (${ageB}) will have a combined age of ${ageA + ageB}, which is the age ${pC.name} will be (${ageC}).`
        };
    } catch (error) {
        console.error("Error calculating combined age:", error);
        return { description: "", error: "Invalid birth date format for one or more selected people." };
    }
};