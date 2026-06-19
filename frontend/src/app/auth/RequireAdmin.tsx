import { type PropsWithChildren, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";

type RequireAdminProps = PropsWithChildren<{
  onUnauthenticated: () => void;
  onForbidden: () => void;
}>;

export function RequireAdmin({
  children,
  onUnauthenticated,
  onForbidden,
}: RequireAdminProps) {
  const { user, loading, isAdmin } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || redirected.current) return;

    if (!user) {
      redirected.current = true;
      onUnauthenticated();
      return;
    }

    if (!isAdmin) {
      redirected.current = true;
      onForbidden();
    }
  }, [isAdmin, loading, onForbidden, onUnauthenticated, user]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Loader2 size={20} className="animate-spin text-primary" />
          Yetki kontrol ediliyor...
        </div>
      </div>
    );
  }

  return children;
}
