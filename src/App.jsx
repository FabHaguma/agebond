// import styles from './App.module.css'; // Create this file if you want App-specific styles
import { FamilyPanel } from './sections/FamilyPanel/FamilyPanel';
import { QuestionPanel } from './sections/QuestionPanel/QuestionPanel';
import { WelcomeScreen } from './components/WelcomeScreen/WelcomeScreen';
import { useFamilyStore } from './store/familyStore';
import icon from './assets/icon.svg';

function App() {
  const { family } = useFamilyStore();
  const hasFamily = family.length > 0;

  return (
    <div className="container">
      <header className="header">
        <img src={icon} alt="AgeBond Logo" className="logo-icon" />
        <div>
          <h1 className="logo-title">AgeBond</h1>
          <p className="logo-subtitle">Unveiling Generational Connections Through Time</p>
        </div>
      </header>
      <main className="main-grid">
        {!hasFamily ? (
          <>
            <WelcomeScreen />
            <FamilyPanel />
          </>
        ) : (
          <>
            <FamilyPanel />
            <QuestionPanel />
          </>
        )}
      </main>
    </div>
  );
}

export default App;