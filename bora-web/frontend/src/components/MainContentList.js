import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUploadModal } from "../context/UploadModalContext";
import {
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Button,
  IconButton,
} from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import AddLinkIcon from "@mui/icons-material/AddLink";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import axios from "axios";
import { toast } from "react-toastify";
import { MainContentContext } from "../context/MainContentContext";
import { AuthContext } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL;

const MainContentList = () => {
  const {
    mainContents,
    mainContentLoading,
    mainContentError,
    removeMainContent,
    fetchNextPage,
    hasMore,
    appending,
  } = useContext(MainContentContext);
  const [me] = useContext(AuthContext);
  const { openUploadModal } = useUploadModal();
  const sentinelRef = useRef(null);
  const [view, setView] = useState("list");

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return undefined;
    const target = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasMore, mainContents.length, view]);

  const handleViewChange = (_, nextView) => {
    if (nextView !== null) setView(nextView);
  };

  const canDelete = (mainContent) =>
    !!me &&
    !!mainContent?.user?._id &&
    String(mainContent.user._id) === String(me.userId);

  const handleDelete = async (event, mainContentId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm("정말 게시글을 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`/mainContents/${mainContentId}`);
      removeMainContent(mainContentId);
      toast.success("게시글이 삭제되었습니다.");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "게시글 삭제에 실패했습니다.");
    }
  };

  if (mainContentError) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography sx={{ color: "text.secondary" }}>콘텐츠를 불러오지 못했습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2.5, sm: 3 } }}>
      {/* 툴바 */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
          {mainContentLoading ? (
            <Skeleton width={80} />
          ) : (
            `총 ${mainContents.length}개`
          )}
        </Typography>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              border: "1px solid rgba(123,47,190,0.25)",
              color: "text.secondary",
              px: 1.2,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "white",
                "&:hover": { bgcolor: "primary.dark" },
              },
              "&:hover": { bgcolor: "rgba(123,47,190,0.06)" },
            },
          }}
        >
          <ToggleButton value="list" aria-label="list">
            <ViewListIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
          <ToggleButton value="module" aria-label="module">
            <ViewModuleIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 로딩 스켈레톤 */}
      {mainContentLoading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[...Array(4)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1.5, p: 1.5, bgcolor: "white", borderRadius: 2 }}>
              <Skeleton variant="rounded" width={140} height={110} sx={{ flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="70%" height={24} />
                <Skeleton width="45%" height={18} sx={{ mt: 0.5 }} />
                <Skeleton width="90%" height={18} sx={{ mt: 0.5 }} />
                <Skeleton width="90%" height={18} sx={{ mt: 0.5 }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* ── 리스트 뷰 ── */}
      {!mainContentLoading && view === "list" && mainContents.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2 } }}>
          {mainContents.map((mainContent) => (
            <Link
              key={mainContent._id}
              to={`/mainContents/${mainContent._id}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                sx={{
                  position: "relative",
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "translateX(4px)", boxShadow: "0 6px 24px rgba(123,47,190,0.15)" },
                }}
              >
                {canDelete(mainContent) && (
                  <IconButton
                    size="small"
                    onClick={(event) => handleDelete(event, mainContent._id)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      bgcolor: "rgba(255,255,255,0.9)",
                      color: "text.secondary",
                      "&:hover": { bgcolor: "white", color: "error.main" },
                    }}
                    aria-label="게시글 삭제"
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
                <CardActionArea
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "stretch",
                    p: 0,
                  }}
                >
                  {/* 썸네일 */}
                  <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <CardMedia
                      component="img"
                      sx={{
                        width: { xs: "100%", sm: 150, md: 170 },
                        height: { xs: 170, sm: 120, md: 130 },
                        objectFit: "cover",
                      }}
                      image={`${API_URL}/static/assets/${mainContent.key}`}
                      alt={mainContent.title}
                    />
                    {/* 보라색 오버레이 호버 효과 */}
                    <Box
                      sx={{
                        position: "absolute", inset: 0,
                        bgcolor: "rgba(123,47,190,0)",
                        transition: "bgcolor 0.2s",
                      }}
                    />
                  </Box>

                  {/* 텍스트 */}
                  <CardContent
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      p: { xs: 1.5, sm: 2 },
                      "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                      minWidth: 0,
                    }}
                  >
                    <Box>
                      <Typography
                        fontWeight={700}
                        noWrap
                        sx={{ color: "text.primary", mb: 0.5, fontSize: { xs: "0.875rem", sm: "1rem" } }}
                      >
                        {mainContent.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        noWrap
                        display="block"
                        sx={{ color: "primary.light", mb: { xs: 0, sm: 0.75 }, fontSize: 12 }}
                      >
                        {mainContent.web_link}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          display: { xs: "none", sm: "-webkit-box" },
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {mainContent.summary}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 1,
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {mainContent.hashArr?.slice(0, 3).map((tag, i) => (
                          <Chip
                            key={i}
                            label={tag}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: 10, height: 20 }}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.disabled", whiteSpace: "nowrap" }}>
                        {mainContent.cTime}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          ))}
        </Box>
      )}

      {/* ── 그리드 뷰 ── */}
      {!mainContentLoading && view === "module" && mainContents.length > 0 && (
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {mainContents.map((mainContent) => (
            <Grid item xs={6} sm={4} md={3} key={mainContent._id}>
              <Link
                to={`/mainContents/${mainContent._id}`}
                style={{ textDecoration: "none", display: "block", height: "100%" }}
              >
                <Card sx={{ height: "100%", position: "relative" }}>
                  {canDelete(mainContent) && (
                    <IconButton
                      size="small"
                      onClick={(event) => handleDelete(event, mainContent._id)}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        bgcolor: "rgba(255,255,255,0.9)",
                        color: "text.secondary",
                        "&:hover": { bgcolor: "white", color: "error.main" },
                      }}
                      aria-label="게시글 삭제"
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                  <CardActionArea sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                    <CardMedia
                      component="img"
                      sx={{ height: { xs: 130, sm: 160, md: 180 }, objectFit: "cover" }}
                      image={`${API_URL}/static/assets/${mainContent.key}`}
                      alt={mainContent.title}
                    />
                    <CardContent sx={{ p: { xs: 1.2, sm: 1.5 }, flex: 1 }}>
                      <Typography
                        fontWeight={700}
                        noWrap
                        sx={{ color: "text.primary", mb: 0.5, fontSize: { xs: 12, sm: 14 } }}
                      >
                        {mainContent.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        noWrap
                        display="block"
                        sx={{ color: "primary.light", mb: 0.75, fontSize: 11 }}
                      >
                        {mainContent.web_link}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {mainContent.hashArr?.slice(0, 2).map((tag, i) => (
                          <Chip
                            key={i}
                            label={tag}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: 10, height: 18 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── 무한 스크롤 sentinel + 인디케이터 ── */}
      {!mainContentLoading && mainContents.length > 0 && (
        <Box ref={sentinelRef} sx={{ mt: 2, display: "flex", justifyContent: "center", py: 2 }}>
          {appending ? (
            <Skeleton variant="rounded" width="100%" height={80} />
          ) : !hasMore ? (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              모든 콘텐츠를 불러왔습니다.
            </Typography>
          ) : null}
        </Box>
      )}

      {/* ── 빈 상태 ── */}
      {!mainContentLoading && mainContents.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: { xs: 8, sm: 12 },
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <BookmarkBorderIcon sx={{ fontSize: 42, color: "primary.light" }} />
          </Box>
          <Typography fontWeight={700} sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" }, color: "text.primary" }}>
            저장된 콘텐츠가 없습니다
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddLinkIcon />}
            onClick={openUploadModal}
            sx={{ mt: 1, borderRadius: 2, px: 3, py: 1, fontWeight: 700 }}
          >
            첫 콘텐츠 추가하기
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MainContentList;
