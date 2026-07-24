import CoursesWrap from "@/components/features/dashboard/courses/CoursesWrap";
import BottomNavWrap from "@/components/features/navigation/bottom-bar/dashboard-bar/BottomNavWrap";
import DashboardTopBar from "@/components/features/navigation/bottom-bar/dashboard-bar/DashboardTopBar";

export default function HomePage() {
  return (
    <>
      {/* Main column */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        <DashboardTopBar />
        {/* Only this part scrolls */}
        <main className="flex-1  overflow-y-auto md:px-3 pb-6 md:pt-2 md:-my-2 transition-opacity duration-900">
          <div className="space-y-6">
            <CoursesWrap />
          </div>
        </main>
      </div>
    </>
  );
}
