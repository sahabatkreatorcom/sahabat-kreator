"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const SSR_ONLY_ROUTES = new Set(["/compose"]);

export function toDashboardRoute(pathname: string): string {
  const p = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  if (p === "/settings/sessions") return "/settings/sessions";

  const segments = p.split("/").filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : "/dashboard";
}

interface SPANavContextValue {
  navigateTo: (path: string) => void;
  currentPath: string;
  spaActive: boolean;
  setSpaActive: (active: boolean) => void;
}

const SPANavContext = createContext<SPANavContextValue | null>(null);

const SSR_FALLBACK: SPANavContextValue = {
  navigateTo: () => {},
  currentPath: "/",
  spaActive: false,
  setSpaActive: () => {},
};

export function useSPANavigation() {
  const ctx = useContext(SPANavContext);
  return ctx ?? SSR_FALLBACK;
}

interface SPANavProviderProps {
  children: ReactNode;
  lazyViews: Record<string, unknown>;
}

export function SPANavProvider({ children, lazyViews }: SPANavProviderProps) {
  const nextRouter = useRouter();
  const pathname = usePathname();

  const [spaActive, setSpaActive] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => toDashboardRoute(pathname));

  useEffect(() => {
    const route = toDashboardRoute(window.location.pathname);
    if (lazyViews[route]) {
      setSpaActive(true);
    }
  }, [lazyViews]);

  useEffect(() => {
    const route = toDashboardRoute(pathname);
    setCurrentPath(route);
    if (lazyViews[route]) {
      setSpaActive(true);
    } else {
      setSpaActive(false);
    }
  }, [pathname, lazyViews]);

  const spaActiveRef = useRef(spaActive);
  spaActiveRef.current = spaActive;

  const currentPathRef = useRef(currentPath);
  currentPathRef.current = currentPath;
  const nextRouterRef = useRef(nextRouter);
  nextRouterRef.current = nextRouter;

  const navigateTo = useCallback((path: string) => {
    const route = toDashboardRoute(path);

    if (SSR_ONLY_ROUTES.has(route)) {
      nextRouterRef.current.push(path as Parameters<typeof nextRouterRef.current.push>[0]);
      return;
    }

    if (spaActiveRef.current && currentPathRef.current === route) return;

    if (window.location.pathname !== path) {
      history.pushState({ spa: true }, "", path);
    }
    nextRouterRef.current.replace(path as Parameters<typeof nextRouterRef.current.replace>[0], {
      scroll: false,
    });

    window.scrollTo(0, 0);
    setSpaActive(true);
    setCurrentPath(route);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = toDashboardRoute(window.location.pathname);

      if (SSR_ONLY_ROUTES.has(route) && spaActiveRef.current) {
        window.location.reload();
        return;
      }

      if (lazyViews[route]) {
        setSpaActive(true);
      }
      setCurrentPath(route);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [lazyViews]);

  const contextValue = useMemo(
    () => ({ navigateTo, currentPath, spaActive, setSpaActive }),
    [navigateTo, currentPath, spaActive],
  );

  return <SPANavContext.Provider value={contextValue}>{children}</SPANavContext.Provider>;
}
