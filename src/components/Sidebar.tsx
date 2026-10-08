import { Link } from "react-router-dom";
import { SidebarItem } from "./SidebarItem";
import { Home, Dumbbell, Shield, Target, ShoppingBag, User, Settings as SettingsIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

export default function Sidebar({ className }: { className?: string }) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex h-full lg:w-[256px] lg:max-w-[256px] px-4 flex-col border-r-2 border-[var(--color-gray-border)] bg-white",
          className
        )
      )}
    >
      <div className="pt-7 pl-4 pb-6 flex items-center">
        <Link to="/" className="flex items-center gap-x-2">
          <img src="/mascot.jpeg" alt="Duolingo" width={38} height={38} className="rounded-xl border border-neutral-200" />
          <h1 className="text-3xl font-black text-[var(--color-green-500)] tracking-wide">
            duolingo
          </h1>
        </Link>
      </div>

      <div className="flex flex-col gap-y-2 flex-1">
        <SidebarItem label="LEARN" href="/" icon={<Home className="w-6 h-6 text-neutral-400 stroke-[2.5]" />} />
        <SidebarItem label="PRACTICE" href="/practice" icon={<Dumbbell className="w-6 h-6 text-neutral-400 stroke-[2.5]" />} />
        <SidebarItem label="LEADERBOARDS" href="/leaderboard" icon={<Shield className="w-6 h-6 text-neutral-400 stroke-[2.5]" />} />
        <SidebarItem label="QUESTS" href="/quests" icon={<Target className="w-6 h-6 text-neutral-400 stroke-[2.5]" />} />
        <SidebarItem label="SHOP" href="/shop" icon={<ShoppingBag className="w-6 h-6 text-neutral-400 stroke-[2.5]" />} />
        <SidebarItem label="PROFILE" href="/profile" icon={<User className="w-6 h-6 text-neutral-400 stroke-[2.5]" />} />
        <SidebarItem label="SETTINGS" href="/settings" icon={<SettingsIcon className="w-6 h-6 text-neutral-400 stroke-[2.5]" />} />
      </div>
    </div>
  );
}
