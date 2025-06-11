import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import type { ClientFileData } from "@/types";

interface FilesResponse {
  files: ClientFileData[];
}

/**
 * Hook pour récupérer la liste des fichiers
 */
export function useFiles() {
  return useQuery({
    queryKey: queryKeys.files(),
    queryFn: async (): Promise<ClientFileData[]> => {
      const response = await ApiClient.get<FilesResponse>("/api/files");
      return response.files;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook pour récupérer un fichier spécifique
 */
export function useFile(id: string) {
  return useQuery({
    queryKey: queryKeys.file(id),
    queryFn: () => ApiClient.get<ClientFileData>(`/api/files/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour supprimer un seul fichier avec optimistic updates
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filename: string) =>
      ApiClient.delete(`/api/files/${filename}/delete`),
    onMutate: async (filename) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.files() });

      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData<ClientFileData[]>(
        queryKeys.files()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<ClientFileData[]>(
        queryKeys.files(),
        (old) => old?.filter((file) => file.name !== filename) ?? []
      );

      return { previousFiles };
    },

    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      queryClient.setQueryData(queryKeys.files(), context?.previousFiles);
      toast.error("Failed to delete file. Please try again.");
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });
    },

    onSuccess: () => {
      toast.success("File deleted successfully");
    },
  });
}

/**
 * Hook pour supprimer des fichiers avec optimistic updates
 */
export function useDeleteFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filenames: string[]) =>
      ApiClient.post("/api/bulk-delete", { filenames }),
    onMutate: async (filenames) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.files() });

      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData<ClientFileData[]>(
        queryKeys.files()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<ClientFileData[]>(
        queryKeys.files(),
        (old) => old?.filter((file) => !filenames.includes(file.name)) ?? []
      );

      return { previousFiles };
    },

    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      queryClient.setQueryData(queryKeys.files(), context?.previousFiles);
      toast.error("Failed to delete files. Please try again.");
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });
    },

    onSuccess: (data, variables) => {
      toast.success(`Successfully deleted ${variables.length} file(s)`);
    },
  });
}

/**
 * Hook pour upload de fichiers
 */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation<ClientFileData, Error, FormData>({
    mutationFn: async (formData: FormData): Promise<ClientFileData> => {
      const response = await ApiClient.uploadFile("/api/upload", formData);
      return response as ClientFileData;
    },

    onSuccess: (data: ClientFileData) => {
      // Add the new file to the cache
      queryClient.setQueryData<ClientFileData[]>(queryKeys.files(), (old) => [
        data,
        ...(old ?? []),
      ]);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });

      toast.success("File uploaded successfully");
    },

    onError: (error) => {
      toast.error("Upload failed. Please try again.");
      console.error("Upload error:", error);
    },
  });
}
