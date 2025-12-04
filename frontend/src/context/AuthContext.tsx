import React, { createContext, useState, useEffect, useContext } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any;
    login: (access: string, refresh: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                setIsAuthenticated(true);
                try {
                    // Import api here to avoid circular dependency if api uses useAuth (though api usually doesn't)
                    // Assuming api is imported at top level
                    const response = await import('../api/axios').then(m => m.default.get('/users/me/'));
                    setUser(response.data);
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    // Optional: logout if token is invalid
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (access: string, refresh: string) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setIsAuthenticated(true);
        try {
            const response = await import('../api/axios').then(m => m.default.get('/users/me/'));
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user profile after login", error);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
