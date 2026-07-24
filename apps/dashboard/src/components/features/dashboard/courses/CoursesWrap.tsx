import { getCourses } from "@/lib/dashboard/courses";
import CoursesList from "./CoursesList";
import { Suspense } from "react";
import CoursesSkeleton from "./CoursesSkeleton";
import { CourseCheckBadge } from "@/components/ui/icons";

export default async function MyCoursesSection() {
  const courses = await getCourses();
  return (
    <div className="space-y-0">
      <Suspense fallback={<CoursesSkeleton />}>
        <CoursesList data={courses} />
      </Suspense>
    </div>
  );
}
