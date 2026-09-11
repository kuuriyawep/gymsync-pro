import { useEffect, useState } from "react";
import { gymData, gymDataError } from "@/lib/gymDataClient";

async function run(operation, payload = {}) {
  const result = await gymData(operation, payload);
  return result.staff || [];
}

export function useStaffAccess() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { run("listStaff").then(setStaff).catch(() => setStaff([])).finally(() => setLoading(false)); }, []);
  const invite = async (email, role) => { try { setStaff(await run("inviteStaff", { email, role })); } catch (error) { throw new Error(gymDataError(error, "Staff invitation failed")); } };
  const revoke = async (id) => { try { setStaff(await run("revokeStaff", { id })); } catch (error) { throw new Error(gymDataError(error, "Staff access update failed")); } };
  return { staff, loading, invite, revoke };
}
