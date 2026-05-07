import { createTheme } from "@mui/material/styles";

const PURPLE = {
  main: "#7B2FBE",
  light: "#A855F7",
  dark: "#4A1080",
  contrastText: "#fff",
};

const lightPalette = {
  mode: "light",
  primary: PURPLE,
  secondary: { main: "#C77DFF", contrastText: "#fff" },
  background: { default: "#F8F4FF", paper: "#FFFFFF" },
  text: { primary: "#1A0533", secondary: "#6B7280" },
};

const darkPalette = {
  mode: "dark",
  primary: PURPLE,
  secondary: { main: "#C77DFF", contrastText: "#fff" },
  background: { default: "#15101F", paper: "#1F1730" },
  text: { primary: "#F1ECFB", secondary: "#B8AED1" },
};

export const createAppTheme = (mode = "light") => {
  const isDark = mode === "dark";

  return createTheme({
    palette: isDark ? darkPalette : lightPalette,
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 8,
          },
          containedPrimary: {
            background: "linear-gradient(135deg, #7B2FBE 0%, #A855F7 100%)",
            boxShadow: "0 4px 14px rgba(123, 47, 190, 0.35)",
            "&:hover": {
              background: "linear-gradient(135deg, #4A1080 0%, #7B2FBE 100%)",
              boxShadow: "0 6px 20px rgba(123, 47, 190, 0.45)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? "0 2px 12px rgba(0,0,0,0.4)"
              : "0 2px 12px rgba(123, 47, 190, 0.08)",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
            "&:hover": {
              boxShadow: isDark
                ? "0 8px 28px rgba(0,0,0,0.55)"
                : "0 8px 28px rgba(123, 47, 190, 0.18)",
              transform: "translateY(-2px)",
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6 },
          outlinedPrimary: { borderColor: "#A855F7", color: "#7B2FBE" },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiInput-underline:after": { borderBottomColor: "#7B2FBE" },
            "& .MuiOutlinedInput-root": {
              "&.Mui-focused fieldset": { borderColor: "#7B2FBE" },
            },
            "& label.Mui-focused": { color: "#7B2FBE" },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: "linear-gradient(135deg, #4A1080 0%, #9B5DE5 100%)",
            boxShadow: "0 2px 20px rgba(74, 16, 128, 0.3)",
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#15101F" : "#F8F4FF",
          },
        },
      },
    },
  });
};

export default createAppTheme();
