import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const message = (error) => error?.message || "Trainer request failed";

// Shapes a trainers row + its trainer_members links into exactly the object
// shape Trainers.jsx already expects (camelCase joinDate, assigned as a
// count, assignedMembers as an id list) so the UI needs zero changes.
function toUi(row, memberIdsByTrainer) {
  const assignedMembers = memberIdsByTrainer[row.id] || [];
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || "",
    email: row.email || "",
    specialization: row.specialization || "",
    joinDate: row.join_date || "",
    status: row.status,
    notes: row.notes || "",
    assigned: assignedMembers.length,
    assignedMembers,
    activity: Array.isArray(row.activity) ? row.activity : [],
  };
}

const toDb = (trainer) => ({
  name: trainer.name?.trim(),
  phone: trainer.phone || null,
  email: trainer.email || null,
  specialization: trainer.specialization || null,
  join_date: trainer.joinDate || null,
  status: trainer.status || "Active",
  notes: trainer.notes || null,
});

export function useTrainers() {
  const { profile } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [{ data: rows, error: trainersError }, { data: links, error: linksError }] = await Promise.all([
        supabase.from("trainers").select("*").order("created_at", { ascending: false }),
        supabase.from("trainer_members").select("trainer_id, member_id"),
      ]);
      if (trainersError) throw trainersError;
      if (linksError) throw linksError;
      const memberIdsByTrainer = {};
      for (const link of links || []) {
        (memberIdsByTrainer[link.trainer_id] ||= []).push(link.member_id);
      }
      const shaped = (rows || []).map((row) => toUi(row, memberIdsByTrainer));
      setTrainers(shaped);
      setError("");
      return shaped;
    } catch (err) {
      setTrainers([]);
      setError(message(err));
      return [];
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const perform = async (action) => {
    try { await action(); return await load(); }
    catch (err) { throw new Error(message(err)); }
  };

  return {
    trainers,
    loading,
    error,
    createTrainer: (trainer) => perform(async () => {
      const { error: err } = await supabase.from("trainers").insert({ ...toDb(trainer), gym_id: profile?.gym_id });
      if (err) throw err;
    }),
    updateTrainer: (id, trainer) => perform(async () => {
      const { error: err } = await supabase.from("trainers").update(toDb(trainer)).eq("id", id);
      if (err) throw err;
    }),
    toggleTrainer: (id) => perform(async () => {
      const current = trainers.find((item) => item.id === id);
      const { error: err } = await supabase.from("trainers").update({ status: current?.status === "Active" ? "Inactive" : "Active" }).eq("id", id);
      if (err) throw err;
    }),
    deleteTrainer: (id) => perform(async () => {
      const { error: err } = await supabase.from("trainers").delete().eq("id", id);
      if (err) throw err;
    }),
    // Not yet wired to any UI control (none exists in Trainers.jsx today) —
    // ready for when member-assignment UI is added, per the migration spec.
    assignMember: (trainerId, memberId) => perform(async () => {
      const { error: err } = await supabase.from("trainer_members").insert({ trainer_id: trainerId, member_id: memberId, gym_id: profile?.gym_id });
      if (err && err.code !== "23505") throw err; // 23505 = already assigned, treat as a no-op success
    }),
    removeMember: (trainerId, memberId) => perform(async () => {
      const { error: err } = await supabase.from("trainer_members").delete().eq("trainer_id", trainerId).eq("member_id", memberId);
      if (err) throw err;
    }),
  };
}
