import styles from './WelcomeScreen.module.css';

export const WelcomeScreen = () => {
  return (
    <div className={styles.welcome}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to AgeBond! 👋</h1>
        <p className={styles.subtitle}>
          Track and explore age relationships between family members through time.
        </p>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.icon}>🧮</span>
            <h3>Calculate Age Relationships</h3>
            <p>Find out when family members will be certain ages or how ages compare at different times.</p>
          </div>
          
          <div className={styles.feature}>
            <span className={styles.icon}>✨</span>
            <h3>Ask Natural Questions</h3>
            <p>Use AI to ask questions like "When will I be the age my mom is now?"</p>
          </div>
          
          <div className={styles.feature}>
            <span className={styles.icon}>👨‍👩‍👧‍👦</span>
            <h3>Track Your Family</h3>
            <p>Add family members with relationships and important life events.</p>
          </div>
        </div>
        
        <div className={styles.getStarted}>
          <h3>Ready to get started?</h3>
          <p>Begin by adding yourself in the Family Panel on the right →</p>
        </div>
      </div>
    </div>
  );
};
