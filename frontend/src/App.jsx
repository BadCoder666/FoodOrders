import { useState, useEffect } from 'react'
import api from './api.js'
import { useAuth } from './context/AuthContext.jsx'
import AuthPage from './components/AuthPage.jsx'
import OrderInput from './components/OrderInput.jsx'
import OrderForm from './components/OrderForm.jsx'
import OrderTable from './components/OrderTable.jsx'

export default function App() {
  const { isAuthenticated, user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('new')
  const [orders, setOrders] = useState([])
  const [parsedOrder, setParsedOrder] = useState(null)
  const [rawMessage, setRawMessage] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(false)

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const res = await api.get('/api/orders')
      setOrders(res.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    } else {
      setOrders([])
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <AuthPage />
  }

  const handleParsed = (data, message) => {
    setParsedOrder(data)
    setRawMessage(message)
  }

  const handleSave = () => {
    setParsedOrder(null)
    setRawMessage('')
    fetchOrders()
    setActiveTab('history')
  }

  const handleCancel = () => {
    setParsedOrder(null)
    setRawMessage('')
  }

  const handleUpdate = async (id, updatedFields) => {
    try {
      const res = await api.put(`/api/orders/${id}`, updatedFields)
      setOrders(prev => prev.map(o => (o.id === id ? res.data : o)))
    } catch (err) {
      console.error('Failed to update order:', err)
      alert('Failed to update order.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/orders/${id}`)
      setOrders(prev => prev.filter(o => o.id !== id))
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert('Failed to delete order.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white text-lg font-bold">
            F
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Food Order Logs</h1>
            <p className="text-xs text-gray-500">AI-powered order tracking</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
              {orders.length} order{orders.length !== 1 ? 's' : ''} logged
            </span>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <span className="text-xs text-gray-500 hidden sm:block">{user?.email}</span>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors font-medium"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'new'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            New Order
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Order History
            {orders.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="pb-12">
          {activeTab === 'new' && (
            <div>
              {!parsedOrder ? (
                <OrderInput onParsed={handleParsed} />
              ) : (
                <OrderForm
                  initialData={parsedOrder}
                  rawMessage={rawMessage}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading orders...</p>
                  </div>
                </div>
              ) : (
                <OrderTable
                  orders={orders}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
