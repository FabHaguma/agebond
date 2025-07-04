import styles from './Input.module.css';

export const Input = ({ label, id, ...props }) => {
  return (
    <div className={styles.inputGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input id={id} className={styles.input} {...props} />
    </div>
  );
};