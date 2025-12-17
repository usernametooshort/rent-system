import React, { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'
import { User, LoginResponse } from '../types'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (data: LoginResponse) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // 初始化时从 localStorage 恢复用户状态
        const initAuth = () => {
            try {
                const storedUser = localStorage.getItem('user')
                const token = localStorage.getItem('accessToken')

                if (token && storedUser) {
                    setUser(JSON.parse(storedUser))
                }
            } catch (e) {
                console.error('Failed to restore auth state', e)
                localStorage.clear()
            } finally {
                setIsLoading(false)
            }
        }
        initAuth()
    }, [])

    const login = (data: LoginResponse) => {
        localStorage.setItem('accessToken', data.accessToken)
        if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken)
        }
        localStorage.setItem('user', JSON.stringify(data.user)) // 简单存储，实际应 fetch profile
        setUser(data.user)
    }

    const logout = () => {
        localStorage.clear()
        setUser(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                logout,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
