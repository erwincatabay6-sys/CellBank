import "./Skeleton.css";

export default function Skeleton({
  width = "100%",
  height = 14,
  rounded = false,
  className = "",
  style = {},
}) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: rounded ? "999px" : "4px",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}