import styles from './Button.module.css';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${styles.button} ${styles[variant]}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};