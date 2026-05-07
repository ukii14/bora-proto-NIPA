import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Collapse,
  Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { toast } from "react-toastify";
import SimpleDateTime from "react-simple-timestamp-to-date";

function CommentList(props) {
  const [loading, setLoading] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [updatedComment, setUpdatedComment] = useState(props.comment.content);

  useEffect(() => {
    return () => setLoading(false);
  }, []);

  const deleteHandler = () => {
    setLoading(true);
    if (!window.confirm("정말 댓글을 삭제하시겠습니까?")) {
      setLoading(false);
      return;
    }
    axios
      .delete(`/mainContents/${props.postId}/comment/${props.comment._id}`)
      .then(() => {
        props.setCommentLists((prev) =>
          prev.filter((c) => c._id !== props.comment._id)
        );
        toast.success("댓글이 삭제되었습니다.");
        setLoading(false);
      });
  };

  const updateComment = async (e) => {
    try {
      e.preventDefault();
      await axios
        .patch(`/mainContents/${props.postId}/comment/${props.comment._id}`, {
          content: updatedComment,
        })
        .then((response) => {
          props.refreshFunction(response.data.comment);
          setCommentVisible(false);
          toast.success("댓글이 수정됐습니다.");
        });
    } catch (err) {
      console.error(err.response);
      toast.error(err.response.data.message);
    }
  };

  const writerName = props.comment.writer?.name ?? "익명";

  return (
    <Box>
      <Box sx={{ py: 2, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            fontSize: 14,
            fontWeight: 700,
            background: "linear-gradient(135deg, #7B2FBE 0%, #A855F7 100%)",
            flexShrink: 0,
          }}
        >
          {writerName[0]}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: "text.primary" }}>
              {writerName}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              <SimpleDateTime dateFormat="YMD" dateSeparator="-" timeSeparator=":">
                {props.comment.updatedAt}
              </SimpleDateTime>
            </Typography>
          </Box>

          {/* Content or Edit Form */}
          <Collapse in={!commentVisible}>
            <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.7 }}>
              {props.comment.content}
            </Typography>
          </Collapse>

          <Collapse in={commentVisible}>
            <Box component="form" onSubmit={updateComment} sx={{ display: "flex", gap: 1, mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={updatedComment}
                onChange={(e) => setUpdatedComment(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="contained" size="small" disableElevation>
                저장
              </Button>
            </Box>
          </Collapse>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={() => setCommentVisible(!commentVisible)}
            sx={{ color: commentVisible ? "text.secondary" : "primary.main", p: 0.5 }}
          >
            {commentVisible ? (
              <CloseIcon sx={{ fontSize: 16 }} />
            ) : (
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={deleteHandler}
            disabled={loading}
            sx={{ color: "text.secondary", p: 0.5, "&:hover": { color: "error.main" } }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
      <Divider sx={{ borderColor: "rgba(123,47,190,0.08)" }} />
    </Box>
  );
}

export default CommentList;
