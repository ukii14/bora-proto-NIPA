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
  TextField,
  InputAdornment,
  IconButton,
  LinearProgress,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { AuthContext } from "../context/AuthContext";

const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const complexity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (pwd.length < 6) return { value: 20, label: "너무 짧음", color: "error" };
  if (pwd.length < 8 || complexity <= 1) return { value: 45, label: "약함", color: "warning" };
  if (pwd.length < 12 || complexity <= 2) return { value: 70, label: "보통", color: "info" };
  return { value: 100, label: "강함", color: "success" };
};

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    username: false,
    password: false,
    passwordCheck: false,
  });
  const [, setMe] = useContext(AuthContext);
  const navigate = useNavigate();

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const errors = {
    name: touched.name && !name.trim() ? "이름을 입력해주세요." : "",
    username:
      touched.username && !username
        ? "회원ID를 입력해주세요."
        : touched.username && username.length < 3
        ? "3자 이상 입력해주세요."
        : touched.username && /[^a-zA-Z0-9_]/.test(username)
        ? "영문, 숫자, 밑줄(_)만 사용 가능합니다."
        : "",
    password:
      touched.password && !password
        ? "비밀번호를 입력해주세요."
        : touched.password && password.length < 6
        ? "6자 이상 입력해주세요."
        : "",
    passwordCheck:
      touched.passwordCheck && !passwordCheck
        ? "비밀번호를 다시 입력해주세요."
        : touched.passwordCheck && password !== passwordCheck
        ? "비밀번호가 일치하지 않습니다."
        : "",
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password && passwordCheck && password === passwordCheck;
  const isFormValid =
    name.trim() && username.length >= 3 && !errors.username &&
    password.length >= 6 && password === passwordCheck;

  const submitHandler = async (e) => {
    e.preventDefault();
    setTouched({ name: true, username: true, password: true, passwordCheck: true });
    if (!isFormValid) return;

    setLoading(true);
    try {
      const result = await axios.post("/users/register", { name, username, password });
      setMe({
        userId: result.data.userId,
        sessionId: result.data.sessionId,
        name: result.data.name,
      });
      toast.success("회원가입 성공!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message ?? err.message);
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
          maxWidth: 420,
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
            새 계정을 만들어보세요
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <form onSubmit={submitHandler} noValidate>
            {/* 이름 */}
            <TextField
              fullWidth
              variant="outlined"
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              error={Boolean(errors.name)}
              helperText={errors.name || " "}
              inputProps={{ maxLength: 20 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeOutlinedIcon
                      sx={{ color: errors.name ? "error.main" : "primary.light", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: name.trim() && (
                  <InputAdornment position="end">
                    <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* 회원 ID */}
            <TextField
              fullWidth
              variant="outlined"
              label="회원 ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur("username")}
              error={Boolean(errors.username)}
              helperText={
                errors.username ||
                (username
                  ? `${username.length} / 20자`
                  : "영문, 숫자, 밑줄(_) 사용 가능 · 3~20자")
              }
              inputProps={{ maxLength: 20 }}
              sx={{ mt: 0.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon
                      sx={{ color: errors.username ? "error.main" : "primary.light", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: username.length >= 3 && !errors.username && (
                  <InputAdornment position="end">
                    <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* 비밀번호 */}
            <TextField
              fullWidth
              variant="outlined"
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              error={Boolean(errors.password)}
              helperText={errors.password || " "}
              sx={{ mt: 0.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      sx={{ color: errors.password ? "error.main" : "primary.light", fontSize: 20 }}
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

            {/* 비밀번호 강도 */}
            {password && passwordStrength && (
              <Box sx={{ mb: 1.5, mt: -0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    비밀번호 강도
                  </Typography>
                  <Chip
                    label={passwordStrength.label}
                    size="small"
                    color={passwordStrength.color}
                    sx={{ height: 18, fontSize: 11, fontWeight: 600 }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength.value}
                  color={passwordStrength.color}
                  sx={{ borderRadius: 4, height: 5 }}
                />
                {passwordStrength.value < 70 && (
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                    대·소문자, 숫자, 특수문자를 혼합하면 더 안전합니다.
                  </Typography>
                )}
              </Box>
            )}

            {/* 비밀번호 확인 */}
            <TextField
              fullWidth
              variant="outlined"
              label="비밀번호 확인"
              type={showPasswordCheck ? "text" : "password"}
              value={passwordCheck}
              onChange={(e) => setPasswordCheck(e.target.value)}
              onBlur={() => handleBlur("passwordCheck")}
              error={Boolean(errors.passwordCheck)}
              helperText={
                errors.passwordCheck
                  ? errors.passwordCheck
                  : passwordsMatch
                  ? "비밀번호가 일치합니다."
                  : " "
              }
              FormHelperTextProps={{
                sx: { color: passwordsMatch && !errors.passwordCheck ? "success.main" : undefined },
              }}
              sx={{ mt: 0.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      sx={{
                        color: errors.passwordCheck
                          ? "error.main"
                          : passwordsMatch
                          ? "success.main"
                          : "primary.light",
                        fontSize: 20,
                      }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswordCheck(!showPasswordCheck)}
                      edge="end"
                      size="small"
                    >
                      {showPasswordCheck ? (
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
                "회원가입"
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
            이미 계정이 있으신가요?{" "}
            <Link
              component={RouterLink}
              to="/auth/login"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              로그인
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
