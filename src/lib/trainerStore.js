import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const message = (error) => error?.response?.data?.error || error?.message || "Trainer request failed";

export function useTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const user = await base44.auth.me();
    const rows = await base44.entities.Trainer.filter({ created_by_id: user.id }, "-created_date");
    setTrainers(rows);
    return rows;
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const perform = async (action) => {
    try { await action(); return await load(); }
    catch (error) { throw new Error(message(error)); }
  };

  return {
    trainers,
    loading,
    createTrainer: (trainer) => perform(() => base44.entities.Trainer.create({ ...trainer, assigned: 0, assignedMembers: [], activity: [] })),
    updateTrainer: (id, trainer) => perform(() => base44.entities.Trainer.update(id, trainer)),
    toggleTrainer: (id) => perform(() => base44.entities.Trainer.update(id, { status: trainers.find((item) => item.id === id)?.status === "Active" ? "Inactive" : "Active" })),
    deleteTrainer: (id) => perform(() => base44.entities.Trainer.delete(id)),
  };
}