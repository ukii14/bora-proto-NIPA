import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Collapse,
} from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

function TagsArr(props) {
  const [visible, setVisible] = useState(false);
  const [tag, setTag] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState(null);

  const applyUpdate = (updated) => {
    if (!updated) return;
    if (typeof props.upsertMainContent === "function") {
      props.upsertMainContent(updated);
      return;
    }
    if (typeof props.setMainContents === "function") {
      props.setMainContents((prev) =>
        prev.map((mc) => (mc._id === updated._id ? updated : mc))
      );
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!tag.trim()) return;
    try {
      const response = await axios.patch(
        `/mainContents/${props.mainContentId}`,
        { hashArr: tag.trim() }
      );
      if (response.data?.mainContent) {
        setTag("");
        applyUpdate(response.data.mainContent);
        toast.success("태그가 추가됐습니다.");
      }
    } catch (err) {
      console.error(err.response);
      toast.error(err.response?.data?.message ?? "태그 추가에 실패했습니다.");
    }
  };

  const handleDeleteTag = async (tagValue) => {
    if (pendingDeletion) return;
    setPendingDeletion(tagValue);
    try {
      const response = await axios.patch(
        `/mainContents/${props.mainContentId}/delTag/${encodeURIComponent(tagValue)}`
      );
      if (response.data) {
        applyUpdate(response.data);
        toast.success("태그가 삭제됐습니다.");
      }
    } catch (err) {
      console.error(err.response);
      toast.error(err.response?.data?.message ?? "태그 삭제에 실패했습니다.");
    } finally {
      setPendingDeletion(null);
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
        {props.mainContent.hashArr &&
          props.mainContent.hashArr.map((hashTag) => (
            <Chip
              key={hashTag}
              label={hashTag}
              size="small"
              icon={<LocalOfferOutlinedIcon sx={{ fontSize: "14px !important" }} />}
              variant="outlined"
              color="primary"
              onDelete={() => handleDeleteTag(hashTag)}
              disabled={pendingDeletion === hashTag}
              sx={{ fontWeight: 500 }}
            />
          ))}
        <Button
          size="small"
          startIcon={visible ? <CloseIcon /> : <AddIcon />}
          onClick={() => setVisible(!visible)}
          sx={{
            fontSize: 12,
            color: visible ? "text.secondary" : "primary.main",
            minWidth: "auto",
          }}
        >
          {visible ? "닫기" : "태그 추가"}
        </Button>
      </Box>

      <Collapse in={visible}>
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{
            display: "flex",
            gap: 1,
            mt: 1.5,
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(123,47,190,0.04)",
            border: "1px solid rgba(123,47,190,0.15)",
          }}
        >
          <TextField
            size="small"
            variant="outlined"
            placeholder="태그를 입력하세요"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalOfferOutlinedIcon sx={{ color: "primary.light", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" size="small" disableElevation>
            저장
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}

export default TagsArr;
