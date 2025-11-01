import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const TradingHeaderAuth = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="oui-flex oui-items-center oui-gap-2">
      <Link
        to="/dashboard"
        className="oui-px-4 oui-py-2 oui-rounded-lg oui-text-sm oui-font-semibold oui-text-white oui-no-underline hover:oui-opacity-90 oui-transition-opacity"
        style={{ backgroundColor: "#00C7D1" }}
      >
        Dashboard
      </Link>
      {isAuthenticated && user && (
        <div
          className="oui-w-8 oui-h-8 oui-rounded-full oui-flex oui-items-center oui-justify-center oui-text-white oui-text-xs oui-font-bold"
          style={{ backgroundColor: "#00C7D1" }}
          title={user.fullName || user.email}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName || user.email}
              className="oui-w-full oui-h-full oui-rounded-full oui-object-cover"
            />
          ) : (
            <User size={16} />
          )}
        </div>
      )}
    </div>
  );
};
