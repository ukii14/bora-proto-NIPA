import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PublicIcon from "@mui/icons-material/Public";
import PersonIcon from "@mui/icons-material/Person";
import { Tooltip, Switch } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { useUploadModal } from "../context/UploadModalContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { MainContentContext } from "../context/MainContentContext";

const ToolBar = () => {
  const [me, setMe] = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openUploadModal } = useUploadModal();
  const { mode, toggleMode } = useThemeMode();
  const { isPublic, setIsPublic } = useContext(MainContentContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const logoutHandler = async () => {
    try {
      await axios.patch("/users/logout");
      setMe();
      setDrawerOpen(false);
      toast.success("로그아웃");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const MobileDrawer = (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{
        sx: {
          width: 240,
          background: "linear-gradient(180deg, #4A1080 0%, #9B5DE5 100%)",
          color: "white",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoStoriesIcon />
          <Typography fontWeight={800}>BORA</Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
      <List sx={{ pt: 1 }}>
        <ListItem sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "white" }}>
            {mode === "dark" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
            <Typography variant="body2">다크 모드</Typography>
          </Box>
          <Switch checked={mode === "dark"} onChange={toggleMode} color="default" />
        </ListItem>
        {me && (
          <ListItem sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "white" }}>
              {isPublic ? <PublicIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
              <Typography variant="body2">{isPublic ? "전체 보기" : "내 글만"}</Typography>
            </Box>
            <Switch checked={!isPublic} onChange={() => setIsPublic((v) => !v)} color="default" />
          </ListItem>
        )}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", my: 1 }} />
        {me ? (
          <>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(255,255,255,0.25)", fontWeight: 700 }}>
                {me.name[0]}
              </Avatar>
              <Typography fontWeight={600}>{me.name}</Typography>
            </Box>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mb: 1 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => { setDrawerOpen(false); openUploadModal(); }}
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
              >
                <ListItemText primary="업로드" primaryTypographyProps={{ color: "white", fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={logoutHandler} sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                <ListItemText primary="로그아웃" primaryTypographyProps={{ color: "rgba(255,255,255,0.8)" }} />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <Link to="/auth/login" style={{ textDecoration: "none", width: "100%" }} onClick={() => setDrawerOpen(false)}>
                <ListItemButton sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                  <ListItemText primary="로그인" primaryTypographyProps={{ color: "white", fontWeight: 600 }} />
                </ListItemButton>
              </Link>
            </ListItem>
            <ListItem disablePadding>
              <Link to="/auth/register" style={{ textDecoration: "none", width: "100%" }} onClick={() => setDrawerOpen(false)}>
                <ListItemButton sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                  <ListItemText primary="회원가입" primaryTypographyProps={{ color: "white", fontWeight: 600 }} />
                </ListItemButton>
              </Link>
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
          <AutoStoriesIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.5px", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
            BORA
          </Typography>
        </Link>

        <Box sx={{ flexGrow: 1 }} />

        {/* Desktop Nav */}
        {!isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={mode === "dark" ? "라이트 모드" : "다크 모드"}>
              <IconButton
                onClick={toggleMode}
                sx={{ color: "white", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
                size="small"
                aria-label="theme-toggle"
              >
                {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            {me && (
              <Tooltip title={isPublic ? "내 글만 보기" : "전체 보기"}>
                <Box
                  onClick={() => setIsPublic((v) => !v)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    transition: "all 0.2s ease",
                    ...(isPublic
                      ? {
                          color: "rgba(255,255,255,0.75)",
                          backgroundColor: "rgba(255,255,255,0.12)",
                          border: "1.5px solid rgba(255,255,255,0.25)",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.2)",
                            color: "white",
                          },
                        }
                      : {
                          color: "primary.main",
                          backgroundColor: "white",
                          border: "1.5px solid white",
                          boxShadow: "0 0 0 3px rgba(255,255,255,0.2)",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.9)",
                            boxShadow: "0 0 0 4px rgba(255,255,255,0.25)",
                          },
                        }),
                  }}
                >
                  {isPublic ? <PublicIcon sx={{ fontSize: 14 }} /> : <PersonIcon sx={{ fontSize: 14 }} />}
                  {isPublic ? "전체" : "내 글"}
                </Box>
              </Tooltip>
            )}
            {me ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={openUploadModal}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.5)",
                    "&:hover": { borderColor: "white", backgroundColor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  업로드
                </Button>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                  }}
                  onClick={logoutHandler}
                >
                  <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: "rgba(255,255,255,0.25)", color: "white", fontWeight: 700 }}>
                    {me.name[0]}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                    {me.name}
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <Link to="/auth/login" style={{ textDecoration: "none" }}>
                  <Button size="small" sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { color: "white", backgroundColor: "rgba(255,255,255,0.1)" } }}>
                    로그인
                  </Button>
                </Link>
                <Link to="/auth/register" style={{ textDecoration: "none" }}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, boxShadow: "none", background: "rgba(255,255,255,0.2)" }}
                  >
                    회원가입
                  </Button>
                </Link>
              </>
            )}
          </Box>
        )}

        {/* Mobile: avatar or hamburger */}
        {isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {me && (
              <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "rgba(255,255,255,0.25)", fontWeight: 700 }}>
                {me.name[0]}
              </Avatar>
            )}
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "white" }}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
      {MobileDrawer}
    </AppBar>
  );
};

export default ToolBar;
