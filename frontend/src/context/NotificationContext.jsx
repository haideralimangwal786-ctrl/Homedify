import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { token, user } = useContext(AuthContext);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!token) return;
        try {
            const res = await axios.get('/api/v1/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    useEffect(() => {
        if (token && user) {
            fetchUnreadCount();
        } else {
            setUnreadCount(0);
        }
    }, [token, user]);

    // Refresh every 30 seconds for real-time feel
    useEffect(() => {
        if (!token || !user) return;
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [token, user]);

    return (
        <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refresh: fetchUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};
