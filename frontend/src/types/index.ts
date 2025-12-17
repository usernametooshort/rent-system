export type Role = 'admin' | 'tenant' | 'guest'

export interface User {
    id: string
    role: Role
    name?: string
    username?: string
    roomId?: string
    roomNumber?: string
}

export interface LoginResponse {
    accessToken: string
    refreshToken?: string
    user: User
}

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: {
        code: string
        message: string
        details?: any[]
    }
}

// 房屋相关类型
export type RoomStatus = 'vacant' | 'rented'

export interface Room {
    id: string
    roomNumber: string
    rent: number
    deposit: number
    status: RoomStatus
    images: RoomImage[]
    appliances: Appliance[]
    tenant?: {
        id: string
        name: string
        phone?: string
        leaseStartDate: string
    }
}

export interface RoomImage {
    id: string
    url: string
    order: number
}

export interface Appliance {
    id: string
    name: string
    compensationPrice: number
}
