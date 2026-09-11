import { base44 } from "@/api/base44Client";

export async function gymData(operation, payload = {}) {
  const response = await base44.functions.invoke("gymData", { operation, ...payload });
  const data = response?.data ?? response;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function gymDataError(error, fallback = "Request failed") {
  return error?.response?.data?.error || error?.message || fallback;
}
