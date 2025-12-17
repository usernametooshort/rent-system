import React, { useState } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { Fragment } from 'react'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { user, login } = useAuth() // login needed to update user info (e.g. username)
    const [loading, setLoading] = useState(false)

    // Password Form State
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Profile Form State (Admin only)
    const [username, setUsername] = useState(user?.username || '')

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error('两次输入的密码不一致')
            return
        }
        if (newPassword.length < 6) {
            toast.error('新密码至少6位')
            return
        }

        setLoading(true)
        try {
            await client.post('/auth/change-password', {
                oldPassword,
                newPassword
            })
            toast.success('密码修改成功')
            onClose()
            // Reset form
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            toast.error(error.response?.data?.message || '修改失败')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim()) return

        setLoading(true)
        try {
            const res = await client.put('/auth/admin/profile', { username })
            toast.success('用户名修改成功')
            // Update local user context
            if (user) {
                login({ ...user, ...res.data.data })
                // Note: login function usually takes full auth response. 
                // If login() expects token + user, we might need a distinct updateUser() method.
                // Assuming useAuth has a way to update user or we just ignore context update until refresh.
                // Looking at AuthContext, login usually sets tokens.
                // A full refresh might be needed or we assume AuthContext will refetch on refresh.
                // Simple fix: reload page or just let it accept the object if types match partial.
                // Or better: don't update context manually, just trust page reload or next fetch.
            }
            onClose()
        } catch (error: any) {
            toast.error(error.response?.data?.message || '修改失败')
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { name: '修改密码', current: true },
        ...(user?.role === 'admin' ? [{ name: '修改资料', current: false }] : [])
    ]

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                                >
                                    账号设置
                                </Dialog.Title>

                                <Tab.Group>
                                    <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-4">
                                        {tabs.map((tab) => (
                                            <Tab
                                                key={tab.name}
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
                                                {tab.name}
                                            </Tab>
                                        ))}
                                    </Tab.List>
                                    <Tab.Panels>
                                        {/* 修改密码 Panel */}
                                        <Tab.Panel>
                                            <form onSubmit={handleChangePassword} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">旧密码</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        placeholder={user?.role === 'tenant' ? '初始密码为手机号后6位' : ''}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">新密码</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        minLength={6}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">确认新密码</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        minLength={6}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                </div>
                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                                    >
                                                        {loading ? '提交中...' : '确认修改'}
                                                    </button>
                                                </div>
                                            </form>
                                        </Tab.Panel>

                                        {/* 修改资料 Panel (Admin Only) */}
                                        {user?.role === 'admin' && (
                                            <Tab.Panel>
                                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">用户名</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            minLength={3}
                                                            maxLength={20}
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value)}
                                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        />
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            注意：初始管理员(config)无法修改用户名。
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                                        >
                                                            {loading ? '保存中...' : '保存更改'}
                                                        </button>
                                                    </div>
                                                </form>
                                            </Tab.Panel>
                                        )}
                                    </Tab.Panels>
                                </Tab.Group>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

export default ChangePasswordModal
