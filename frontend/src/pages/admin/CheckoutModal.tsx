import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { X, Check, AlertTriangle, Plus, Trash2, Key, ClipboardCheck, DollarSign } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Room } from '../../types'

interface DeductionItem {
    name: string
    amount: number
}

interface ApplianceCheck {
    name: string
    ok: boolean
    note: string
    compensationPrice: number
}

interface CheckoutModalProps {
    isOpen: boolean
    onClose: () => void
    room: Room | null
    onSuccess: () => void
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, room, onSuccess }) => {
    const queryClient = useQueryClient()
    const [step, setStep] = useState(1) // 1: 电器检查, 2: 扣款, 3: 确认
    const [keyReturned, setKeyReturned] = useState(false)
    const [applianceChecks, setApplianceChecks] = useState<ApplianceCheck[]>([])
    const [deductions, setDeductions] = useState<DeductionItem[]>([])
    const [newDeductionName, setNewDeductionName] = useState('')
    const [newDeductionAmount, setNewDeductionAmount] = useState('')
    const [note, setNote] = useState('')

    // 初始化电器检查列表
    useEffect(() => {
        if (room?.appliances) {
            setApplianceChecks(room.appliances.map(a => ({
                name: a.name,
                ok: true,
                note: '',
                compensationPrice: a.compensationPrice
            })))
        }
    }, [room])

    // 重置状态
    useEffect(() => {
        if (!isOpen) {
            setStep(1)
            setKeyReturned(false)
            setApplianceChecks([])
            setDeductions([])
            setNewDeductionName('')
            setNewDeductionAmount('')
            setNote('')
        }
    }, [isOpen])

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await client.post(`/checkout/${room?.id}`, data)
            return res.data
        },
        onSuccess: () => {
            toast.success('退租办理成功！')
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
            onSuccess()
            onClose()
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '操作失败')
        }
    })

    // 计算总扣款
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)

    // 计算损坏电器赔偿
    const damagedApplianceDeductions = applianceChecks
        .filter(a => !a.ok)
        .reduce((sum, a) => sum + a.compensationPrice, 0)

    const totalDeductionsWithAppliances = totalDeductions + damagedApplianceDeductions
    const depositRefunded = (room?.deposit || 0) - totalDeductionsWithAppliances

    const handleAddDeduction = () => {
        if (!newDeductionName || !newDeductionAmount) return
        const amount = parseFloat(newDeductionAmount)
        if (isNaN(amount) || amount <= 0) return

        setDeductions([...deductions, { name: newDeductionName, amount }])
        setNewDeductionName('')
        setNewDeductionAmount('')
    }

    const handleRemoveDeduction = (index: number) => {
        setDeductions(deductions.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        // 合并损坏电器到扣款列表
        const allDeductions = [
            ...deductions,
            ...applianceChecks
                .filter(a => !a.ok)
                .map(a => ({ name: `${a.name} 损坏赔偿`, amount: a.compensationPrice }))
        ]

        mutation.mutate({
            depositRefunded: Math.max(0, depositRefunded),
            deductions: allDeductions,
            keyReturned,
            applianceCheckResult: applianceChecks.map(a => ({
                name: a.name,
                ok: a.ok,
                note: a.note || undefined
            })),
            note: note || undefined
        })
    }

    if (!isOpen || !room) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">办理退租</h2>
                        <p className="text-sm text-gray-500">{room.roomNumber}室 · {room.tenant?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center justify-center gap-2 p-3 bg-gray-50">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s ? 'bg-blue-500 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > s ? <Check size={16} /> : s}
                            </div>
                            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Step 1: 电器检查 */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-700 mb-4">
                                <ClipboardCheck size={20} />
                                <span className="font-medium">电器及设施检查</span>
                            </div>

                            {applianceChecks.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    该房间没有配置电器
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {applianceChecks.map((item, index) => (
                                        <div key={index} className="border rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">{item.name}</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const newChecks = [...applianceChecks]
                                                            newChecks[index].ok = true
                                                            setApplianceChecks(newChecks)
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${item.ok ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        完好
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const newChecks = [...applianceChecks]
                                                            newChecks[index].ok = false
                                                            setApplianceChecks(newChecks)
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!item.ok ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        损坏
                                                    </button>
                                                </div>
                                            </div>
                                            {!item.ok && (
                                                <div className="mt-2 p-2 bg-red-50 rounded-lg">
                                                    <p className="text-xs text-red-600 mb-1">赔偿金额: ¥{item.compensationPrice.toLocaleString()}</p>
                                                    <input
                                                        type="text"
                                                        placeholder="损坏备注（可选）"
                                                        value={item.note}
                                                        onChange={(e) => {
                                                            const newChecks = [...applianceChecks]
                                                            newChecks[index].note = e.target.value
                                                            setApplianceChecks(newChecks)
                                                        }}
                                                        className="w-full px-2 py-1.5 text-sm border border-red-200 rounded-lg"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 钥匙归还 */}
                            <div className="border rounded-xl p-3 mt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Key size={18} className="text-gray-500" />
                                        <span className="font-medium text-gray-900">钥匙归还</span>
                                    </div>
                                    <button
                                        onClick={() => setKeyReturned(!keyReturned)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${keyReturned ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {keyReturned ? '已归还' : '未归还'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: 扣款明细 */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-700 mb-4">
                                <DollarSign size={20} />
                                <span className="font-medium">扣款明细</span>
                            </div>

                            {/* 损坏电器自动扣款 */}
                            {damagedApplianceDeductions > 0 && (
                                <div className="bg-red-50 rounded-xl p-3 mb-4">
                                    <p className="text-sm font-medium text-red-700 mb-2">电器损坏赔偿（自动计算）</p>
                                    {applianceChecks.filter(a => !a.ok).map((a, i) => (
                                        <div key={i} className="flex justify-between text-sm text-red-600">
                                            <span>{a.name}</span>
                                            <span>¥{a.compensationPrice.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 自定义扣款列表 */}
                            <div className="space-y-2">
                                {deductions.map((d, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">{d.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">¥{d.amount.toLocaleString()}</span>
                                            <button
                                                onClick={() => handleRemoveDeduction(index)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 添加扣款 */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="扣款原因"
                                    value={newDeductionName}
                                    onChange={(e) => setNewDeductionName(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="金额"
                                    value={newDeductionAmount}
                                    onChange={(e) => setNewDeductionAmount(e.target.value)}
                                    className="w-24 px-3 py-2 border rounded-lg text-sm"
                                />
                                <button
                                    onClick={handleAddDeduction}
                                    className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* 备注 */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="其他说明..."
                                    className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: 确认 */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-700 mb-4">
                                <AlertTriangle size={20} className="text-amber-500" />
                                <span className="font-medium">确认退租信息</span>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">房间</span>
                                    <span className="font-medium">{room.roomNumber}室</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">租客</span>
                                    <span className="font-medium">{room.tenant?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">钥匙</span>
                                    <span className={`font-medium ${keyReturned ? 'text-green-600' : 'text-red-600'}`}>
                                        {keyReturned ? '已归还' : '未归还'}
                                    </span>
                                </div>
                                <div className="border-t pt-3 mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">应退押金</span>
                                        <span className="font-medium">¥{room.deposit.toLocaleString()}</span>
                                    </div>
                                    {totalDeductionsWithAppliances > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>扣款总额</span>
                                            <span>-¥{totalDeductionsWithAppliances.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                                        <span>实退押金</span>
                                        <span className="text-green-600">¥{Math.max(0, depositRefunded).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium"
                        >
                            上一步
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-medium"
                        >
                            下一步
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={mutation.isPending}
                            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50"
                        >
                            {mutation.isPending ? '处理中...' : '确认退租'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CheckoutModal
