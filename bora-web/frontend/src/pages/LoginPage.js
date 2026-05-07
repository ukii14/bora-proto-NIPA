import React, { useState, useContext } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Typography,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  TextField,
  CircularProgress,
  Divider,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { AuthContext } from "../context/AuthContext";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [, setMe] = useContext(AuthContext);
  const navigate = useNavigate();

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const usernameError = touched.username && username.length < 3
    ? "3자 이상 입력해주세요."
    : "";
  const passwordError = touched.password && password.length < 6
    ? "비밀번호는 6자 이상이어야 합니다."
    : "";

  const isFormValid = username.length >= 3 && password.length >= 6;

  const loginHandler = async (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (!isFormValid) return;

    setLoading(true);
    try {
      const result = await axios.patch("/users/login", { username, password });
      setMe({
        name: result.data.name,
        sessionId: result.data.sessionId,
        userId: result.data.userId,
      });
      toast.success("로그인!");
      navigate("/");
    } catch (err) {
      console.error(err.response);
      toast.error(err.response?.data?.message ?? "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: 400,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(123,47,190,0.15)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #4A1080 0%, #9B5DE5 100%)",
            py: 4,
            textAlign: "center",
          }}
        >
          <AutoStoriesIcon sx={{ fontSize: 40, color: "white", mb: 1 }} />
          <Typography variant="h5" fontWeight={800} sx={{ color: "white" }}>
            BORA
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13, mt: 0.5 }}>
            다시 만나서 반가워요
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <form onSubmit={loginHandler} noValidate>
            <TextField
              fullWidth
              variant="outlined"
              label="회원 ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur("username")}
              error={Boolean(usernameError)}
              helperText={usernameError || " "}
              inputProps={{ maxLength: 20 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon
                      sx={{ color: usernameError ? "error.main" : "primary.light", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              variant="outlined"
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              error={Boolean(passwordError)}
              helperText={passwordError || " "}
              sx={{ mt: 0.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      sx={{ color: passwordError ? "error.main" : "primary.light", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: 15, fontWeight: 700, borderRadius: 2, mt: 1 }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "white" }} />
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", px: 1 }}>
              또는
            </Typography>
          </Divider>

          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "text.secondary" }}
          >
            계정이 없으신가요?{" "}
            <Link
              component={RouterLink}
              to="/auth/register"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              회원가입
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
