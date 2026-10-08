import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, Shield, Target, ShoppingBag, User } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

export function MobileNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { label: "LEARN", href: "/", icon: Home },
    { label: "PRACTICE", href: "/practice", icon: Dumbbell },
    { label: "LEADERBOARDS", href: "/leaderboard", icon: Shield },
    { label: "QUESTS", href: "/quests", icon: Target },
    { label: "SHOP", href: "/shop", icon: ShoppingBag },
    { label: "PROFILE", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 w-full h-[68px] bg-white border-t-2 border-[var(--color-gray-border)] flex items-center justify-around z-50 md:hidden pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={twMerge(
              clsx(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
                isActive
                  ? "text-[var(--color-blue-500)] bg-[var(--color-blue-500)]/10"
                  : "text-[var(--color-gray-text)] hover:bg-[var(--color-gray-bg)]"
              )
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5 stroke-[2.5]" />
          </Link>
        );
      })}
    </nav>
  );
}
