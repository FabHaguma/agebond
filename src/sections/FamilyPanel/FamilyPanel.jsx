import { useState, useEffect } from 'react';
import { useFamilyStore, RELATIONSHIP_TYPES, GENDER_OPTIONS } from '../../store/familyStore';
import { Card } from '../../components/Card/Card';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import { PlusIcon } from '../../components/PlusIcon/PlusIcon';
import styles from './FamilyPanel.module.css';
import { format, parseISO } from 'date-fns';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
    </svg>
);

const ChevronIcon = ({ isExpanded }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      fill="currentColor" 
      viewBox="0 0 16 16"
      style={{ 
        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease'
      }}
    >
      <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
    </svg>
);


export const FamilyPanel = () => {
  const { family, addMember, removeMember, addEvent, removeEvent, updateMemberRelationship, updateMemberGender, hasMainPerson } = useFamilyStore();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [relationship, setRelationship] = useState('other');
  const [gender, setGender] = useState('Male');
  const [addingEventFor, setAddingEventFor] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [editingRelationship, setEditingRelationship] = useState(null);
  const [editingGender, setEditingGender] = useState(null);
  const [error, setError] = useState('');
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(true);
  const [expandedMembers, setExpandedMembers] = useState(new Set());

  const mainPersonExists = hasMainPerson();
  
  const toggleMemberExpanded = (memberId) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };
  
  // If no main person exists, default to "self" for new members
  useEffect(() => {
    if (!mainPersonExists && relationship !== 'self') {
      setRelationship('self');
    } else if (mainPersonExists && relationship === 'self') {
      setRelationship('other');
    }
  }, [mainPersonExists, relationship]);

  // Auto-expand the form for first-time users
  useEffect(() => {
    if (!mainPersonExists) {
      setIsAddFormExpanded(true);
    }
  }, [mainPersonExists]);

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (name && dob) {
      try {
        addMember(name, dob, relationship, gender);
        setName('');
        setDob('');
        setRelationship(mainPersonExists ? 'other' : 'self');
        setGender('Male');
        setError('');
        
        // Collapse the form after adding someone if there are already family members
        if (family.length > 0) {
          setIsAddFormExpanded(false);
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (newEventTitle.trim() && newEventDate && addingEventFor) {
      addEvent(addingEventFor, newEventTitle, newEventDate);
      setNewEventTitle('');
      setNewEventDate('');
      setAddingEventFor(null);
    }
  };

  return (
    <Card>
      <h2 className={styles.title}>Family & Events</h2>
      
      {/* Collapsible Add Form Section */}
      <div className={styles.addSection}>
        <button 
          className={styles.addSectionHeader}
          onClick={() => setIsAddFormExpanded(!isAddFormExpanded)}
          type="button"
        >
          <h3 className={styles.subtitle}>
            {!mainPersonExists ? 'First, Add Yourself' : 'Add a Family Member'}
          </h3>
          <ChevronIcon isExpanded={isAddFormExpanded} />
        </button>
        
        {isAddFormExpanded && (
          <form onSubmit={handleAddPerson} className={styles.addForm}>
            {error && <div className={styles.error}>{error}</div>}
            <Input 
              label="Name" 
              id="name"
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={!mainPersonExists ? "Your name" : "e.g., Muzehe Joe"}
              required
            />
            <Input 
              label="Date of Birth"
              id="dob"
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)}
              required
            />
            <div className={styles.inputGroup}>
              <label htmlFor="relationship" className={styles.label}>
                {!mainPersonExists ? 'This is you' : 'Relationship to You'}
              </label>
              <select 
                id="relationship"
                value={relationship} 
                onChange={(e) => setRelationship(e.target.value)}
                className={styles.select}
                disabled={!mainPersonExists} // Disable when adding the first person (must be self)
              >
                {!mainPersonExists ? (
                  <option value="self">Yourself</option>
                ) : (
                  RELATIONSHIP_TYPES.filter(rel => rel !== 'self').map((rel) => (
                    <option key={rel} value={rel}>
                      {rel.charAt(0).toUpperCase() + rel.slice(1).replace('-', ' ')}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="gender" className={styles.label}>Gender</label>
              <select 
                id="gender"
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className={styles.select}
              >
                {GENDER_OPTIONS.map((genderOption) => (
                  <option key={genderOption} value={genderOption}>
                    {genderOption}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">
              {!mainPersonExists ? 'Create Your Profile' : 'Add Person'}
            </Button>
          </form>
        )}
      </div>

      {family.length === 0 && (
        <div className={styles.emptyState}>
          <p>Start by adding yourself to begin tracking family age relationships.</p>
        </div>
      )}

      <div className={styles.familyList}>
        {family.map((member) => {
          const isExpanded = expandedMembers.has(member.id);
          
          return (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberHeader}>
                <button 
                  className={styles.memberHeaderButton}
                  onClick={() => toggleMemberExpanded(member.id)}
                  type="button"
                >
                  <div className={styles.memberBasicInfo}>
                    <p className={styles.memberName}>{member.name}</p>
                    <p className={styles.memberDob}>
                      Born: {format(parseISO(member.dob), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <ChevronIcon isExpanded={isExpanded} />
                </button>
                <button onClick={() => removeMember(member.id)} className={styles.deleteButton}>
                  <TrashIcon/>
                </button>
              </div>
              
              {isExpanded && (
                <div className={styles.memberDetails}>
                  <div className={styles.memberInfo}>
                    <div className={styles.relationshipSection}>
                      {editingRelationship === member.id ? (
                        <div className={styles.relationshipEdit}>
                          <select 
                            value={member.relationship || 'other'} 
                            onChange={(e) => {
                              try {
                                updateMemberRelationship(member.id, e.target.value);
                                setEditingRelationship(null);
                                setError('');
                              } catch (err) {
                                setError(err.message);
                                setEditingRelationship(null);
                              }
                            }}
                            className={styles.relationshipSelect}
                            autoFocus
                          >
                            {member.relationship === 'self' ? (
                              // If this is the self person, only show self option
                              <option value="self">Yourself</option>
                            ) : (
                              // For others, show all except self
                              RELATIONSHIP_TYPES.filter(rel => rel !== 'self').map((rel) => (
                                <option key={rel} value={rel}>
                                  {rel.charAt(0).toUpperCase() + rel.slice(1).replace('-', ' ')}
                                </option>
                              ))
                            )}
                          </select>
                          <button 
                            onClick={() => setEditingRelationship(null)}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p 
                          className={styles.memberRelationship}
                          onClick={() => member.relationship !== 'self' && setEditingRelationship(member.id)}
                          title={member.relationship !== 'self' ? 'Click to edit relationship' : 'You cannot change your own relationship'}
                        >
                          Relationship: {member.relationship === 'self' ? 'Yourself' : (
                            member.relationship ? 
                              member.relationship.charAt(0).toUpperCase() + member.relationship.slice(1).replace('-', ' ') : 
                              'Other'
                          )}
                          {member.relationship !== 'self' && <span className={styles.editIcon}>✏️</span>}
                        </p>
                      )}
                    </div>
                    <div className={styles.genderSection}>
                      {editingGender === member.id ? (
                        <div className={styles.genderEdit}>
                          <select 
                            value={member.gender || 'Male'} 
                            onChange={(e) => {
                              updateMemberGender(member.id, e.target.value);
                              setEditingGender(null);
                            }}
                            className={styles.genderSelect}
                            autoFocus
                          >
                            {GENDER_OPTIONS.map((genderOption) => (
                              <option key={genderOption} value={genderOption}>
                                {genderOption}
                              </option>
                            ))}
                          </select>
                          <button 
                            onClick={() => setEditingGender(null)}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p 
                          className={styles.memberGender}
                          onClick={() => setEditingGender(member.id)}
                          title="Click to edit gender"
                        >
                          Gender: {member.gender || 'Male'}
                          <span className={styles.editIcon}>✏️</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {member.events.length > 0 && (
                    <div className={styles.eventList}>
                      {member.events.map(event => (
                        <div key={event.id} className={styles.eventItem}>
                          <div className={styles.eventInfo}>
                            <p className={styles.eventTitle}>{event.title}</p>
                            <p className={styles.eventDate}>{format(parseISO(event.date), 'MMMM d, yyyy')}</p>
                          </div>
                          <button 
                            onClick={() => removeEvent(member.id, event.id)} 
                            className={styles.deleteEventButton}
                            title="Delete event"
                          >
                            <TrashIcon/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {addingEventFor === member.id ? (
                    <form onSubmit={handleAddEvent} className={styles.addEventForm}>
                      <Input
                        label="Event Title"
                        id={`event-title-${member.id}`}
                        type="text"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        placeholder="e.g., Graduation"
                        required
                      />
                      <Input
                        label="Event Date"
                        id={`event-date-${member.id}`}
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        required
                      />
                      <div className={styles.eventButtonGroup}>
                        <Button type="submit">Save Event</Button>
                        <Button 
                          type="button" 
                          onClick={() => {
                            setAddingEventFor(null);
                            setNewEventTitle('');
                            setNewEventDate('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setAddingEventFor(member.id)} 
                      className={styles.addEventButton}
                    >
                      <PlusIcon />
                      <span>Add Event</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};