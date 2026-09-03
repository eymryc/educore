import { api } from "@/infrastructure/api/client";
import type {
  AdminDashboardData,
  ParentDashboardData,
  StudentDashboardData,
  TeacherDashboardData,
} from "@/shared/types/dashboard.types";

export function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return api.get<AdminDashboardData>("/dashboard/admin");
}

export function fetchTeacherDashboard(): Promise<TeacherDashboardData> {
  return api.get<TeacherDashboardData>("/dashboard/teacher");
}

export function fetchStudentDashboard(): Promise<StudentDashboardData> {
  return api.get<StudentDashboardData>("/dashboard/student");
}

export function fetchParentDashboard(): Promise<ParentDashboardData> {
  return api.get<ParentDashboardData>("/dashboard/parent");
}
