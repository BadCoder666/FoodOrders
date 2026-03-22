import { useState } from 'react'
import api from '../api.js'

const EXAMPLE_MESSAGE = `Restaurant: Spice Garden
Customer: Sarah Johnson
Phone: 555-0192
Order: Butter Chicken x2, Garlic Naan x3
Total: $38.50
Payment: Paid`

export default function OrderInput({ onParsed }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleParse = async () => {
    if (!message.trim()) {
      setError('Please paste an order message first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/api/parse', { message })
      onParsed(res.data, message)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to parse the order. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleExample = () => {
    setMessage(EXAMPLE_MESSAGE)
    setError(null)
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Paste Order Message</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Paste any food order message and AI will extract the details automatically.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">
          <div>
            <textarea
              value={message}
              onChange={e => {
                setMessage(e.target.value)
                setError(null)
              }}
              placeholder="Paste your order message here...&#10;&#10;Example:&#10;Customer: John Doe&#10;Phone: 555-1234&#10;Order: 2x Margherita Pizza&#10;Total: $24.99&#10;Status: Unpaid"
              rows={8}
              className="w-full px-4 py-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-400 font-mono leading-relaxed"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleParse}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Parsing with AI...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Parse Order
                </>
              )}
            </button>
            <button
              onClick={handleExample}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Load Example
            </button>
            {message && (
              <button
                onClick={() => { setMessage(''); setError(null) }}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="mt-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2.5">
        <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-xs text-blue-700">
          The AI will extract restaurant name, customer name, phone number, dish ordered, quantity, amount, and payment status. You can review and edit before saving.
        </p>
      </div>
    </div>
  )
}
