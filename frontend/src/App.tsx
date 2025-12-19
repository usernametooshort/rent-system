import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import GuestHome from './pages/GuestHome'
import LoginPage from './pages/LoginPage'
import TenantDashboard from './pages/TenantDashboard'
import TenantServices from './pages/TenantServices'
import TenantPayment from './pages/TenantPayment'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRooms from './pages/admin/AdminRooms'
import AdminServices from './pages/admin/AdminServices'

const NotFound = () => <div className="p-8 text-center text-gray-500">404 页面未找到</div>

// 路由守卫组件
const PrivateRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
    // 简单实现，实际应结合 AuthContext
    return <>{children}</>
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<GuestHome />} />

                    {/* 需要 Layout 的路由 */}
                    <Route element={<Layout />}>
                        {/* 管理员 */}
                        <Route path="/admin">
                            <Route index element={<AdminRooms />} /> {/* 默认显示房源 */}
                            <Route path="stats" element={<AdminDashboard />} />
                            <Route path="services" element={<AdminServices />} />
                        </Route>

                        {/* 租客 */}
                        <Route path="/tenant">
                            <Route index element={<TenantDashboard />} />
                            <Route path="services" element={<TenantServices />} />
                            <Route path="payment" element={<TenantPayment />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
