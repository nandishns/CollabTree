"use client"

import React, { createContext, useState, useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

type User = {
  id: string
  email: string
  createdAt: string
  accessToken: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        try {
          // Set default authorization header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error('Token verification failed:', error)
          handleLogout()
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Prevent render until initial auth check is complete
  if (loading) {
    return null
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password,
      })
      const { access_token, ...userData } = response.data
      const user: User = {
        id: userData.id,
        email: userData.email,
        createdAt: userData.created_at,
        accessToken: access_token,
      }
      setUser(user)
      localStorage.setItem('accessToken', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      router.replace('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error('Invalid credentials')
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        email,
        password,
      })
      const { access_token, ...userData } = response.data
      const user: User = {
        id: userData.id,
        email: userData.email,
        createdAt: userData.created_at,
        accessToken: access_token,
      }
      setUser(user)
      localStorage.setItem('accessToken', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration failed:', error)
      throw new Error('Registration failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout: handleLogout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

