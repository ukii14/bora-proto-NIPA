import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

export const MainContentContext = createContext();

const PAGE_LIMIT = 30;

export const MainContentProvider = ({ children }) => {
  const [mainContents, setMainContents] = useState([]);
  const [myMainContents, setMyMainContents] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [mainContentUrl, setMainContentUrl] = useState("/mainContents");
  const [mainContentLoading, setMainContentLoading] = useState(false);
  const [appending, setAppending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mainContentError, setMainContentError] = useState(false);
  const [me] = useContext(AuthContext);
  const pastMainContentUrlRef = useRef();
  const inflightAppendRef = useRef(false);

  useEffect(() => {
    if (pastMainContentUrlRef.current === mainContentUrl) return;
    setMainContentLoading(true);
    setHasMore(true);
    axios
      .get(mainContentUrl)
      .then((result) => {
        setMainContents(result.data);
        setHasMore(result.data.length >= PAGE_LIMIT);
      })
      .catch((err) => {
        console.error(err);
        setMainContentError(err);
      })
      .finally(() => {
        setMainContentLoading(false);
        pastMainContentUrlRef.current = mainContentUrl;
      });
  }, [mainContentUrl]);

  useEffect(() => {
    if (!me) {
      setMyMainContents([]);
      setIsPublic(true);
      return;
    }
    axios
      .get("/users/me/mainContents")
      .then((result) => setMyMainContents(result.data))
      .catch((err) => console.error(err));
  }, [me]);

  const upsertMainContent = useCallback((updated) => {
    if (!updated?._id) return;
    const replaceIn = (list) =>
      list.some((mc) => mc._id === updated._id)
        ? list.map((mc) => (mc._id === updated._id ? updated : mc))
        : [updated, ...list];
    setMainContents((prev) => replaceIn(prev));
    setMyMainContents((prev) => replaceIn(prev));
  }, []);

  const removeMainContent = useCallback((id) => {
    if (!id) return;
    setMainContents((prev) => prev.filter((mc) => mc._id !== id));
    setMyMainContents((prev) => prev.filter((mc) => mc._id !== id));
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (inflightAppendRef.current || !hasMore) return;

    const list = isPublic ? mainContents : myMainContents;
    const last = list[list.length - 1];
    if (!last) return;

    const baseUrl = isPublic ? "/mainContents" : "/users/me/mainContents";

    inflightAppendRef.current = true;
    setAppending(true);
    try {
      const { data } = await axios.get(baseUrl, {
        params: { lastid: last._id },
      });
      const setter = isPublic ? setMainContents : setMyMainContents;
      setter((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const filtered = data.filter((d) => !seen.has(d._id));
        return [...prev, ...filtered];
      });
      if (!Array.isArray(data) || data.length < PAGE_LIMIT) {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAppending(false);
      inflightAppendRef.current = false;
    }
  }, [hasMore, isPublic, mainContents, myMainContents]);

  const value = useMemo(
    () => ({
      mainContents: isPublic ? mainContents : myMainContents,
      setMainContents,
      setMyMainContents,
      upsertMainContent,
      removeMainContent,
      fetchNextPage,
      hasMore,
      appending,
      isPublic,
      setIsPublic,
      setMainContentUrl,
      mainContentLoading,
      mainContentError,
    }),
    [
      isPublic,
      mainContents,
      myMainContents,
      mainContentLoading,
      mainContentError,
      upsertMainContent,
      removeMainContent,
      fetchNextPage,
      hasMore,
      appending,
    ]
  );

  return (
    <MainContentContext.Provider value={value}>
      {children}
    </MainContentContext.Provider>
  );
};
