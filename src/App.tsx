import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Lesson from "./pages/Lesson";
import Shop from "./pages/Shop";
import Leaderboard from "./pages/Leaderboard";
import Quests from "./pages/Quests";
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import Practice from "./pages/Practice";
import Settings from "./pages/Settings";
import { SignIn, SignUp, useAuth } from "@clerk/react";

function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return <>{children}</>;
}

function App() {
  const fetchUser = useUserStore((state) => state.fetchUser);
  const isLoading = useUserStore((state) => state.isLoading);
  const activeCourseId = useUserStore((state) => state.active_course_id);
  const setToken = useUserStore((state) => state.setToken);
  const { getToken } = useAuth();

  useEffect(() => {
    let safetyTimer = setTimeout(() => {
      useUserStore.setState({ isLoading: false });
    }, 2500);

    const initAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          setToken(token);
          await fetchUser();
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        clearTimeout(safetyTimer);
        useUserStore.setState({ isLoading: false });
      }
    };
    initAuth();

    return () => clearTimeout(safetyTimer);
  }, [getToken, setToken, fetchUser]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-green-500)]"></div></div>;
  }

  return (
    <>
      <SignedIn>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={activeCourseId ? <Home /> : <Navigate to="/courses" />} />
            <Route path="courses" element={<Courses />} />
            <Route path="shop" element={<Shop />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="quests" element={<Quests />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/practice" element={<Practice />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/lesson/:id" element={<Lesson />} />
        </Routes>
      </SignedIn>
      <SignedOut>
        <div className="h-screen w-full flex items-center justify-center bg-[var(--color-gray-bg)]">
          <Routes>
            <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" signInUrl="/" />} />
            <Route path="*" element={<SignIn routing="path" path="/" signUpUrl="/sign-up" />} />
          </Routes>
        </div>
      </SignedOut>
    </>
  );
}

export default App;
