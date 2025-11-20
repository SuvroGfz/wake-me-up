// hooks/useAlarms.ts
import {useState, useCallback} from 'react';
import {Alarm} from '@/models/Alarm';
import {loadAlarms, toggleAlarmActive, deleteAlarm} from '@/services/alarmService';

export const useAlarms = () => {
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load all alarms
     */
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await loadAlarms();
            console.log("loaded alarms: ", data)
            setAlarms(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load alarms');
            console.error('[useAlarms] Load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Toggle alarm active state
     */
    const toggle = useCallback(async (id: string) => {
        try {
            const newState = await toggleAlarmActive(id);
            setAlarms(prev =>
                prev.map(a =>
                    a.id === id ? { ...a, active: newState, color: newState ? 'green' : 'red' } : a
                )
            );

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle alarm');
            console.error('[useAlarms] Toggle error:', err);
        }
    }, []);

    /**
     * Delete alarm
     */
    const remove = useCallback(async (id: string) => {
        try {
            const success = await deleteAlarm(id);
            if (success) {
                setAlarms((prev) => prev.filter((a) => a.id !== id));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete alarm');
            console.error('[useAlarms] Delete error:', err);
        }
    }, []);

    return {
        alarms,
        loading,
        error,
        refresh,
        toggle,
        remove,
    };
};