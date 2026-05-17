import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Icon } from "./Icon";
import { useAuth } from "../lib/auth-context";

type Props = {
  children: ReactNode;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
};

export function AppLayout({
  children,
  showSearch,
  searchValue,
  onSearchChange,
}: Props) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [openProfile, setOpenProfile] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const routerState = useRouterState();

  // close menus on route change
  useEffect(() => {
    setMobileMenu(false);
    setOpenProfile(false);
  }, [routerState.location.pathname]);

  // outside click handler (FIXED: no longer breaks navigation)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    setOpenProfile(false);
    setMobileMenu(false);

    try {
      await logout();
      toast.success("Signed out");
      navigate({ to: "/" });
    } catch {
      toast.error("Could not sign out");
    }
  };

  const bottomNav = isAdmin
    ? [
        { to: "/", icon: "home", label: "Home" },
        { to: "/products/manage", icon: "add", label: "Sell" },
        { to: "/admin", icon: "shield_person", label: "Admin" },
        { to: "/profile", icon: "person", label: "Profile" },
      ]
    : [
        { to: "/", icon: "home", label: "Home" },
        { to: "/products/manage", icon: "add", label: "Sell" },
        { to: "/cart", icon: "shopping_cart", label: "Cart" },
        { to: "/profile", icon: "person", label: "Profile" },
      ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">

          {/* BRAND */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Icon name="storefront" className="text-[20px]" />
            </span>
            <span className="font-display font-bold text-lg hidden sm:inline">
              ShopSmart
            </span>
          </Link>

          {/* SEARCH */}
          {showSearch && (
            <div className="flex flex-1 mx-3">
              <div className="relative w-full">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]"
                />
                <input
                  type="search"
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* USER ACTIONS */}
          {user ? (
            <>
              {/* DESKTOP */}
              <div className="hidden sm:flex items-center gap-2">

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded-full bg-accent text-sm flex items-center gap-1"
                  >
                    <Icon name="shield_person" className="text-[18px]" />
                    Admin
                  </Link>
                )}

                <Link
                  to="/products/manage"
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm flex items-center gap-1"
                >
                  <Icon name="add" className="text-[18px]" />
                  Sell
                </Link>

                <Link
                  to="/cart"
                  className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"
                >
                  <Icon name="shopping_cart" className="text-[20px]" />
                </Link>

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setOpenProfile(v => !v)}
                    className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-accent"
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      {user.username?.[0]?.toUpperCase()}
                    </span>
                    <span className="text-sm">{user.username}</span>
                  </button>

                  {openProfile && (
                    <div className="absolute right-0 mt-2 w-52 bg-card border rounded-xl shadow-lg">
                      <Link to="/profile" className="block px-4 py-2 hover:bg-accent">
                        Profile
                      </Link>
                      <Link to="/products/manage" className="block px-4 py-2 hover:bg-accent">
                        Sell
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="block px-4 py-2 hover:bg-accent">
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-destructive hover:bg-destructive/10"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* MOBILE */}
              <div className="sm:hidden flex items-center gap-2">

                <Link
                  to="/cart"
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <Icon name="shopping_cart" />
                </Link>

                {/* FIXED HAMBURGER */}
                <button
                  type="button"
                  onClick={() => setMobileMenu(prev => !prev)}
                  className="w-10 h-10 flex items-center justify-center rounded-md active:bg-accent text-2xl"
                >
                  {mobileMenu ? "✕" : "☰"}
                </button>

              </div>
            </>
          ) : (
            <Link to="/auth" className="px-4 py-2 bg-primary text-white rounded-full">
              Login
            </Link>
          )}
        </div>

        {/* MOBILE MENU (FIXED NAVIGATION BUG) */}
        {mobileMenu && user && (
          <div className="sm:hidden border-t bg-card px-4 py-3 space-y-2">

            <Link
              to="/profile"
              onClick={() => setTimeout(() => setMobileMenu(false), 0)}
              className="block py-2"
            >
              Profile
            </Link>

            <Link
              to="/products/manage"
              onClick={() => setTimeout(() => setMobileMenu(false), 0)}
              className="block py-2"
            >
              Sell
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setTimeout(() => setMobileMenu(false), 0)}
                className="block py-2"
              >
                Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="block py-2 text-red-500"
            >
              Logout
            </button>

          </div>
        )}
      </header>

      {/* BODY */}
      <main className="flex-1 pb-24 sm:pb-8">{children}</main>

      {/* BOTTOM NAV */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-card border-t">
        <div className="grid grid-cols-4 text-xs">
          {bottomNav.map(item => (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center py-2 text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon name={item.icon} className="text-[22px]" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

    </div>
  );
}