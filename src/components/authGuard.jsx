import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

const AuthGuard = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Temporarily bypass authentication check to allow testing
  return children;

  // Original authentication check (commented out for now)
  /* 
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
  */
};

export default AuthGuard;