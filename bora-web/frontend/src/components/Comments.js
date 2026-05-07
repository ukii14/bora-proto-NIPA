import React, { useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Button, Box, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { AuthContext } from "../context/AuthContext";
import CommentList from "./CommentList";

function Comments(props) {
  const [me] = useContext(AuthContext);
  const { mainContentId } = useParams();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;
    const variables = {
      content: comment,
      writer: me.userId,
      postId: props.postId,
    };
    setSubmitting(true);
    axios
      .post(`/mainContents/${mainContentId}/comment/saveComment`, variables)
      .then((response) => {
        if (response.data.success) {
          setComment("");
          props.refreshFunction(response.data.result);
          toast.success("댓글이 달렸습니다.");
        } else {
          alert("댓글 저장에 실패했습니다.");
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Box>
      {/* Comment List */}
      <Box sx={{ mb: 3 }}>
        {props.CommentLists && props.CommentLists.length > 0 ? (
          props.CommentLists.map((c, index) => (
            <CommentList
              key={index}
              comment={c}
              setComment={setComment}
              postId={props.postId}
              setCommentLists={props.setCommentLists}
              refreshFunction={props.refreshFunction}
            />
          ))
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: "text.secondary",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 32, color: "rgba(123,47,190,0.3)" }} />
            <Typography variant="body2">첫 번째 댓글을 남겨보세요!</Typography>
          </Box>
        )}
      </Box>

      {/* Input */}
      {me ? (
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{
            display: "flex",
            gap: 1,
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(123,47,190,0.04)",
            border: "1px solid rgba(123,47,190,0.15)",
          }}
        >
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="댓글을 입력하세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            maxRows={3}
          />
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={!comment.trim() || submitting}
            sx={{
              minWidth: 42,
              width: 42,
              height: 42,
              borderRadius: "50%",
              alignSelf: "flex-end",
              p: 0,
              background: "linear-gradient(135deg, #7B2FBE 0%, #A855F7 100%)",
              boxShadow: "0 8px 16px rgba(123,47,190,0.25)",
              transition: "all 0.2s ease",
              "&:hover": {
                background: "linear-gradient(135deg, #4A1080 0%, #7B2FBE 100%)",
                transform: "translateY(-1px)",
              },
              "&.Mui-disabled": {
                background: "rgba(123,47,190,0.2)",
                color: "rgba(255,255,255,0.7)",
                boxShadow: "none",
              },
            }}
          >
            <SendIcon sx={{ fontSize: 18, transform: "translateX(1px)" }} />
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            py: 2,
            borderRadius: 2,
            bgcolor: "rgba(123,47,190,0.04)",
            border: "1px dashed rgba(123,47,190,0.3)",
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            댓글을 달려면{" "}
            <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
              로그인
            </Box>
            이 필요합니다.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Comments;
