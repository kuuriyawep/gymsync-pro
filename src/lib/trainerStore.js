import { useEffect, useState } from "react";
import { gymData, gymDataError } from "@/lib/gymDataClient";

export function useTrainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { const result = await gymData("listTrainers"); const rows = result.trainers || []; setTrainers(rows); return rows; };
  useEffect(() => { load().catch(() => setTrainers([])).finally(() => setLoading(false)); }, []);
  const perform = async (operation, payload = {}) => { try { await gymData(operation, payload); return await load(); } catch (error) { throw new Error(gymDataError(error, "Trainer request failed")); } };
  return {
    trainers,
    loading,
    createTrainer: (trainer) => perform("createTrainer", { trainer }),
    updateTrainer: (id, trainer) => perform("updateTrainer", { id, trainer }),
    toggleTrainer: (id) => perform("toggleTrainer", { id }),
    deleteTrainer: (id) => perform("deleteTrainer", { id }),
  };
}
