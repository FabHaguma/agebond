# AgeBond - Family Age Relationship Calculator

AgeBond is a React-based web application that helps you explore and calculate family age relationships through time. Ask questions about when family members will be certain ages, compare ages at different life events, and understand the temporal connections between family members.

## Features

### 🧮 **Guided Mode**
Use pre-defined question templates to calculate:
- When someone will be a specific age
- Age comparisons between family members
- Ages at historical events
- Combined age scenarios

### ✨ **AI-Powered Natural Language Queries**
Ask any age-related question about your family in plain English:
- **Specific Calculations**: "When will I be the age my mom is now?"
- **Age Comparisons**: "What's the age difference between me and my siblings?"
- **Future Scenarios**: "How old will everyone be next Christmas?"
- **Family Insights**: "Who's the oldest/youngest in my family?"
- **Complex Queries**: "When will my and my sister's combined age equal mom's age?"
- **General Questions**: "How old will my dad be in 10 years?"

The AI intelligently chooses between template-based calculations for precision and open-ended responses for flexibility.

### 👨‍👩‍👧‍👦 **Family Management**
- Add family members with birth dates, relationships, and gender
- Simplified relationship types (parent, sibling, etc.) with gender context
- Track important life events
- Persistent data storage in browser

### 🔗 **Relationship-Aware AI**
- The app works from your perspective as the main person
- AI understands family relationships and gender for more natural responses
- Simplified relationship types combined with gender create precise context
- Use pronouns like "I", "me", "my mom", "my brother" in queries
- **Enhanced AI**: Can answer both structured calculations and open-ended age questions
- **Intelligent Routing**: Automatically chooses the best approach for each query type
- Relationship context makes responses more personal and meaningful

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd agebond
```

2. Install dependencies
```bash
npm install
```

3. **[Optional] Enable AI Features**
   - Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Copy `.env.example` to `.env`
   - Add your API key: `VITE_GEMINI_API_KEY=your_key_here`

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## First Time Setup

1. **Welcome Screen**: You'll see a welcome screen explaining AgeBond's features
2. **Add Yourself**: Start by adding your own information in the Family Panel
3. **Add Family**: Once you've added yourself, add other family members
4. **Start Calculating**: Use either Guided Mode or AI queries to explore age relationships

## Usage

### Adding Family Members
1. **Start with Yourself**: On first use, add yourself to establish your identity
2. **Add Family Members**: Use the Family Panel to add other family members
3. **Set Relationships & Gender**: Choose relationship type and gender for each person
4. **Edit Information**: Click on relationship or gender text to edit them later
5. Simplified relationships: parent, sibling, child, grandparent, cousin, etc.
6. Gender selection helps provide accurate context (Male/Female)
3. Optionally add life events with dates

### Asking Questions

**Guided Mode:**
1. Select a question template from the dropdown
2. Choose the relevant family members and events
3. Click "Find the Answer"

**AI Mode (requires API key):**
1. Switch to the "Ask AI ✨" tab
2. Type your question in natural language
3. Click "Ask AI ✨" to get your answer

## Example Queries

With the enhanced AI system, you can ask a wide variety of age-related questions:

### Template-Based Precision Queries
- "When will I be the age my mom is now?"
- "How old was I when my sister was born?"
- "When will I turn 30?"
- "When will my brother be the age my dad is now?"
- "When will my sister and I have the same combined age as my dad?"

### Open-Ended Family Questions
- "What's the age difference between me and my siblings?"
- "Who's the oldest person in my family?"
- "How old will everyone be next Christmas?"
- "What will my mom's age be when I turn 50?"
- "How many years apart are my parents?"
- "What are all the current ages in my family?"

### Complex Scenarios
- "When will I be twice my nephew's age?"
- "How old was my grandmother when my mom was born?"
- "What will be the average age of my family in 5 years?"

The AI automatically determines whether to use precise template calculations or provide conversational answers based on your question type.

## Technology Stack

- **Frontend:** React 18, Vite
- **State Management:** Zustand
- **AI Integration:** Google Gemini API
- **Styling:** CSS Modules
- **Date Calculations:** Custom calculation engine

## API Integration

The AI features use Google's Gemini API to parse natural language queries and map them to structured calculations. The system:

1. Analyzes your question using AI
2. Identifies relevant family members and events
3. Maps to appropriate calculation templates
4. Executes the calculation and returns a natural answer

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
