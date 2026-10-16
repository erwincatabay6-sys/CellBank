import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Keep this key in sync with the pre-paint script in index.html.
const storageKey = "cellbank-theme";
const ThemeContext = createContext(null);

function validPreference(value) {
  return value === "light" || value === "dark" ? value : null;
}

function readPreference() {
  try {
    return validPreference(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const preference = useRef(readPreference());

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function followSystem() {
      if (preference.current === null) {
        setTheme(media.matches ? "dark" : "light");
      }
    }

    function syncPreference(event) {
      if (event.key !== storageKey && event.key !== null) {
        return;
      }

      try {
        if (event.storageArea !== window.localStorage) {
          return;
        }
      } catch {
        return;
      }

      preference.current = validPreference(event.newValue);
      setTheme(preference.current ?? (media.matches ? "dark" : "light"));
    }

    followSystem();
    media.addEventListener("change", followSystem);
    window.addEventListener("storage", syncPreference);

    return () => {
      media.removeEventListener("change", followSystem);
      window.removeEventListener("storage", syncPreference);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    preference.current = nextTheme;
    setTheme(nextTheme);

    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Keep the selection for this session even if persistence is blocked.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
