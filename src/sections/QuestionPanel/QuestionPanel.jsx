import { useState, useMemo } from 'react';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { useFamilyStore } from '../../store/familyStore';
import { QUERY_TEMPLATES } from '../../utils/queryTemplates';
import { parseNaturalLanguageQuery } from '../../utils/api';
import { handleEnhancedAIQuery } from '../../utils/aiQueryHandler';
import styles from './QuestionPanel.module.css';

export const QuestionPanel = () => {
  const family = useFamilyStore((state) => state.family);
  const [activeTab, setActiveTab] = useState('guided');
  const [selectedTemplateId, setSelectedTemplateId] = useState(QUERY_TEMPLATES[0].id);
  const [params, setParams] = useState({});
  const [naturalQuery, setNaturalQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const isAIEnabled = !!import.meta.env.VITE_GEMINI_API_KEY;

  const selectedTemplate = useMemo(() => 
    QUERY_TEMPLATES.find(q => q.id === selectedTemplateId), 
    [selectedTemplateId]
  );

  const handleParamChange = (paramName, value) => {
    setParams(prev => ({ ...prev, [paramName]: value }));
  };

  const handleFindAnswer = async () => {
    setIsLoading(true);
    setAnswer('');
    setError('');

    if (!selectedTemplate) {
      setError('Please select a question template.');
      setIsLoading(false);
      return;
    }

    try {
      // Flatten events from all family members
      const allEvents = family.reduce((acc, person) => {
        const personEvents = person.events.map(event => ({
          id: event.id,
          name: event.title || event.name,
          date: event.date,
          personId: person.id,
          personName: person.name
        }));
        return [...acc, ...personEvents];
      }, []);

      const result = await selectedTemplate.calculate(params, family, allEvents);
      if (result.error) {
        setError(result.error);
      } else {
        setAnswer(result.description);
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred during calculation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIQuery = async () => {
    setIsLoading(true);
    setAnswer('');
    setError('');

    if (!naturalQuery.trim()) {
      setError('Please enter a question.');
      setIsLoading(false);
      return;
    }

    // Check if API key is configured
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setError('AI features are not configured. Please add your Gemini API key to the .env file.');
      setIsLoading(false);
      return;
    }

    try {
      // Use the enhanced AI query handler
      const result = await handleEnhancedAIQuery(
        naturalQuery,
        family,
        [], // events will be flattened from family members in the handler
        QUERY_TEMPLATES,
        parseNaturalLanguageQuery
      );

      setAnswer(result.result);
    } catch (e) {
      console.error(e);
      setError(e.message || 'An error occurred while processing your question.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const isButtonDisabled = selectedTemplate?.params.some(p => !params[p]) || isLoading;

  const initialAnswer = `Ask any age-related question about your family! I can help you calculate ages, compare family members, find future dates, and much more. Try asking something like "How old will everyone be next Christmas?" or "What's the age gap between me and my siblings?"`

  return (
    <div className={styles.panelContainer}>
      <Card>
        <h2 className={styles.title}>Ask a Question</h2>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'guided' ? styles.active : ''}`}
            onClick={() => setActiveTab('guided')}
          >
            Guided
          </button>
          <button 
            className={`${styles.tab} ${styles.aiTab} ${activeTab === 'ai' ? styles.active : ''}`}
            onClick={() => setActiveTab('ai')}
            disabled={!isAIEnabled}
            title={!isAIEnabled ? "AI features require a Gemini API key" : ""}
          >
            Ask AI ✨ {!isAIEnabled && '(Disabled)'}
          </button>
        </div>

        <div className={styles.questionForm}>
          {activeTab === 'guided' ? (
            <>
              <label className={styles.label}>Question Template</label>
              <select 
                  className={styles.select}
                  value={selectedTemplateId}
                  onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setParams({}); // Reset params when template changes
                  }}
              >
                  {QUERY_TEMPLATES.map(q => <option key={q.id} value={q.id}>{q.description}</option>)} 
              </select>

              <div className={styles.personSelectorGrid}>
                  {selectedTemplate?.params.map(param => (
                      <div key={param}>
                          <label className={styles.label}>{param}</label>
                          {param.includes('event') ? (
                            <select className={styles.select} value={params[param] || ''} onChange={e => handleParamChange(param, e.target.value)}>
                                <option value="">Select an event...</option>
                                {family.flatMap(person => 
                                  person.events.map(event => (
                                    <option key={event.id} value={event.id}>
                                      {person.name}: {event.title}
                                    </option>
                                  ))
                                )}
                            </select>
                          ) : (
                            <select className={styles.select} value={params[param] || ''} onChange={e => handleParamChange(param, e.target.value)}>
                                <option value="">Select a person...</option>
                                {family.map(p => <option key={p.id} value={p.id}>{p.name}</option>)} 
                            </select>
                          )}
                      </div>
                  ))}
              </div>
              
              <div className={styles.buttonWrapper}>
                  <Button onClick={handleFindAnswer} disabled={isButtonDisabled}>
                      {isLoading ? 'Calculating...' : 'Find the Answer'}
                  </Button>
              </div>
            </>
          ) : (
            <>
              {!isAIEnabled ? (
                <div className={styles.disabledMessage}>
                  <h3>AI Features Disabled</h3>
                  <p>To enable AI features, please:</p>
                  <ol>
                    <li>Get a Gemini API key from Google AI Studio</li>
                    <li>Create a <code>.env</code> file in the project root</li>
                    <li>Add <code>VITE_GEMINI_API_KEY=your_key_here</code></li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              ) : (
                <>
                  <Input
                    label="Ask your question in natural language"
                    placeholder="e.g., How old will my mom be when I turn 40? or Who's the youngest in my family?"
                    value={naturalQuery}
                    onChange={(e) => setNaturalQuery(e.target.value)}
                    id="naturalQuery"
                  />
                  
                  <div className={styles.aiHelpText}>
                    <p>Ask any age-related question about your family:</p>
                    <ul>
                      <li>"When will I be 30 years old?"</li>
                      <li>"How old was Dad when Mom had my sister?"</li>
                      <li>"What's the age difference between me and my brother?"</li>
                      <li>"When will my sister be the age I am now?"</li>
                      <li>"How old will my mom be in 5 years?"</li>
                      <li>"When will my and my sister's combined age equal mom's age?"</li>
                      <li>"Who is the oldest person in my family?"</li>
                      <li>"What will everyone's ages be next Christmas?"</li>
                    </ul>
                    <p className={styles.aiNote}>
                      💡 The AI can answer both specific calculations and general age questions!
                    </p>
                  </div>
                  
                  <div className={styles.buttonWrapper}>
                      <Button onClick={handleAIQuery} disabled={!naturalQuery.trim() || isLoading}>
                          {isLoading ? 'Thinking...' : 'Ask AI ✨'}
                      </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      {(answer || isLoading || error) && (
        <Card className={styles.answerCard}>
            <p className={styles.answerLabel}>The Answer:</p>
            {isLoading && <div className={styles.loader}></div>}
            {error && <p className={styles.errorText}>{error}</p>}
            {answer && <p className={styles.answerText}>{answer}</p>}
        </Card>
      )}
       {!answer && !isLoading && !error && (
         <Card className={styles.answerCard}>
            <p className={styles.answerLabel}>The Answer:</p>
            <p className={styles.answerText}>{initialAnswer}</p>
        </Card>
       )}
    </div>
  );
};