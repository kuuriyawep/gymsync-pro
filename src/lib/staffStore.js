import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
const errorMessage = (error) => error?.response?.data?.error || error?.message || "Staff request failed";
async function run(operation, payload = {}) {
  const { data } = await supabase.auth.getSession();
  const response = await base44.functions.invoke("gymAccess", { operation, accessToken: data.session?.access_token, ...payload });
  return response.data.staff || [];
}
export function useStaffAccess() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { run("listStaff").then(setStaff).finally(() => setLoading(false)); }, []);
  const invite = async (email, role) => { try { setStaff(await run("inviteStaff", { email, role })); } catch (error) { throw new Error(errorMessage(error)); } };
  const revoke = async (id) => { try { setStaff(await run("revokeStaff", { id })); } catch (error) { throw new Error(errorMessage(error)); } };
  return { staff, loading, invite, revoke };
}