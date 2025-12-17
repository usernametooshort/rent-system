import axios, { AxiosError } from 'axios'

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // 生产环境使用 VITE_API_URL，开发环境使用 /api (代理)
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器：自动附加 token
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器：统一错误处理和 token 刷新（简化版）
client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // 如果 401 且不是登录接口，可能需要刷新 token 或跳转登录
            // 简单起见，直接清除 token 并重定向（生产环境应实现静默刷新）
            // localStorage.removeItem('accessToken')
            // window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default client
