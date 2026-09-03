import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'SUPER_ADMIN' | 'ODONTOLOGO' | 'RECEPCIONISTA' | 'ADMIN_CLINICA' | 'PACIENTE';

interface AuthContextType {
    role: Role | null;
    isAuthenticated: boolean;
    login: (role: Role) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role | null>(() => {
        return (localStorage.getItem('role') as Role) || null;
    });

    const login = (newRole: Role) => {
        setRole(newRole);
        localStorage.setItem('role', newRole);
    };

    const logout = () => {
        setRole(null);
        localStorage.removeItem('role');
    };

    return (
        <AuthContext.Provider value={{ role, isAuthenticated: !!role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
