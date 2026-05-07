import React, { createContext, useState, useContext } from "react";
import { Dialog, useMediaQuery, useTheme } from "@mui/material";
import LinkUploadForm from "../components/LinkUploadForm";

const UploadModalContext = createContext();

export const UploadModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <UploadModalContext.Provider value={{ openUploadModal: () => setOpen(true) }}>
      {children}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 4 },
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(123,47,190,0.2)",
          },
        }}
      >
        <LinkUploadForm
          isModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            window.location.reload();
          }}
        />
      </Dialog>
    </UploadModalContext.Provider>
  );
};

export const useUploadModal = () => useContext(UploadModalContext);
