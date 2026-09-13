import { useEffect, useState } from "react";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
const errorMessage = (error) => error?.response?.data?.error || error?.message || "Staff request failed";
async function run(operation, payload = {}) {
  const response = await invokeWithAuth("gymAccess", { operation, ...payload });
  return response.data.staff || [];
}
export function useStaffAccess() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { run("listStaff").then(setStaff).finally(() => setLoading(false)); }, []);
  const invite = async (fullName, email, role) => { try { setStaff(await run("inviteStaff", { full_name: fullName, email, role })); } catch (error) { throw new Error(errorMessage(error)); } };
  const revoke = async (id) => { try { setStaff(await run("revokeStaff", { id })); } catch (error) { throw new Error(errorMessage(error)); } };
  return { staff, loading, invite, revoke };
}