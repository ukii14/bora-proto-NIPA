import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import PublicIcon from "@mui/icons-material/Public";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = process.env.REACT_APP_API_URL;

function LinkUploadForm({ isModal = false, onSuccess, onClose }) {
  const [webLink, setWebLink] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!webLink.trim()) return;

    const formData = new FormData();
    formData.append("public", isPublic);
    formData.append("web_link", webLink);
    formData.append("submit_button", "submit_web_link");

    setLoading(true);
    try {
      await axios.post(`${API_URL}/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("업로드 성공!");
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      } else {
        setTimeout(() => window.location.replace("/"), 1500);
      }
    } catch (error) {
      console.error(error);
      toast.error("업로드 실패");
      setLoading(false);
    }
  };

  const header = (
    <Box
      sx={{
        background: "linear-gradient(135deg, #4A1080 0%, #9B5DE5 100%)",
        py: 4,
        px: 3,
        textAlign: "center",
        position: "relative",
      }}
    >
      {isModal && onClose && (
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.8)" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <CloudUploadOutlinedIcon sx={{ fontSize: 44, color: "white", mb: 1 }} />
      <Typography variant="h5" fontWeight={800} sx={{ color: "white" }}>
        콘텐츠 업로드
      </Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13, mt: 0.5 }}>
        링크를 붙여넣으면 자동으로 분석합니다
      </Typography>
    </Box>
  );

  const formBody = (
    <Box sx={{ p: { xs: 3, sm: 4 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
          p: 1.5,
          borderRadius: 2,
          bgcolor: isPublic ? "rgba(123,47,190,0.06)" : "rgba(0,0,0,0.04)",
          border: "1px solid",
          borderColor: isPublic ? "rgba(123,47,190,0.2)" : "rgba(0,0,0,0.1)",
        }}
      >
        {isPublic ? (
          <PublicIcon sx={{ color: "primary.main", fontSize: 20 }} />
        ) : (
          <LockOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        )}
        <Typography
          variant="body2"
          sx={{ flex: 1, fontWeight: 600, color: isPublic ? "primary.main" : "text.secondary" }}
        >
          {isPublic ? "전체 공개" : "나만 보기"}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={!isPublic}
              onChange={() => setIsPublic(!isPublic)}
            />
          }
          label=""
          sx={{ m: 0 }}
        />
      </Box>

      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          variant="outlined"
          label="웹 링크"
          placeholder="https://..."
          value={webLink}
          onChange={(e) => setWebLink(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon sx={{ color: "primary.light", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || !webLink.trim()}
          startIcon={loading ? undefined : <CloudUploadOutlinedIcon />}
          sx={{ py: 1.5, fontSize: 15, fontWeight: 700, borderRadius: 2 }}
        >
          {loading ? <CircularProgress size={22} sx={{ color: "white" }} /> : "업로드"}
        </Button>
      </form>
    </Box>
  );

  if (isModal) {
    return (
      <>
        {header}
        {formBody}
      </>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #F3E8FF 0%, #EDE9FE 50%, #F8F4FF 100%)",
        px: 2,
        py: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(123,47,190,0.15)",
        }}
      >
        {header}
        {formBody}
      </Paper>
    </Box>
  );
}

export default LinkUploadForm;
