import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuth) {
      navigate("/admin/login", { replace: true });
    } else {
      setAuthenticated(true);
    }
  }, [navigate]);

  if (!authenticated) return null;
  return <>{children}</>;
};

export default AdminAuthGuard;
