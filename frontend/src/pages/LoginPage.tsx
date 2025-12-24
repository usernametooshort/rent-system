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

        const [downloaded, setDownloaded] = useState(false);

        const handleDownloadProfile = async () => {
            try {
                // 1. Convert logo to base64
                const response = await fetch('/logo.png');
                const blob = await response.blob();
                const reader = new FileReader();

                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    // Remove data URL prefix (e.g., "data:image/png;base64,")
                    const iconBase64 = base64data.split(',')[1];

                    // 2. Generate UUIDs
                    const payloadUUID = crypto.randomUUID();
                    const contentUUID = crypto.randomUUID();

                    // 3. Create .mobileconfig XML
                    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>${iconBase64}</data>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>My 租客宝</string>
            <key>PayloadDescription</key>
            <string>Web Clip for My 租客宝</string>
            <key>PayloadDisplayName</key>
            <string>My 租客宝 Web Clip</string>
            <key>PayloadIdentifier</key>
            <string>com.rentsystem.webclip.${contentUUID}</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${contentUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${window.location.origin}</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>My 租客宝 Install Profile</string>
    <key>PayloadIdentifier</key>
    <string>com.rentsystem.profile.${payloadUUID}</string>
    <key>PayloadOrganization</key>
    <string>My 租客宝</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${payloadUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

                    // 4. Trigger Download
                    const blob = new Blob([xmlContent], { type: 'application/x-apple-aspen-config' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'RentSystem.mobileconfig';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    setDownloaded(true);

                    // 5. Attempt Redirect to Settings after a short delay
                    setTimeout(() => {
                        const shouldOpenSettings = window.confirm("描述文件已下载。是否跳转到“设置”进行安装？\n\n请前往：通用 -> VPN 与设备管理");
                        if (shouldOpenSettings) {
                            openSettings();
                        }
                    }, 1000);
                };

                reader.readAsDataURL(blob);

            } catch (error) {
                console.error('Failed to generate profile:', error);
                toast.error('生成描述文件失败，请重试');
            }
        };

        const openSettings = () => {
            // Try to open General settings which is the most reliable path
            // Deep linking to specific "ManagedConfigurationList" often fails on newer iOS

            // Attempt 1: Just Settings app
            window.location.href = 'App-Prefs:root=General';

            // Attempt 2: Older scheme
            setTimeout(() => {
                window.location.href = 'prefs:root=General';
            }, 500);

            // Attempt 3: Specific VPN path (sometimes works when General doesn't)
            setTimeout(() => {
                window.location.href = 'App-Prefs:root=General&path=VPN';
            }, 1000);
        };

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

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-2 bg-white text-xs text-gray-500">或者 (高级用户)</span>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadProfile}
                                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                下载描述文件 (免分享点击)
                            </button>

                            {downloaded && (
                                <div className="space-y-2">
                                    <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 border border-green-200">
                                        <p className="font-bold">✅ 已下载！请手动安装：</p>
                                        <p>1. 打开系统【设置】App</p>
                                        <p>2. 进入【通用】&rarr;【VPN 与设备管理】</p>
                                        <p>3. 点击【My 租客宝】并安装</p>
                                    </div>
                                    <button
                                        onClick={openSettings}
                                        className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center border border-blue-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        尝试跳转到设置 (可能失效)
                                    </button>
                                </div>
                            )}
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
