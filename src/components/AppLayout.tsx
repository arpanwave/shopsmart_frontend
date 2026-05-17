import { Link, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { toast } from "sonner";

import { Icon } from "./Icon";

import { useAuth } from "../lib/auth-context";

type Props = {
  children: ReactNode;

  showSearch?: boolean;

  searchValue?: string;

  onSearchChange?: (
    v: string
  ) => void;
};

export function AppLayout({
  children,
  showSearch,
  searchValue,
  onSearchChange,
}: Props) {

  const {
    user,
    isAdmin,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const [openProfile, setOpenProfile] =
    useState(false);

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {

    const close = (
      e: MouseEvent
    ) => {

      if (
        menuRef.current &&
        !menuRef.current.contains(
          e.target as Node
        )
      ) {

        setOpenProfile(false);

        setMobileMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      close
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        close
      );

  }, []);

  const handleLogout =
    async () => {

      setOpenProfile(false);

      setMobileMenu(false);

      try {

        await logout();

        toast.success(
          "Signed out"
        );

        navigate({ to: "/" });

      } catch {

        toast.error(
          "Could not sign out"
        );
      }
    };

  return (

    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* HEADER */}

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">

          {/* BRAND */}

          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
          >

            <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">

              <Icon
                name="storefront"
                className="text-[20px]"
              />

            </span>

            <span className="font-display font-bold text-lg tracking-tight hidden xs:inline sm:inline">
              ShopSmart
            </span>

          </Link>

          {/* SEARCH DESKTOP */}

          {showSearch && (

            <div className="hidden md:flex flex-1 max-w-xl mx-auto">

              <div className="relative w-full">

                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]"
                />

                <input
                  type="search"
                  value={
                    searchValue ?? ""
                  }
                  onChange={(e) =>
                    onSearchChange?.(
                      e.target.value
                    )
                  }
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary border-0 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />

              </div>

            </div>
          )}

          <div className="flex-1" />

          {user ? (

            <>

              {/* DESKTOP ACTIONS */}

              <div className="hidden sm:flex items-center gap-2">

                {isAdmin && (

                  <>
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:bg-primary/10 transition"
                    >

                      <Icon
                        name="shield_person"
                        className="text-[18px]"
                      />

                      <span className="hidden lg:inline">
                        Admin
                      </span>

                    </Link>

                    <Link
                      to="/products/manage"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:bg-primary/10 transition"
                    >

                      <Icon
                        name="inventory_2"
                        className="text-[18px]"
                      />

                      <span className="hidden lg:inline">
                        Products
                      </span>

                    </Link>
                  </>
                )}

                <Link
                  to="/cart"
                  className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:bg-primary/10 transition"
                >

                  <Icon
                    name="shopping_cart"
                    className="text-[20px]"
                  />

                </Link>

                <Link
                  to="/products/manage"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                >

                  <Icon
                    name="add"
                    className="text-[18px]"
                  />

                  Sell

                </Link>

                {/* PROFILE MENU */}

                <div
                  className="relative"
                  ref={menuRef}
                >

                  <button
                    onClick={() =>
                      setOpenProfile(
                        (v) => !v
                      )
                    }
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-accent transition"
                  >

                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">

                      {user.username?.[0]?.toUpperCase() ??
                        "U"}

                    </span>

                    <span className="text-sm font-medium max-w-[120px] truncate">

                      {user.username}

                    </span>

                  </button>

                  {openProfile && (

                    <div className="absolute right-0 mt-2 w-52 bg-card rounded-2xl border border-border shadow-lg overflow-hidden">

                      <Link
                        to="/profile"
                        className="block px-4 py-3 text-sm hover:bg-accent"
                        onClick={() =>
                          setOpenProfile(
                            false
                          )
                        }
                      >
                        My Profile
                      </Link>

                      <Link
                        to="/products/manage"
                        className="block px-4 py-3 text-sm hover:bg-accent"
                        onClick={() =>
                          setOpenProfile(
                            false
                          )
                        }
                      >
                        My Products
                      </Link>

                      {isAdmin && (

                        <Link
                          to="/admin"
                          className="block px-4 py-3 text-sm hover:bg-accent"
                          onClick={() =>
                            setOpenProfile(
                              false
                            )
                          }
                        >
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={
                          handleLogout
                        }
                        className="w-full text-left px-4 py-3 text-sm text-destructive hover:bg-destructive/10 border-t border-border"
                      >
                        Sign Out
                      </button>

                    </div>
                  )}

                </div>

              </div>

              {/* MOBILE MENU BUTTON */}

              <div className="sm:hidden flex items-center gap-2">

                <Link
                  to="/cart"
                  className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
                >

                  <Icon
                    name="shopping_cart"
                    className="text-[20px]"
                  />

                </Link>

                <button
                  onClick={() =>
                    setMobileMenu(
                      (v) => !v
                    )
                  }
                  className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
                >

                  <Icon
                    name={
                      mobileMenu
                        ? "close"
                        : "menu"
                    }
                    className="text-[22px]"
                  />

                </button>

              </div>

            </>

          ) : (

            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
            >

              <Icon
                name="login"
                className="text-[18px]"
              />

              Login

            </Link>
          )}

        </div>

        {/* MOBILE SEARCH */}

        {showSearch && (

          <div className="md:hidden px-4 pb-3">

            <div className="relative">

              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]"
              />

              <input
                type="search"
                value={
                  searchValue ?? ""
                }
                onChange={(e) =>
                  onSearchChange?.(
                    e.target.value
                  )
                }
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary border-0 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />

            </div>

          </div>
        )}

        {/* MOBILE DROPDOWN MENU */}

        {mobileMenu && user && (

          <div className="sm:hidden border-t border-border bg-card px-4 py-4 space-y-2">

            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent"
              onClick={() =>
                setMobileMenu(
                  false
                )
              }
            >

              <Icon
                name="person"
                className="text-[20px]"
              />

              Profile

            </Link>

            <Link
              to="/products/manage"
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent"
              onClick={() =>
                setMobileMenu(
                  false
                )
              }
            >

              <Icon
                name="add_box"
                className="text-[20px]"
              />

              Sell Product

            </Link>

            <Link
              to="/products/manage"
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent"
              onClick={() =>
                setMobileMenu(
                  false
                )
              }
            >

              <Icon
                name="inventory_2"
                className="text-[20px]"
              />

              My Products

            </Link>

            {isAdmin && (

              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent"
                onClick={() =>
                  setMobileMenu(
                    false
                  )
                }
              >

                <Icon
                  name="shield_person"
                  className="text-[20px]"
                />

                Admin Panel

              </Link>
            )}

            <button
              onClick={
                handleLogout
              }
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10"
            >

              <Icon
                name="logout"
                className="text-[20px]"
              />

              Sign Out

            </button>

          </div>
        )}

      </header>

      {/* BODY */}

      <main className="flex-1 pb-24 sm:pb-8">

        {children}

      </main>

      {/* MOBILE BOTTOM NAV */}

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">

        <div className="grid grid-cols-4 text-xs">

          <BottomLink
            to="/"
            icon="home"
            label="Home"
          />

          <BottomLink
            to="/"
            icon="search"
            label="Search"
          />

          <BottomLink
            to={
              user
                ? "/cart"
                : "/auth"
            }
            icon="shopping_cart"
            label="Cart"
          />

          <BottomLink
            to={
              user
                ? "/profile"
                : "/auth"
            }
            icon="person"
            label={
              user
                ? "Profile"
                : "Login"
            }
          />

        </div>

      </nav>

    </div>
  );
}

function BottomLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: string;
  label: string;
}) {

  return (

    <Link
      to={to as "/"}
      className="flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground hover:text-primary transition"
      activeProps={{
        className:
          "text-primary",
      }}
      activeOptions={{
        exact: to === "/",
      }}
    >

      <Icon
        name={icon}
        className="text-[22px]"
      />

      <span className="text-[11px] font-medium">

        {label}

      </span>

    </Link>
  );
}