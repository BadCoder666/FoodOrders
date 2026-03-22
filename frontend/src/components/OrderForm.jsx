import { useState } from 'react'
import api from '../api.js'

const PAYMENT_STATUSES = ['Paid', 'Unpaid', 'Pending']

export default function OrderForm({ initialData, rawMessage, onSave, onCancel }) {
  const [form, setForm] = useState({
    menu_name: initialData?.menu_name || '',
    customer_name: initialData?.customer_name || '',
    phone_no: initialData?.phone_no || '',
    dish_ordered: initialData?.dish_ordered || '',
    quantity: initialData?.quantity ?? 1,
    order_amount: initialData?.order_amount ?? '',
    payment_status: initialData?.payment_status || 'Pending',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        quantity: form.quantity !== '' ? parseInt(form.quantity, 10) : null,
        order_amount: form.order_amount !== '' ? parseFloat(form.order_amount) : null,
        raw_message: rawMessage || null,
      }
      await api.post('/api/orders', payload)
      onSave()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save the order.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = "w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Review Extracted Order</h2>
            <p className="text-xs text-gray-500">Edit the fields below before saving.</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Row 1: Menu Name + Customer Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Restaurant / Menu</label>
              <input
                type="text"
                value={form.menu_name}
                onChange={e => handleChange('menu_name', e.target.value)}
                placeholder="e.g. Spice Garden"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Customer Name</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={e => handleChange('customer_name', e.target.value)}
                placeholder="e.g. John Doe"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Row 2: Phone + Dish */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="text"
                value={form.phone_no}
                onChange={e => handleChange('phone_no', e.target.value)}
                placeholder="e.g. 555-0192"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Dish Ordered</label>
              <input
                type="text"
                value={form.dish_ordered}
                onChange={e => handleChange('dish_ordered', e.target.value)}
                placeholder="e.g. Butter Chicken"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Row 3: Quantity + Amount + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => handleChange('quantity', e.target.value)}
                placeholder="1"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Order Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.order_amount}
                onChange={e => handleChange('order_amount', e.target.value)}
                placeholder="0.00"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Payment Status</label>
              <select
                value={form.payment_status}
                onChange={e => handleChange('payment_status', e.target.value)}
                className={fieldClass}
              >
                {PAYMENT_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Raw message preview */}
          {rawMessage && (
            <div>
              <label className={labelClass}>Original Message</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                {rawMessage}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Order
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
