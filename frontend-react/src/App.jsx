import { useState, useEffect } from 'react'
import axios from 'axios'
import './styles.css'

const API_BASE_URL = 'http://localhost'

export default function App() {
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setIsAuthenticated(true)
      setUser(JSON.parse(savedUser))
      loadData()
    } else {
      setLoading(false)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [productsRes, usersRes, ordersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}:3002/api/v1/products`, { headers }),
        axios.get(`${API_BASE_URL}:3001/api/v1/users`, { headers }),
        axios.get(`${API_BASE_URL}:3003/api/v1/orders`, { headers })
      ])

      setProducts(productsRes.data.data || [])
      setUsers(usersRes.data.data || [])
      setOrders(ordersRes.data.data || [])
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout()
      } else {
        setError('Error al cargar datos de los servicios')
        console.error('Error loading data:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await axios.post(`${API_BASE_URL}:3001/api/v1/auth/login`, loginData)
      const { token, user } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      setIsAuthenticated(true)
      setUser(user)
      setLoginData({ email: '', password: '' })
      loadData()
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
    setProducts([])
    setUsers([])
    setOrders([])
  }

  const renderLogin = () => (
    <div className="login-section">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
            placeholder="demo@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            required
            placeholder="test123"
          />
        </div>
        {loginError && <div className="error-message">{loginError}</div>}
        <button type="submit" disabled={loginLoading} className="login-button">
          {loginLoading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>
      <div className="demo-info">
        <h3>Credenciales de Demo:</h3>
        <p><strong>Email:</strong> demo@example.com</p>
        <p><strong>Contraseña:</strong> demo123</p>
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="data-section">
      <h2>Productos ({products.length})</h2>
      <div className="cards-grid">
        {products.map(product => (
          <div key={product.id} className="card">
            <h3>{product.nombre}</h3>
            <p className="price">${product.precio}</p>
            <p className="description">{product.descripcion}</p>
            <div className="card-footer">
              <span className="category">{product.categoria_nombre}</span>
              <span className={`status ${product.activo ? 'active' : 'inactive'}`}>
                {product.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="data-section">
      <h2>Usuarios ({users.length})</h2>
      <div className="cards-grid">
        {users.map(user => (
          <div key={user.id} className="card">
            <h3>{user.name}</h3>
            <p className="email">{user.email}</p>
            <p className="date">Creado: {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="data-section">
      <h2>Órdenes ({orders.length})</h2>
      <div className="cards-grid">
        {orders.map(order => (
          <div key={order.id} className="card order-card">
            <h3>{order.numero_orden}</h3>
            <p className="price">Total: ${order.total}</p>
            <p className="status">Estado: {order.estado}</p>
            <p className="user">Cliente: {order.usuario_nombre}</p>
            <div className="order-items">
              <h4>Items ({order.items?.length || 0}):</h4>
              {order.items?.slice(0, 3).map((item, index) => (
                <div key={index} className="order-item">
                  {item.producto_nombre} x{item.cantidad}
                </div>
              ))}
              {order.items?.length > 3 && <div className="order-item">...y {order.items.length - 3} más</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <main className="app-container">
        <section className="hero">
          <h1>Sales Management Microservices</h1>
          <p>Plataforma de gestión de ventas con microservicios</p>
          {renderLogin()}
        </section>
      </main>
    )
  }

  return (
    <main className="app-container">
      <section className="hero">
        <div className="header">
          <h1>Sales Management Microservices</h1>
          <div className="user-info">
            <span>Bienvenido, {user?.name}</span>
            <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
          </div>
        </div>
        <p>Dashboard con datos en tiempo real</p>

        <div className="controls">
          <button
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Productos
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuarios
          </button>
          <button
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Órdenes
          </button>
          <button className="refresh-button" onClick={loadData} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Cargando datos...</div>
        ) : (
          <>
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'orders' && renderOrders()}
          </>
        )}

        <div className="service-links">
          <h3>APIs Directas:</h3>
          <div className="links">
            <a href="http://localhost:3001/api/v1/users" target="_blank" rel="noreferrer">Usuarios API</a>
            <a href="http://localhost:3002/api/v1/products" target="_blank" rel="noreferrer">Productos API</a>
            <a href="http://localhost:3003/api/v1/orders" target="_blank" rel="noreferrer">Ventas API</a>
            <a href="http://localhost:3004/api/v1/inventory" target="_blank" rel="noreferrer">Inventario API</a>
            <a href="http://localhost:3005/api/v1/invoices" target="_blank" rel="noreferrer">Facturación API</a>
            <a href="http://localhost:3006/api/v1/notifications" target="_blank" rel="noreferrer">Notificaciones API</a>
          </div>
        </div>
      </section>
    </main>
  )
}
