import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import useDebouncedValue from "../hooks/useDebouncedValue";
import {
  Box,
  Typography,
  InputBase,
  Paper,
  IconButton,
  Divider,
  Card,
  CardMedia,
  CardActionArea,
  CardContent,
  Grid,
  Chip,
  Fade,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { MainContentContext } from "../context/MainContentContext";
import MainContentList from "../components/MainContentList";

const API_URL = process.env.REACT_APP_API_URL;

const MainPage = () => {
  const { mainContents } = useContext(MainContentContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [postSize, setPostSize] = useState(0);
  const [searched, setSearched] = useState(false);
  const debouncedTerm = useDebouncedValue(searchTerm, 350);
  const lastQueryRef = useRef("");

  const runSearch = useCallback(async (term) => {
    const trimmed = term.trim();
    lastQueryRef.current = trimmed;

    if (!trimmed) {
      setResults([]);
      setPostSize(0);
      setSearched(false);
      return;
    }

    try {
      const res = await axios.post(
        `/mainContents/search?value=${encodeURIComponent(trimmed)}`
      );
      if (lastQueryRef.current !== trimmed) return;
      if (res.data.success) {
        setResults(res.data.contentsInfo);
        setPostSize(res.data.postSize);
        setSearched(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    runSearch(debouncedTerm);
  }, [debouncedTerm, runSearch]);

  const getSearch = () => runSearch(searchTerm);

  const clearSearch = () => {
    setSearchTerm("");
    setResults([]);
    setSearched(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") getSearch();
  };

  return (
    <Box>
      {/* ── 페이지 상단 헤더 ── */}
      <Box
        sx={{
          background: "linear-gradient(160deg, #4A1080 0%, #7B2FBE 55%, #9B5DE5 100%)",
          pt: { xs: 4, sm: 5 },
          pb: { xs: 5, sm: 7 },
          px: { xs: 2, sm: 4 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 장식 원 */}
        <Box sx={{
          position: "absolute", top: -60, right: -60, width: 260, height: 260,
          borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)",
        }} />
        <Box sx={{
          position: "absolute", bottom: -40, left: "30%", width: 180, height: 180,
          borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)",
        }} />

        {/* 타이틀 */}
        <Box sx={{ position: "relative", textAlign: "center", mb: { xs: 3, sm: 4 } }}>
          <Typography
            sx={{
              color: "white",
              fontWeight: 800,
              fontSize: { xs: "1.6rem", sm: "2rem", md: "2.4rem" },
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            저장된 콘텐츠를
            <br />
            한눈에 탐색하세요
          </Typography>

          {/* 통계 뱃지 */}
          {mainContents.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 2 }}>
              <Chip
                icon={<BookmarkBorderIcon sx={{ fontSize: "14px !important", color: "rgba(255,255,255,0.8) !important" }} />}
                label={`${mainContents.length}개의 콘텐츠`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 600,
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              />
            </Box>
          )}
        </Box>

        {/* 검색바 */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            maxWidth: 600,
            mx: "auto",
            borderRadius: 3,
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", px: 2, color: "text.secondary" }}>
            <SearchIcon sx={{ color: searched ? "primary.main" : "text.disabled", fontSize: 22 }} />
          </Box>
          <InputBase
            sx={{ flex: 1, py: { xs: 1.4, sm: 1.6 }, fontSize: { xs: 14, sm: 15 }, color: "text.primary" }}
            placeholder="제목, 링크, 태그로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searched && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <IconButton size="small" onClick={clearSearch} sx={{ mx: 0.5, color: "text.secondary" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <Box
            onClick={getSearch}
            sx={{
              px: { xs: 2.2, sm: 2.8 },
              py: { xs: 1.2, sm: 1.4 },
              mr: 0.8,
              borderRadius: 999,
              background: "linear-gradient(135deg, #7B2FBE 0%, #A855F7 100%)",
              color: "white",
              fontWeight: 700,
              fontSize: { xs: 13, sm: 14 },
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              boxShadow: "0 6px 18px rgba(123,47,190,0.28)",
              transition: "all 0.2s ease",
              "&:hover": {
                background: "linear-gradient(135deg, #4A1080 0%, #7B2FBE 100%)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <SearchIcon sx={{ fontSize: 16 }} />
            검색
          </Box>
        </Paper>
      </Box>

      {/* ── 검색 결과 ── */}
      <Fade in={searched}>
        <Box sx={{ display: searched ? "block" : "none" }}>
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3, pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                <Box component="span" sx={{ color: "primary.main", fontWeight: 700, fontSize: "1rem" }}>
                  {postSize}
                </Box>
                개의 검색 결과 &nbsp;·&nbsp;
                <Box component="span" sx={{ color: "primary.light", fontWeight: 600 }}>
                  "{searchTerm}"
                </Box>
              </Typography>
              <Typography
                variant="caption"
                onClick={clearSearch}
                sx={{ color: "text.secondary", cursor: "pointer", "&:hover": { color: "primary.main" } }}
              >
                전체 목록으로 돌아가기
              </Typography>
            </Box>
            {results.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <SearchIcon sx={{ fontSize: 48, color: "rgba(123,47,190,0.2)", mb: 1 }} />
                <Typography sx={{ color: "text.secondary" }}>검색 결과가 없습니다.</Typography>
              </Box>
            ) : (
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {results.map((item, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Link to={`/mainContents/${item._id}`} style={{ textDecoration: "none" }}>
                      <Card>
                        <CardActionArea>
                          <CardMedia
                            component="img"
                            height={140}
                            image={`${API_URL}/static/assets/${item.key}`}
                            alt={item.title}
                          />
                          <CardContent sx={{ py: 1, px: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                              sx={{ color: "text.primary", fontSize: { xs: 12, sm: 14 } }}
                            >
                              {item.title}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Link>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
          <Divider sx={{ mt: 3, mb: 1, borderColor: "rgba(123,47,190,0.1)" }} />
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
              전체 컬렉션
            </Typography>
          </Box>
        </Box>
      </Fade>

      {/* ── 전체 콘텐츠 목록 ── */}
      <MainContentList />
    </Box>
  );
};

export default MainPage;
