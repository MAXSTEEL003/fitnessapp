import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * SignIn component
 * In personal app mode, login is not required. Automatically redirects to Dashboard.
 */
export function SignIn() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}
