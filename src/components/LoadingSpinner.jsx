import "./LoadingSpinner.css";

function LoadingSpinner({ size = 20 }) {
  return (
    <span
      className="loading-spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export default LoadingSpinner;