import { electronAPI } from "@/renderer/src/lib";
import { useQuery } from "@tanstack/react-query";

export default function useAdminManagement({ name, email, password, permissions }: { name: string; email: string; password: string; permissions: string[] }) {
  return useQuery({
    queryKey: ['create-clerk'],
    queryFn: () => electronAPI.adminManagement.createClerk({ name, email, password, permissions }),
  });
}