import { useState } from 'react'

const PAYMENT_STATUSES = ['Paid', 'Unpaid', 'Pending']

const STATUS_STYLES = {
  Paid: 'bg-green-100 text-green-800 border-green-200',
  Unpaid: 'bg-red-100 text-red-800 border-red-200',
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const STATUS_HOVER = {
  Paid: 'hover:bg-green-200',
  Unpaid: 'hover:bg-red-200',
  Pending: 'hover:bg-yellow-200',
}

function formatDate(isoString) {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatAmount(amount) {
  if (amount == null) return '-'
  return `$${parseFloat(amount).toFixed(2)}`
}

function StatusBadge({ status, onCycle, updating }) {
  const currentStatus = status || 'Pending'
  const styleClass = STATUS_STYLES[currentStatus] || STATUS_STYLES.Pending
  const hoverClass = STATUS_HOVER[currentStatus] || STATUS_HOVER.Pending

  return (
    <button
      onClick={onCycle}
      disabled={updating}
      title="Click to change status"
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${styleClass} ${hoverClass} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {updating ? (
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block"></span>
          {currentStatus}
        </span>
      ) : currentStatus}
    </button>
  )
}

export default function OrderTable({ orders, onUpdate, onDelete }) {
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const handleCycleStatus = async (order) => {
    const currentIndex = PAYMENT_STATUSES.indexOf(order.payment_status || 'Pending')
    const nextStatus = PAYMENT_STATUSES[(currentIndex + 1) % PAYMENT_STATUSES.length]
    setUpdatingId(order.id)
    await onUpdate(order.id, { payment_status: nextStatus })
    setUpdatingId(null)
  }

  const handleDelete = async (order) => {
    const confirmed = window.confirm(
      `Delete order for "${order.customer_name || 'Unknown customer'}"? This cannot be undone.`
    )
    if (!confirmed) return
    setDeletingId(order.id)
    await onDelete(order.id)
    setDeletingId(null)
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">No orders yet</h3>
        <p className="text-sm text-gray-400">Parse and save an order to see it here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Summary row */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{orders.length}</span> order{orders.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-4 text-xs text-gray-500">
          {['Paid', 'Unpaid', 'Pending'].map(s => {
            const count = orders.filter(o => (o.payment_status || 'Pending') === s).length
            return count > 0 ? (
              <span key={s} className={`px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[s]}`}>
                {s}: {count}
              </span>
            ) : null
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Menu', 'Customer', 'Phone', 'Dish', 'Qty', 'Amount', 'Status', 'Created At', 'Actions'].map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map(order => (
              <tr
                key={order.id}
                className={`hover:bg-gray-50 transition-colors ${deletingId === order.id ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap max-w-[140px] truncate" title={order.menu_name}>
                  {order.menu_name || <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[120px] truncate" title={order.customer_name}>
                  {order.customer_name || <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                  {order.phone_no || <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={order.dish_ordered}>
                  {order.dish_ordered || <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-700 text-center">
                  {order.quantity ?? <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                  {formatAmount(order.order_amount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={order.payment_status}
                    onCycle={() => handleCycleStatus(order)}
                    updating={updatingId === order.id}
                  />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(order)}
                    disabled={deletingId === order.id || updatingId === order.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete order"
                  >
                    {deletingId === order.id ? (
                      <span className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
