
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { buttonVariants } from "./Button";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

type SidebarItemProps = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

export function SidebarItem({ label, icon, href }: SidebarItemProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const isActive = pathname === href;

  return (
    <Link
      to={href}
      className={twMerge(
        buttonVariants({ variant: isActive ? "primary" : "ghost" }),
        clsx(
          "w-full justify-start h-[52px] mb-2 px-4 rounded-xl",
          isActive ? "bg-[var(--color-blue-500)]/10 text-[var(--color-blue-500)] border-transparent hover:bg-[var(--color-blue-500)]/20 active:border-transparent active:translate-y-0" : ""
        )
      )}
    >
      <div className="mr-4 flex items-center justify-center w-8 h-8">
        {icon}
      </div>
      <span className="font-extrabold tracking-wide">{label}</span>
    </Link>
  );
}
