import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import { MainContentProvider } from "./context/MainContentContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeModeContext";
import { BrowserRouter } from "react-router-dom";
import { createAppTheme } from "./theme";
import "./lib/api";

const ThemedApp = () => {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <MainContentProvider>
            <App />
          </MainContentProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
