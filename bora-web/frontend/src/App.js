import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import ToolBar from "./components/ToolBar";
import MainPage from "./pages/MainPage";
import MainContentPage from "./pages/MainContentPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import { UploadModalProvider } from "./context/UploadModalContext";

const App = () => {
  return (
    <UploadModalProvider>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <ToolBar />
        <Box>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/mainContents/:mainContentId" element={<MainContentPage />} />
            <Route path="/mainContents/:mainContentId/comment/:commentId" element={<MainContentPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/uploadpage" element={<UploadPage />} />
            <Route path="/" element={<MainPage />} />
          </Routes>
        </Box>
      </Box>
    </UploadModalProvider>
  );
};

export default App;
