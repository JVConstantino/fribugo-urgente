import { Outlet } from "react-router-dom";
import { BreakingNewsTicker } from "./BreakingNewsTicker";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SponsorSlider } from "@/components/shared/SponsorSlider";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <BreakingNewsTicker />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <SponsorSlider />
      <Footer />
    </div>
  );
}
