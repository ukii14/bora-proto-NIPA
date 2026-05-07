import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Typography,
  Divider,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { getSafeExternalHref } from "../lib/safeUrl";

import HomeIcon from "@mui/icons-material/Home";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import IosShareIcon from "@mui/icons-material/IosShare";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { MainContentContext } from "../context/MainContentContext";
import TagsArr from "../components/TagsArr";
import Comments from "../components/Comments";
import { AuthContext } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL;

const MainContentPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { mainContentId } = useParams();
  const { mainContents, upsertMainContent, removeMainContent } =
    useContext(MainContentContext);
  const [me] = useContext(AuthContext);
  const [mainContent, setMainContent] = useState();
  const [error, setError] = useState(false);
  const [CommentLists, setCommentLists] = useState([]);
  const mainContentRef = useRef();

  const isLiked =
    !!me && Array.isArray(mainContent?.likes)
      ? mainContent.likes.some((id) => String(id) === String(me.userId))
      : false;

  useEffect(() => {
    const found = mainContents.find((mc) => mc._id === mainContentId);
    if (found) setMainContent(found);
  }, [mainContents, mainContentId]);

  useEffect(() => {
    if (mainContentRef.current) setMainContent(mainContentRef.current);
    if (mainContent && mainContent._id === mainContentId) return;
    axios
      .get(`/mainContents/${mainContentId}`)
      .then(({ data }) => {
        setMainContent(data);
        setError(false);
      })
      .catch((err) => {
        setError(true);
        toast.error(err.response.data.message);
      });
  }, [mainContentId, mainContent]);

  useEffect(() => {
    axios
      .get(`/mainContents/${mainContentId}/comment`)
      .then((result) => setCommentLists(result.data.comments))
      .catch((err) => console.log(err));
  }, [mainContentId]);

  const updateComment = (newComment) => {
    const normalizedComment = Array.isArray(newComment) ? newComment[0] : newComment;
    if (!normalizedComment?._id) return;

    setCommentLists((prev) => {
      const exists = prev.some((comment) => comment._id === normalizedComment._id);
      if (!exists) return prev.concat(normalizedComment);

      return prev.map((comment) =>
        comment._id === normalizedComment._id
          ? { ...comment, ...normalizedComment }
          : comment
      );
    });
  };

  const canDelete =
    !!me && !!mainContent?.user?._id && String(mainContent.user._id) === String(me.userId);
  const canEdit = canDelete;

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftWebLink, setDraftWebLink] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const safeOriginalHref = mainContent
    ? getSafeExternalHref(mainContent.web_link)
    : undefined;

  const startEdit = () => {
    setDraftTitle(mainContent?.title ?? "");
    setDraftWebLink(mainContent?.web_link ?? "");
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);

  const saveMeta = async () => {
    const title = draftTitle.trim();
    const webLink = draftWebLink.trim();
    if (!title) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!getSafeExternalHref(webLink)) {
      toast.error("http 또는 https 로 시작하는 올바른 URL을 입력해주세요.");
      return;
    }

    setSavingMeta(true);
    try {
      const { data } = await axios.patch(
        `/mainContents/${mainContentId}/meta`,
        { title, web_link: webLink }
      );
      if (data) {
        setMainContent(data);
        upsertMainContent(data);
      }
      toast.success("게시글이 수정되었습니다.");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "수정에 실패했습니다.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("작성자만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("정말 게시글을 삭제하시겠습니까?")) return;

    try {
      await axios.delete(`/mainContents/${mainContentId}`);
      removeMainContent(mainContentId);
      toast.success("게시글이 삭제되었습니다.");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "게시글 삭제에 실패했습니다.");
    }
  };

  const toggleLike = async () => {
    if (!me) {
      toast.info("로그인 후 이용해주세요.");
      return;
    }
    try {
      const endpoint = isLiked ? "unlike" : "like";
      const { data } = await axios.patch(
        `/mainContents/${mainContentId}/${endpoint}`
      );
      if (data) {
        setMainContent(data);
        upsertMainContent(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? "처리에 실패했습니다.");
    }
  };

  const copyShareLink = async () => {
    try {
      const url = `${window.location.origin}/mainContents/${mainContentId}`;
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다.");
    } catch (err) {
      toast.error("복사에 실패했습니다.");
    }
  };

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography color="error">콘텐츠를 불러오지 못했습니다.</Typography>
      </Box>
    );
  }
  if (!mainContent) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography sx={{ color: "text.secondary" }}>불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, sm: 4 } }}>
      {/* Breadcrumb */}
      <Box
        sx={{
          mb: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Breadcrumbs sx={{ fontSize: 13, minWidth: 0 }}>
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "primary.main" },
            }}
          >
            <HomeIcon sx={{ fontSize: 15 }} />
            {!isMobile && "홈"}
          </Link>
          <Typography sx={{ fontSize: 13, color: "text.primary" }} noWrap>
            {mainContent.title}
          </Typography>
        </Breadcrumbs>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            onClick={toggleLike}
            size="small"
            sx={{
              color: isLiked ? "error.main" : "text.secondary",
              "&:hover": { color: "error.main" },
            }}
            aria-label="좋아요"
          >
            {isLiked ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
          </IconButton>
          {Array.isArray(mainContent.likes) && mainContent.likes.length > 0 && (
            <Typography variant="caption" sx={{ color: "text.secondary", mr: 0.5 }}>
              {mainContent.likes.length}
            </Typography>
          )}
          <IconButton
            onClick={copyShareLink}
            size="small"
            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
            aria-label="공유 링크 복사"
          >
            <IosShareIcon sx={{ fontSize: 20 }} />
          </IconButton>
          {canEdit && !editing && (
            <IconButton
              onClick={startEdit}
              size="small"
              sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
              aria-label="게시글 수정"
            >
              <EditOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              onClick={handleDelete}
              size="small"
              sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
              aria-label="게시글 삭제"
            >
              <DeleteOutlineIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Hero Image */}
      <Box
        sx={{
          borderRadius: { xs: 2, sm: 3 },
          overflow: "hidden",
          mb: { xs: 2, sm: 3 },
          boxShadow: "0 4px 24px rgba(123,47,190,0.12)",
        }}
      >
        <img
          style={{ width: "100%", display: "block", maxHeight: isMobile ? 240 : 480, objectFit: "cover" }}
          alt={mainContent.title}
          src={`${API_URL}/static/assets/${mainContent.key}`}
        />
      </Box>

      {/* Title + Meta */}
      {editing ? (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(123,47,190,0.04)",
            border: "1px solid rgba(123,47,190,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            label="제목"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            inputProps={{ maxLength: 200 }}
            size="small"
          />
          <TextField
            fullWidth
            variant="outlined"
            label="원문 링크 (https://...)"
            value={draftWebLink}
            onChange={(e) => setDraftWebLink(e.target.value)}
            size="small"
          />
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={cancelEdit}
              startIcon={<CloseIcon />}
              disabled={savingMeta}
            >
              취소
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={saveMeta}
              startIcon={<CheckIcon />}
              disabled={savingMeta}
            >
              저장
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Typography
            fontWeight={800}
            sx={{
              mb: 1,
              color: "text.primary",
              fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.75rem" },
              lineHeight: 1.3,
            }}
          >
            {mainContent.title}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
            {safeOriginalHref ? (
            <Link
              href={safeOriginalHref}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "primary.main",
                fontSize: { xs: 12, sm: 13 },
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
                maxWidth: { xs: "70vw", sm: "none" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <OpenInNewIcon sx={{ fontSize: 14, flexShrink: 0 }} />
              원문 보기
            </Link>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                원문 링크 없음
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {mainContent.cTime}
            </Typography>
          </Box>
        </>
      )}

      {/* Tags */}
      <TagsArr
        mainContentId={mainContentId}
        mainContent={mainContent}
        upsertMainContent={(updated) => {
          setMainContent(updated);
          upsertMainContent(updated);
        }}
      />

      <Divider sx={{ my: { xs: 2, sm: 3 }, borderColor: "rgba(123,47,190,0.1)" }} />

      {/* Text & Summary */}
      {mainContent.text && (
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 1.5, fontSize: { xs: 10, sm: 12 } }}
          >
            본문
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.8, color: "text.primary", fontSize: { xs: "0.9rem", sm: "1rem" } }}>
            {mainContent.text}
          </Typography>
        </Box>
      )}

      {mainContent.summary && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: { xs: 2, sm: 3 },
            borderRadius: 2,
            background: "linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)",
            border: "1px solid rgba(123,47,190,0.12)",
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 1.5, fontSize: { xs: 10, sm: 12 } }}
          >
            요약
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.8, color: "text.primary", fontSize: { xs: "0.85rem", sm: "0.875rem" } }}>
            {mainContent.summary}
          </Typography>
        </Paper>
      )}

      <Divider sx={{ mb: { xs: 2, sm: 3 }, borderColor: "rgba(123,47,190,0.1)" }} />

      {/* Comments */}
      <Box>
        <Typography
          fontWeight={700}
          sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }}
        >
          댓글{" "}
          <Box component="span" sx={{ color: "primary.main" }}>
            {CommentLists.length}
          </Box>
        </Typography>
        <Comments
          CommentLists={CommentLists}
          postId={mainContentId}
          mainContent={mainContent}
          setCommentLists={setCommentLists}
          refreshFunction={updateComment}
        />
      </Box>
    </Box>
  );
};

export default MainContentPage;
