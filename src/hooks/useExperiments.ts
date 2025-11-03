'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { firestoreClient } from '@/lib/firestore/client';
import { Experiment } from '@/lib/firestore/schema';

export function useExperiments(labId?: string) {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load experiments on mount
  useEffect(() => {
    if (!user) {
      setExperiments([]);
      setLoading(false);
      return;
    }

    const loadExperiments = async () => {
      try {
        setLoading(true);
        const data = await firestoreClient.getUserExperiments(user.uid, labId);
        setExperiments(data);
        setError(null);
      } catch (err: any) {
        console.error('Error loading experiments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadExperiments();
  }, [user, labId]);

  // Save new experiment
  const saveExperiment = async (experiment: Omit<Experiment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const id = await firestoreClient.saveExperiment(user.uid, experiment);

      // Refresh experiments list
      const updated = await firestoreClient.getUserExperiments(user.uid, labId);
      setExperiments(updated);

      return id;
    } catch (err) {
      console.error('Error saving experiment:', err);
      throw err;
    }
  };

  // Update existing experiment
  const updateExperiment = async (id: string, updates: Partial<Experiment>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await firestoreClient.updateExperiment(id, updates);

      // Refresh experiments list
      const updated = await firestoreClient.getUserExperiments(user.uid, labId);
      setExperiments(updated);
    } catch (err) {
      console.error('Error updating experiment:', err);
      throw err;
    }
  };

  // Delete experiment
  const deleteExperiment = async (id: string) => {
    try {
      await firestoreClient.deleteExperiment(id);

      // Remove from local state
      setExperiments(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      console.error('Error deleting experiment:', err);
      throw err;
    }
  };

  return {
    experiments,
    loading,
    error,
    saveExperiment,
    updateExperiment,
    deleteExperiment
  };
}
