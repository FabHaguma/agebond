import { GoogleGenerativeAI } from "@google/generative-ai";
import { format, parseISO } from 'date-fns';
import { createRelationshipContext, getMainPerson } from './relationshipHelper.js';
import { getGenderedRelationship } from './genderHelper.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not set in the .env file. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "DISABLED");

export async function getCombinedAgeAnswer({ people, result }) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const formattedDate = format(parseISO(result.targetDate), 'MMMM d, yyyy');
    const mainPerson = getMainPerson(people);

    // Convert person references to be from the main person's perspective
    const getPersonReference = (person) => {
        if (person.id === mainPerson?.id) {
            return 'you';
        }
        const genderedRelationship = getGenderedRelationship(person.relationship, person.gender);
        if (person.relationship && person.relationship !== 'other' && person.relationship !== 'self') {
            return `your ${genderedRelationship} ${person.name}`;
        }
        return person.name;
    };

    const prompt = `
        ${createRelationshipContext(people)}
        
        Based on the following data, create a friendly, one-sentence answer from the perspective of the main person.
        - The question is: "When will Person A's and Person B's combined ages equal Person C's age?"
        - Person A is ${getPersonReference(people.personA)}
        - Person B is ${getPersonReference(people.personB)}
        - Person C is ${getPersonReference(people.personC)}
        - The calculated date is ${formattedDate}.
        - On that date, ${people.personA.name}'s age will be ${result.ageA}.
        - On that date, ${people.personB.name}'s age will be ${result.ageB}.
        - On that date, ${people.personC.name}'s age will be ${result.ageC}.
        - The combined age of A and B will be ${result.ageA + result.ageB}.

        Make the response personal and natural, using relationship context when possible.
        Example format: "On November 27, 2022, you (32) and your younger sister (28) will have a combined age of 60, which is the age your mom will be (60)."
        Keep it concise and natural.
    `;

    try {
        const generationResult = await model.generateContent(prompt);
        const response = await generationResult.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Sorry, I couldn't generate an answer right now. Please check your API key and connection.";
    }
}

export async function parseNaturalLanguageQuery(
    naturalLanguageQuery,
    people,
    events,
    templates
) {
    if (!API_KEY) {
        throw new Error("Gemini API key is not configured. The AI feature is disabled.");
    }
    
    // Check if there's a main person
    const mainPerson = getMainPerson(people);
    if (!mainPerson) {
        throw new Error("Please add yourself to your family first before using AI queries.");
    }
    
    // Flatten all events from all people into a single array with person context
    const allEvents = people.reduce((acc, person) => {
        const personEvents = person.events.map(event => ({
            id: event.id,
            name: event.title || event.name,
            date: event.date,
            personId: person.id,
            personName: person.name,
            personRelationship: person.relationship
        }));
        return [...acc, ...personEvents];
    }, []);
    
    const simplifiedTemplates = templates.map(t => ({
        id: t.id,
        description: t.description,
        params: t.params,
    }));

    const systemInstruction = `You are an expert system that converts a natural language question about family age relationships into a structured JSON object.
Your goal is to identify the correct query template and fill in the parameters based on the user's question and the provided family data.

IMPORTANT: This system works from the perspective of the main person (relationship: 'self'). When the user uses pronouns like "I", "me", "my", they refer to this main person.

1.  **Analyze the User's Question**: Understand the user's intent and perspective.
2.  **Match to a Template**: Choose the best 'queryTemplateId' from the provided list that matches the user's question structure.
3.  **Identify Entities**: Find the names of the people and events mentioned in the question. Consider relationship context (e.g., "my mom", "my sister").
4.  **Map to IDs**: Match the identified names to their corresponding IDs from the 'Family Data'. For pronouns like "I" or "me", use the person with relationship 'self'.
5.  **Populate Parameters**: Fill the 'params' object with the correct IDs. The keys for the params (e.g., 'personA', 'personB', 'eventB') must match the 'params' array of the chosen template.
6.  **Return JSON**: Output only the final JSON object, nothing else.

The JSON output must strictly follow this structure:
{
  "queryTemplateId": "string",
  "params": {
    "personA": "string | null",
    "personB": "string | null",
    "personC": "string | null",
    "eventA": "string | null",
    "eventB": "string | null"
  }
}`;

    const prompt = `
## Context
${createRelationshipContext(people)}

## Query Templates
${JSON.stringify(simplifiedTemplates, null, 2)}

## Family Data
- People: ${JSON.stringify(people.map(p => ({ 
    id: p.id, 
    name: p.name, 
    dob: p.dob, 
    relationship: p.relationship,
    gender: p.gender,
    genderedRelationship: getGenderedRelationship(p.relationship, p.gender)
})), null, 2)}
- Events: ${JSON.stringify(allEvents, null, 2)}

## Main Person
The main person is: ${getMainPerson(people)?.name || 'You'}

## User's Question
"${naturalLanguageQuery}"

## Instructions
When processing the question, remember:
- "I", "me", "my" refer to the main person
- Relationship terms like "my mom", "my sister" should be matched to people with those relationship types
- Consider both explicit names and relationship references

## JSON Output
`;

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-preview-04-17",
            systemInstruction: systemInstruction,
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        let jsonStr = result.response.text().trim();
        
        // Remove markdown code fences if present
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr);

        // Basic validation
        if (!parsedData.queryTemplateId || !parsedData.params) {
            throw new Error("Invalid JSON structure returned from AI.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error calling Gemini API or parsing response:", error);
        throw new Error("I had trouble understanding that question. Please try rephrasing it or use the Guided mode.");
    }
}