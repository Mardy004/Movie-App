import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingBlock } from '../common/StateBlocks.jsx';

/** Route guard: only signed-in admins may render the wrapped pages. */
export default function RequireAdmin({ children }) {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();

  if (isChecking) {
    return (
      <div className="shell section">
        <LoadingBlock label="Checking admin session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where the user wanted to go so login can send them back.
    return <Navigate to="/admin/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
}