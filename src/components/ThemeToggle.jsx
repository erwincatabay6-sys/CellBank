import { Moon, Sun } from "lucide-react";
import { useTheme } from "../features/theme/ThemeContext.jsx";

export default function ThemeToggle({ drawer = false }) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  if (drawer) {
    return (
      <button className="nav-item staff-drawer-theme" type="button"
        role="switch" aria-checked={theme === "dark"} onClick={toggleTheme}>
        <Moon size={20} aria-hidden="true" />
        Dark mode
        <span className="staff-drawer-switch" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </button>
  );
}
