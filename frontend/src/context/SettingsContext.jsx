import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        commissionRate: 10,
        deliveryCharge: 200,
        taxRate: 0,
        loading: true
    });

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/api/v1/settings');
            setSettings({
                ...data,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching global settings:', error);
            setSettings(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateGlobalSettings = async (payload) => {
        try {
            // Payload can be { commissionRate } or { deliveryCharge } or both
            const { data } = await api.put('/api/v1/settings', payload);
            setSettings({ ...data, loading: false });
            return { success: true };
        } catch (error) {
            console.error('Error updating settings:', error);
            return { success: false, error: error.response?.data?.message || 'Update failed' };
        }
    };

    return (
        <SettingsContext.Provider value={{ 
            ...settings, 
            updateGlobalSettings, 
            refreshSettings: fetchSettings 
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
