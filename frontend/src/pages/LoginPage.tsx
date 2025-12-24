import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import { toast } from 'react-hot-toast'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'

const LoginPage: React.FC = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)

    // 管理员表单
    const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await client.post('/auth/admin-login', Object.fromEntries(formData))
            if (res.data.success) {
                login(res.data.data)
                navigate('/admin')
                toast.success('登录成功')
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || '登录失败')
        } finally {
            setLoading(false)
        }
    }

    // 租客表单
    const handleTenantLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await client.post('/auth/tenant-login', Object.fromEntries(formData))
            if (res.data.success) {
                login(res.data.data)
                navigate('/tenant')
                toast.success('欢迎回来')
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || '登录失败')
        } finally {
            setLoading(false)
        }
    }

    // PWA Install Prompt
    const [installPrompt, setInstallPrompt] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isMacSafari, setIsMacSafari] = useState(false)
    const [showGuide, setShowGuide] = useState(false)

    React.useEffect(() => {
        const ua = navigator.userAgent;
        // Check if device is iOS
        const isDeviceIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        setIsIOS(isDeviceIOS);

        // Check if device is MacOS Safari (desktop)
        // Safari on macOS usually has "Macintosh" and "Safari" but not "Chrome" (Chrome also has "Safari" in UA)
        const isDeviceMacSafari = /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
        setIsMacSafari(isDeviceMacSafari);

        const handler = (e: any) => {
            e.preventDefault()
            setInstallPrompt(e)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (isIOS || isMacSafari) {
            setShowGuide(true)
            return;
        }

        if (!installPrompt) return
        installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)
        setInstallPrompt(null)
    }

    // Install Guide Modal Component
    const InstallGuideModal = () => {
        if (!showGuide) return null;

        const title = isIOS ? "安装到 iPhone" : "安装到 Mac";

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowGuide(false)}>
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {isIOS ? (
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-blue-600">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                        <polyline points="16 6 12 2 8 6" />
                                        <line x1="12" y1="2" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">1. 点击“分享”按钮</p>
                                    <p className="text-sm text-gray-500 mt-1">通常在浏览器底部或顶部导航栏中。</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">2. 选择“添加到主屏幕”</p>
                                    <p className="text-sm text-gray-500 mt-1">向下滑动或左右滑动找到该选项。</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-primary-600">
                                    <span className="font-bold text-sm">Add</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">3. 点击右上角“添加”</p>
                                    <p className="text-sm text-gray-500 mt-1">完成后即可在桌面看到应用图标。</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-900">
                                    <span className="font-bold text-xs">File</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">1. 点击菜单栏“文件”</p>
                                    <p className="text-sm text-gray-500 mt-1">位于屏幕左上角的 Safari 菜单中。</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-primary-600">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">2. 选择“添加到程序坞”</p>
                                    <p className="text-sm text-gray-500 mt-1">Click "Add to Dock".</p>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                💡 提示：此功能需要 macOS Sonoma (Safari 17) 或更高版本。
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setShowGuide(false)}
                        className="mt-8 w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors"
                    >
                        知道了
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <InstallGuideModal />
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-8 pt-8 pb-6 bg-white flex flex-col items-center">
                        <img src="/logo.png" alt="My 租客宝" className="h-20 w-auto mb-4" />
                        <h1 className="text-3xl font-black text-primary-600 tracking-tight">My 租客宝</h1>
                        <p className="text-gray-500 mt-2 font-medium">安全、便捷的房屋管理平台</p>
                    </div>

                    <div className="p-8">
                        <Tab.Group>
                            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                                {['我是租客', '我是房东'].map((category) => (
                                    <Tab
                                        key={category}
                                        className={({ selected }) =>
                                            clsx(
                                                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                                                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                                                selected
                                                    ? 'bg-white shadow text-primary-700'
                                                    : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
                                            )
                                        }
                                    >
                                        {category}
                                    </Tab>
                                ))}
                            </Tab.List>
                            <Tab.Panels>
                                <Tab.Panel>
                                    <form onSubmit={handleTenantLogin} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">姓名</label>
                                            <input name="name" type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">房间号</label>
                                            <input name="roomNumber" type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">手机尾号 (6位)</label>
                                            <input name="phoneLast6" type="text" maxLength={6} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                        >
                                            {loading ? '登录中...' : '登录'}
                                        </button>
                                    </form>
                                </Tab.Panel>
                                <Tab.Panel>
                                    <form onSubmit={handleAdminLogin} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">用户名</label>
                                            <input name="username" type="text" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">密码</label>
                                            <input name="password" type="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                        >
                                            {loading ? '登录中...' : '管理员登录'}
                                        </button>
                                    </form>
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>

                        <div className="mt-6 flex flex-col items-center space-y-4">
                            <button
                                onClick={() => navigate('/')}
                                className="text-sm text-gray-500 hover:text-gray-900"
                            >
                                我是游客，先看看房源 &rarr;
                            </button>

                            {(installPrompt || isIOS || isMacSafari) && (
                                <button
                                    onClick={handleInstallClick}
                                    className="text-sm font-medium text-primary-600 bg-primary-50 px-4 py-2 rounded-full hover:bg-primary-100 transition-colors flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {(isIOS || isMacSafari) ? (isIOS ? '安装到 iPhone' : '安装到 Mac') : '添加到主屏幕'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default LoginPage
