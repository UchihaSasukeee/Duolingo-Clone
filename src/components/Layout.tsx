import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="h-screen w-full flex flex-col-reverse md:flex-row bg-white overflow-hidden">
      <MobileNav />
      <Sidebar className="hidden md:flex flex-shrink-0" />
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-[72px] md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
