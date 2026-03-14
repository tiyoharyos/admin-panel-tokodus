// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken } from '@/lib/auth';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = getToken();
        setIsAuthenticated(!!token);
        setLoading(false);
    }, []);

    const logout = () => {
        removeToken();
        setIsAuthenticated(false);
        router.push('/login');
    };

    return { isAuthenticated, loading, logout };
}