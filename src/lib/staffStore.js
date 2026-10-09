import { useCallback, useEffect, useState } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

const errorMessage = (error) => error?.response?.data?.error || error?.message || "Staff request failed";
async function request(operation, payload = {}) {
  const response = await invokeWithAuth("gymAccess", { operation, ...payload });
  return response.data || {};
}

export function useStaffAccess() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await request("listStaff");
      setStaff(Array.isArray(data.staff) ? data.staff : []);
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
      throw new Error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  const invite = async (fullName, email, role) => {
    try {
      await request("inviteStaff", { full_name: fullName, email, role });
      await refresh();
    } catch (error) { throw new Error(errorMessage(error)); }
  };

  const update = async (item) => {
    try {
      await request("updateStaff", {
        id: item.id,
        full_name: item.name,
        role: item.role,
        avatar_url: item.avatarUrl || null,
      });
      await refresh();
    } catch (error) { throw new Error(errorMessage(error)); }
  };

  const revoke = async (id) => {
    try {
      await request("revokeStaff", { id });
      await refresh();
    } catch (error) { throw new Error(errorMessage(error)); }
  };

  return { staff, loading, loadError, refresh, invite, update, revoke };
}
