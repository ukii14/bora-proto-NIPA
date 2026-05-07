import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import LinkUploadForm from "../components/LinkUploadForm";

const UploadPage = () => {
  const [me] = useContext(AuthContext);

  return <>{me && <LinkUploadForm />}</>;
};

export default UploadPage;
