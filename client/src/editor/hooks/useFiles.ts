import { useQuery } from "@tanstack/react-query";

export const useFiles = (instanceId: string) => {
  return useQuery<{ files: string[] }>({
    queryKey: ["files", instanceId],
    queryFn: async ({ signal }) => {
      const resp = await fetch(`http://127.0.0.1:8000/api/v1/edit/${instanceId}/files`, {
        signal,
      });

      if (!resp.ok) throw new Error(`http error: ${resp.status}`);
      const data = await resp.json();
      return data;
    },
  });
};
