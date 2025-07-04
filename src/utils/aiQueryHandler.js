import { GoogleGenerativeAI } from "@google/generative-ai";
import { format, parseISO, differenceInYears } from 'date-fns';
import { getGenderedRelationship } from './genderHelper.js';
import { getMainPerson } from './relationshipHelper.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not set in the .env file. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "DISABLED");

/**
 * Calculate current age based on date of birth
 */
function calculateAge(dob) {
  return differenceInYears(new Date(), parseISO(dob));
}

/**
 * Calculate age at a specific date
 */
function calculateAgeAtDate(dob, targetDate) {
  return differenceInYears(parseISO(targetDate), parseISO(dob));
}

/**
 * Create a comprehensive family context for AI
 */
function createFamilyContext(people) {
  const mainPerson = getMainPerson(people);
  if (!mainPerson) {
    throw new Error("Please add yourself to your family first before using AI queries.");
  }

  const familyInfo = people.map(person => {
    const currentAge = calculateAge(person.dob);
    const genderedRelationship = getGenderedRelationship(person.relationship, person.gender);
    const relationshipDisplay = person.relationship === 'self' ? 'yourself' : `your ${genderedRelationship}`;
    
    return {
      name: person.name,
      relationship: person.relationship,
      genderedRelationship,
      relationshipDisplay,
      gender: person.gender,
      dob: person.dob,
      currentAge,
      events: person.events.map(event => ({
        title: event.title,
        date: event.date,
        ageAtEvent: calculateAgeAtDate(person.dob, event.date)
      }))
    };
  });

  return {
    mainPerson: familyInfo.find(p => p.relationship === 'self'),
    family: familyInfo,
    totalMembers: people.length,
    currentDate: new Date().toISOString().split('T')[0]
  };
}

/**
 * Handle open-ended AI queries about family ages
 */
export async function handleOpenAIQuery(naturalQuery, people) {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured. The AI feature is disabled.");
  }

  const familyContext = createFamilyContext(people);
  
  const systemInstruction = `You are an expert family age calculator and relationship advisor. You help users understand age relationships within their family.

IMPORTANT CONTEXT:
- You are answering from the perspective of ${familyContext.mainPerson.name} (the main person)
- Use "you" when referring to the main person
- Use relationship context to make responses personal and natural
- Today's date is ${familyContext.currentDate}

CAPABILITIES:
1. Calculate current ages and age differences
2. Determine when someone will be a certain age
3. Compare ages at different points in time
4. Calculate ages at past or future events
5. Find when age relationships will be equal
6. Answer general age-related questions about family members

RESPONSE GUIDELINES:
- Be conversational and friendly
- Use relationship terms naturally (e.g., "your mom", "your brother")
- Provide specific dates when relevant
- Include current ages in parentheses for context
- If you need to make calculations, show your work briefly
- If a question is unclear, ask for clarification

CALCULATION HELPERS:
- Use the birth dates and current date to calculate exact ages
- Consider leap years for precise calculations
- When discussing future dates, use the format "On [Date], [person] will be [age]"`;

  const familyDataPrompt = `
## Family Information
Main Person: ${familyContext.mainPerson.name} (you) - Age ${familyContext.mainPerson.currentAge}, Born ${format(parseISO(familyContext.mainPerson.dob), 'MMMM d, yyyy')}

Family Members:
${familyContext.family.filter(p => p.relationship !== 'self').map(person => 
  `- ${person.name} (${person.relationshipDisplay}) - Age ${person.currentAge}, Born ${format(parseISO(person.dob), 'MMMM d, yyyy')}${person.events.length > 0 ? `\n  Events: ${person.events.map(e => `${e.title} on ${format(parseISO(e.date), 'MMMM d, yyyy')} (age ${e.ageAtEvent})`).join(', ')}` : ''}`
).join('\n')}

Current Date: ${format(new Date(), 'MMMM d, yyyy')}

## User's Question
"${naturalQuery}"

## Your Response
Answer the user's question naturally and conversationally. Provide specific calculations and dates when relevant.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(familyDataPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("I had trouble processing your question. Please try rephrasing it or check your internet connection.");
  }
}

/**
 * Determine if a query should use templates or open AI
 */
export function shouldUseTemplateBasedResponse(naturalQuery) {
  const query = naturalQuery.toLowerCase();
  
  // Specific patterns that strongly suggest template-based calculations
  const specificPatterns = [
    // Combined age calculations
    /combined age.*equal/i,
    /\b(when|at what)\b.*combined.*age.*equal/i,
    
    // Age comparison at specific events
    /how old.*was.*when.*event/i,
    /how old.*was.*at.*event/i,
    /age.*was.*at.*event/i,
    
    // "Same age as" comparisons
    /same age as/i,
    /the age.*was.*when/i,
    /the age.*is now/i,
    
    // When someone will be the age someone else was/is
    /when will.*be.*age.*was/i,
    /when will.*be.*age.*is now/i,
    
    // Specific event-based age queries
    /when.*turns? 18/i,
    /how old.*when.*turns? 18/i,
  ];
  
  // Check if query matches any specific template patterns
  const matchesSpecificPattern = specificPatterns.some(pattern => pattern.test(query));
  
  if (matchesSpecificPattern) {
    return true;
  }
  
  // Additional check: simple "when I am X how old will Y be" should NOT use templates
  // This type of question is better handled by open AI
  const simpleAgePattern = /when (i am|i'm).*how old will.*be/i;
  if (simpleAgePattern.test(query)) {
    return false;
  }
  
  // Fall back to open AI for most other queries
  return false;
}

/**
 * Enhanced AI query handler that tries templates first, then falls back to open AI
 */
export async function handleEnhancedAIQuery(naturalQuery, people, events, templates, parseNaturalLanguageQuery) {
  const shouldTryTemplate = shouldUseTemplateBasedResponse(naturalQuery);
  
  if (shouldTryTemplate) {
    try {
      // Try template-based approach first
      const aiResult = await parseNaturalLanguageQuery(naturalQuery, people, events, templates);
      const template = templates.find(t => t.id === aiResult.queryTemplateId);
      
      if (template) {
        // Flatten events from all family members
        const allEvents = people.reduce((acc, person) => {
          const personEvents = person.events.map(event => ({
            id: event.id,
            name: event.title || event.name,
            date: event.date,
            personId: person.id,
            personName: person.name
          }));
          return [...acc, ...personEvents];
        }, []);

        const result = await template.calculate(aiResult.params, people, allEvents);
        if (!result.error) {
          return { type: 'template', result: result.description };
        }
      }
    } catch (templateError) {
      console.log("Template approach failed, falling back to open AI:", templateError.message);
    }
  }
  
  // Fall back to open AI approach
  try {
    const openAIResult = await handleOpenAIQuery(naturalQuery, people);
    return { type: 'open', result: openAIResult };
  } catch (openAIError) {
    throw new Error(openAIError.message || 'I had trouble understanding your question. Please try rephrasing it.');
  }
}
