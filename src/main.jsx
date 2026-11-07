import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import FeedbackProvider from "./features/feedback/FeedbackProvider.jsx";
import App from "./app/App.jsx";
import { CustomersProvider } from "./features/customers/context/CustomersContext.jsx";
import { AuthProvider } from "./features/auth/context/AuthContext.jsx";
import { ThemeProvider } from "./features/theme/ThemeContext.jsx";

import "./styles/global.css";
import "./styles/layout.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider>
            <FeedbackProvider>
                <BrowserRouter>
                    <AuthProvider>
                        <CustomersProvider>
                            <App />
                        </CustomersProvider>
                    </AuthProvider>
                </BrowserRouter>
            </FeedbackProvider>
        </ThemeProvider>
    </StrictMode>
);
