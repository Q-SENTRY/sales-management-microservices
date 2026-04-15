import { useState, useEffect } from 'react'
import axios from 'axios'
import './styles.css'

const API_BASE_URL = 'http://localhost'
const COP_RATE = 4000

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
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
  const [systemStatus, setSystemStatus] = useState('operativo')
  const [failureActive, setFailureActive] = useState(false)
  const [logs, setLogs] = useState([
    { t: '10:42:18', svc: 'Ventas', msg: 'Orden #4821 creada correctamente', type: 'ok' },
    { t: '10:42:19', svc: 'Inventario', msg: 'Stock verificado: Laptop Pro 15" (12 unidades)', type: 'ok' },
    { t: '10:40:05', svc: 'Inventario', msg: 'Alerta: stock bajo en Teclado mecánico (3 uds)', type: 'warn' },
    { t: '10:38:14', svc: 'Ventas', msg: 'Timeout al conectar Inventario — reintento 1/3', type: 'warn' },
  ])
  const [logFilter, setLogFilter] = useState('all')
  const [formData, setFormData] = useState({
    cliente: '',
    email: '',
    producto: 'Laptop Pro 15"',
    qty: 1,
    pago: 'Tarjeta crédito',
    dir: '',
  })
  const [ventaResult, setVentaResult] = useState(null)
  const [flujoSteps, setFlujoSteps] = useState([])

  useEffect(() => {
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
        setError('Error al cargar datos')
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
    setCurrentPage('dashboard')
  }

  const formatPrice = (price) => {
    const cop = price * COP_RATE
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(cop)
  }

  const simulateFail = () => {
    if (failureActive) {
      setFailureActive(false)
      setSystemStatus('operativo')
      addLog('Notificaciones', 'Servicio recuperado — circuit breaker cerrado', 'ok')
    } else {
      setFailureActive(true)
      setSystemStatus('fallo')
      addLog('Notificaciones', 'FALLO: servicio no responde — circuit breaker abierto', 'err')
      addLog('Ventas', 'Evento en DLQ — reintento en 30s', 'warn')
    }
  }

  const addLog = (svc, msg, type) => {
    const now = new Date()
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    setLogs(prev => [{ t: time, svc, msg, type }, ...prev])
  }

  const procesarVenta = () => {
    const pasos = [
      { label: 'API Gateway recibe la solicitud', proto: 'HTTPS' },
      { label: 'Servicio de Ventas crea la orden', proto: 'REST' },
      { label: 'Consulta de stock al Inventario', proto: 'REST → Inventario' },
      { label: 'Inventario descuenta stock', proto: 'DB update' },
      { label: 'Factura generada', proto: 'Ventas DB' },
      { label: 'Evento publicado en RabbitMQ', proto: 'AMQP' },
      { label: `Email enviado a ${formData.email || 'cliente@email.com'}`, proto: 'SMTP' },
    ]
    setFlujoSteps(pasos)
    setVentaResult(`Venta procesada correctamente para ${formData.cliente || 'Cliente'}`)
    addLog('Ventas', `Nueva orden creada para ${formData.cliente}`, 'ok')
  }

  const renderLogin = () => (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h1 style={styles.loginTitle}>Gestión de Ventas</h1>
        <p style={styles.loginSubtitle}>Sistema de Microservicios</p>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email:</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
              placeholder="demo@example.com"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Contraseña:</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              placeholder="demo123"
              style={styles.input}
            />
          </div>
          {loginError && <div style={styles.errorMessage}>{loginError}</div>}
          <button type="submit" disabled={loginLoading} style={styles.loginButton}>
            {loginLoading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div style={styles.demoInfo}>
          <p style={{margin: '8px 0', fontSize: '13px'}}><strong>Demo:</strong> demo@example.com / demo123</p>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div>
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Ventas hoy</div>
          <div style={styles.metricValue}>{orders.length}</div>
          <div style={styles.metricDelta}>+12% vs ayer</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Ingresos</div>
          <div style={styles.metricValue}>${(orders.reduce((sum, o) => sum + (o.total || 0), 0) * COP_RATE | 0).toLocaleString('es-CO')}</div>
          <div style={styles.metricDelta}>+8% vs ayer</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Alertas activas</div>
          <div style={styles.metricValue}>2</div>
          <div style={styles.metricDelta}>Inventario bajo</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Uptime servicios</div>
          <div style={styles.metricValue}>99.8%</div>
          <div style={styles.metricDelta}>Todos OK</div>
        </div>
      </div>

      <div style={styles.twoCol}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Ventas por hora (hoy)</h3>
          <div style={styles.chartBars}>
            {[4, 7, 12, 9, 6, 8, 11, 13, 5].map((val, i) => (
              <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                <div style={{width: '100%', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '3px 3px 0 0', position: 'relative', overflow: 'hidden'}}>
                  <div style={{height: `${(val / 13) * 100}%`, backgroundColor: '#534AB7', width: '100%', position: 'absolute', bottom: 0}}></div>
                </div>
                <span style={{fontSize: '10px', color: '#999'}}>{'9am|10am|11am|12pm|1pm|2pm|3pm|4pm|5pm'.split('|')[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Últimas órdenes</h3>
          {orders.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id}>
                    <td>#{order.numero_orden}</td>
                    <td>{order.usuario_nombre}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td><span style={styles.statusPill}>{order.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin órdenes</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderVentas = () => (
    <div>
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Total órdenes</div>
          <div style={styles.metricValue}>{orders.length}</div>
          <div style={styles.metricDelta}>Este mes</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Completadas</div>
          <div style={styles.metricValue}>{orders.filter(o => o.estado === 'completado').length}</div>
          <div style={styles.metricDelta}>{Math.round((orders.filter(o => o.estado === 'completado').length / (orders.length || 1)) * 100)}%</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Pendientes</div>
          <div style={styles.metricValue}>{orders.filter(o => o.estado === 'pendiente').length}</div>
          <div style={styles.metricDelta}>En proceso</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Fallidas</div>
          <div style={styles.metricValue}>4</div>
          <div style={styles.metricDelta}>1.4%</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Historial de ventas</h3>
        {orders.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.numero_orden}</td>
                  <td>{order.usuario_nombre}</td>
                  <td>{order.items?.[0]?.producto_nombre || 'Producto'}</td>
                  <td>{order.items?.length || 1}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td><span style={styles.statusPill}>{order.estado}</span></td>
                  <td style={{fontSize: '12px', color: '#999'}}>{new Date(order.created_at).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin órdenes</p>
        )}
      </div>
    </div>
  )

  const renderInventario = () => (
    <div>
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Total SKUs</div>
          <div style={styles.metricValue}>{products.length}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Stock bajo</div>
          <div style={styles.metricValue}>2</div>
          <div style={styles.metricDelta}>Requiere reposición</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Agotados</div>
          <div style={styles.metricValue}>0</div>
          <div style={styles.metricDelta}>Sin quiebres</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Rotación</div>
          <div style={styles.metricValue}>4.2x</div>
          <div style={styles.metricDelta}>Mensual</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Stock por producto</h3>
        <div style={styles.invGrid}>
          {products.map(p => {
            const stockLevel = Math.random() * 25
            const color = stockLevel <= 3 ? '#E24B4A' : stockLevel <= 7 ? '#BA7517' : '#1D9E75'
            return (
              <div key={p.id} style={styles.invCard}>
                <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '8px'}}>{p.nombre}</div>
                <div style={{fontSize: '22px', fontWeight: '700', marginBottom: '4px', color: color}}>{Math.floor(stockLevel)}</div>
                <div style={{fontSize: '11px', color: '#666', marginBottom: '8px'}}>{p.categoria_nombre} · {formatPrice(p.precio)}</div>
                <div style={{height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden'}}>
                  <div style={{height: '100%', backgroundColor: color, width: `${Math.min((stockLevel / 25) * 100, 100)}%`}}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderNuevaVenta = () => (
    <div>
      <div style={styles.twoCol}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Registrar nueva venta</h3>
          <div style={{marginBottom: '12px'}}>
            <label style={styles.formLabel}>Cliente</label>
            <input
              type="text"
              value={formData.cliente}
              onChange={(e) => setFormData({...formData, cliente: e.target.value})}
              placeholder="Nombre del cliente"
              style={styles.input}
            />
          </div>
          <div style={{marginBottom: '12px'}}>
            <label style={styles.formLabel}>Email</label>
            <input
              type="text"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="correo@ejemplo.com"
              style={styles.input}
            />
          </div>
          <div style={{marginBottom: '12px'}}>
            <label style={styles.formLabel}>Producto</label>
            <select
              value={formData.producto}
              onChange={(e) => setFormData({...formData, producto: e.target.value})}
              style={styles.input}
            >
              {products.map(p => (
                <option key={p.id} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div style={{marginBottom: '12px'}}>
            <label style={styles.formLabel}>Cantidad</label>
            <input
              type="number"
              value={formData.qty}
              onChange={(e) => setFormData({...formData, qty: parseInt(e.target.value) || 1})}
              min="1"
              style={styles.input}
            />
          </div>
          <div style={{marginBottom: '12px'}}>
            <label style={styles.formLabel}>Método de pago</label>
            <select
              value={formData.pago}
              onChange={(e) => setFormData({...formData, pago: e.target.value})}
              style={styles.input}
            >
              <option>Tarjeta crédito</option>
              <option>Transferencia</option>
              <option>Efectivo</option>
            </select>
          </div>
          <div style={{marginBottom: '12px'}}>
            <label style={styles.formLabel}>Dirección envío</label>
            <input
              type="text"
              value={formData.dir}
              onChange={(e) => setFormData({...formData, dir: e.target.value})}
              placeholder="Calle, ciudad"
              style={styles.input}
            />
          </div>
          {ventaResult && (
            <div style={{padding: '10px', backgroundColor: '#E1F5EE', color: '#085041', borderRadius: '6px', marginBottom: '12px', fontSize: '13px'}}>
              ✓ {ventaResult}
            </div>
          )}
          <button style={styles.btnPrimary} onClick={procesarVenta}>
            Procesar venta
          </button>
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Estado del flujo</h3>
          <div>
            {flujoSteps.map((step, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>
                <span style={{width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#E1F5EE', color: '#085041', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', flexShrink: 0}}>
                  {i + 1}
                </span>
                <span style={{flex: 1, fontSize: '13px'}}>{step.label}</span>
                <span style={{fontSize: '11px', color: '#999', fontFamily: 'monospace'}}>{step.proto}</span>
                <span style={{fontSize: '12px', color: '#1D9E75'}}>OK</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderMicroservicios = () => (
    <div>
      <div style={styles.svcGrid}>
        {[
          { name: 'Usuarios', req: 142, lat: '18ms', cpu: 22 },
          { name: 'Productos', req: 98, lat: '12ms', cpu: 15 },
          { name: 'Ventas', req: 204, lat: '34ms', cpu: 48 },
          { name: 'Inventario', req: 189, lat: '21ms', cpu: 31 },
          { name: failureActive ? 'Notificaciones (FALLO)' : 'Notificaciones', req: 67, lat: '9ms', cpu: 8 },
        ].map((svc, i) => (
          <div key={i} style={{...styles.svcCard, borderColor: failureActive && i === 4 ? '#E24B4A' : '#e5e7eb'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
              <span style={{fontSize: '13px', fontWeight: '600'}}>{svc.name}</span>
              <span style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: failureActive && i === 4 ? '#E24B4A' : '#1D9E75'}}></span>
            </div>
            <div style={{fontSize: '11px', color: '#666', lineHeight: '1.6'}}>
              {svc.req} req/min · latencia {svc.lat}<br/>CPU: {svc.cpu}%
            </div>
            <div style={{height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden'}}>
              <div style={{height: '100%', backgroundColor: svc.cpu > 70 ? '#E24B4A' : svc.cpu > 50 ? '#BA7517' : '#1D9E75', width: `${svc.cpu}%`}}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Protocolos activos</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Origen</th>
              <th>Destino</th>
              <th>Protocolo</th>
              <th>Latencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {[
              {from: 'Ventas', to: 'Inventario', proto: 'REST GET', lat: '21ms'},
              {from: 'Ventas', to: 'RabbitMQ', proto: 'AMQP publish', lat: '4ms'},
              {from: 'RabbitMQ', to: 'Notificaciones', proto: 'AMQP consume', lat: '6ms'},
              {from: 'API Gateway', to: 'Usuarios', proto: 'HTTP/2', lat: '18ms'},
              {from: 'API Gateway', to: 'Productos', proto: 'HTTP/2', lat: '12ms'},
              {from: 'API Gateway', to: 'Ventas', proto: 'HTTP/2', lat: '34ms'},
            ].map((p, i) => (
              <tr key={i}>
                <td>{p.from}</td>
                <td>{p.to}</td>
                <td style={{fontFamily: 'monospace', fontSize: '12px'}}>{p.proto}</td>
                <td style={{fontFamily: 'monospace', fontSize: '12px'}}>{p.lat}</td>
                <td><span style={styles.statusPill}>OK</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderLogs = () => {
    const filtered = logs.filter(l => logFilter === 'all' || l.type === logFilter)
    return (
      <div style={styles.card}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'}}>
          <h3 style={{...styles.sectionTitle, margin: 0, flex: 1}}>Logs en tiempo real</h3>
          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            style={{...styles.input, width: '140px'}}
          >
            <option value="all">Todos</option>
            <option value="ok">OK</option>
            <option value="warn">Warning</option>
            <option value="err">Error</option>
          </select>
          <button style={styles.btn} onClick={() => addLog('Sistema', 'Evento simulado del sistema', ['ok', 'warn', 'err'][Math.floor(Math.random() * 3)])}>
            + Simular evento
          </button>
        </div>
        <div>
          {filtered.slice(0, 20).map((l, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px'}}>
              <span style={{color: '#999', minWidth: '54px', fontFamily: 'monospace'}}>{l.t}</span>
              <span style={{minWidth: '90px', fontWeight: '500', color: l.type === 'ok' ? '#1D9E75' : l.type === 'err' ? '#E24B4A' : '#BA7517'}}>
                {l.svc}
              </span>
              <span style={{color: '#666', flex: 1}}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderNotificaciones = () => (
    <div style={styles.card}>
      <h3 style={styles.sectionTitle}>Centro de notificaciones</h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
        {[
          {color: '#E24B4A', title: 'Circuit breaker activado', desc: 'Servicio de Notificaciones abrió el circuit breaker. 5 fallos consecutivos en SMTP.', time: 'Hace 7 min'},
          {color: '#BA7517', title: 'Stock bajo: Teclado mecánico', desc: 'Solo quedan 3 unidades. Se recomienda reposición urgente.', time: 'Hace 22 min'},
          {color: '#BA7517', title: 'Timeout en Inventario', desc: 'Orden #4818 falló por timeout. Se ejecutó retry 3/3 sin éxito.', time: 'Hace 25 min'},
          {color: '#1D9E75', title: 'Venta completada #4821', desc: 'Laptop Pro 15" — $980.00. Factura generada y email enviado.', time: 'Hace 30 min'},
          {color: '#1D9E75', title: 'Despliegue exitoso', desc: 'Servicio de Ventas actualizado a v2.4.1 sin interrupciones.', time: 'Hace 2 h'},
        ].map((n, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
            <div style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.color, marginTop: '3px', flexShrink: 0}}></div>
            <div style={{flex: 1}}>
              <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '2px'}}>{n.title}</div>
              <div style={{fontSize: '12px', color: '#666'}}>{n.desc}</div>
            </div>
            <div style={{fontSize: '11px', color: '#999', flexShrink: 0}}>{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return renderLogin()
  }

  const pages = {
    dashboard: renderDashboard,
    ventas: renderVentas,
    inventario: renderInventario,
    'nueva-venta': renderNuevaVenta,
    microservicios: renderMicroservicios,
    logs: renderLogs,
    notificaciones: renderNotificaciones,
  }

  const pageNames = {
    dashboard: 'Dashboard',
    ventas: 'Ventas',
    inventario: 'Inventario',
    'nueva-venta': 'Nueva venta',
    microservicios: 'Microservicios',
    logs: 'Logs',
    notificaciones: 'Notificaciones',
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ventas', label: 'Ventas', icon: '📋' },
    { id: 'inventario', label: 'Inventario', icon: '📦' },
    { id: 'nueva-venta', label: 'Nueva venta', icon: '➕' },
    { id: 'microservicios', label: 'Microservicios', icon: '⚙️' },
    { id: 'logs', label: 'Logs', icon: '📝' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
  ]

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoTitle}>VentaMS</div>
          <div style={styles.logoSub}>Sistema de ventas</div>
        </div>

        <div style={styles.navSection}>Principal</div>
        {navItems.map(item => (
          <div
            key={item.id}
            style={{...styles.navItem, ...(currentPage === item.id ? styles.navItemActive : {})}}
            onClick={() => setCurrentPage(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {item.label}
            {item.id === 'notificaciones' && (
              <span style={{minWidth: '18px', height: '18px', borderRadius: '9px', background: '#E24B4A', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto'}}>3</span>
            )}
          </div>
        ))}

        <div style={styles.sidebarFooter}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>{user?.name?.substring(0, 2).toUpperCase()}</div>
            <div>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {/* TOPBAR */}
        <div style={styles.topbar}>
          <div style={styles.topbarTitle}>{pageNames[currentPage]}</div>
          <span style={{...styles.topbarBadge, ...(systemStatus === 'operativo' ? styles.badgeOk : styles.badgeErr)}}>
            Sistema {systemStatus}
          </span>
          <button style={styles.btn} onClick={simulateFail}>
            {failureActive ? '✓ Fallo activo' : 'Simular fallo'}
          </button>
          <button style={styles.btn} onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div style={styles.pageContent}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              Cargando datos...
            </div>
          ) : (
            pages[currentPage]()
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    minHeight: '700px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1f2937',
  },
  sidebar: {
    width: '220px',
    minWidth: '220px',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    backgroundColor: '#ffffff',
  },
  logo: {
    padding: '0 16px 20px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '12px',
  },
  logoTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#534AB7',
  },
  logoSub: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px',
  },
  navSection: {
    fontSize: '11px',
    color: '#999',
    padding: '8px 16px 4px',
    letterSpacing: '0.04em',
    fontWeight: '500',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#666',
    transition: 'all 0.15s',
    borderRight: '2px solid transparent',
  },
  navItemActive: {
    backgroundColor: '#f3f4f6',
    color: '#534AB7',
    fontWeight: '500',
    borderRight: '2px solid #534AB7',
  },
  navIcon: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '14px',
  },
  sidebarFooter: {
    marginTop: 'auto',
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#EEEDFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: '#3C3489',
    flexShrink: 0,
  },
  userName: {
    fontSize: '13px',
    fontWeight: '500',
  },
  userRole: {
    fontSize: '11px',
    color: '#999',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  topbarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    flex: 1,
  },
  topbarBadge: {
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  badgeOk: {
    backgroundColor: '#E1F5EE',
    color: '#085041',
  },
  badgeErr: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
  },
  btn: {
    padding: '7px 14px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#1f2937',
    transition: 'all 0.15s',
  },
  btnPrimary: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#534AB7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  pageContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  metric: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '16px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  metricDelta: {
    fontSize: '11px',
    marginTop: '4px',
    color: '#10b981',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#1f2937',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  statusPill: {
    fontSize: '11px',
    padding: '2px 9px',
    borderRadius: '12px',
    display: 'inline-block',
    backgroundColor: '#E1F5EE',
    color: '#085041',
  },
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  },
  loginTitle: {
    fontSize: '28px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#534AB7',
    margin: '0 0 8px 0',
  },
  loginSubtitle: {
    fontSize: '14px',
    color: '#999',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  loginForm: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  loginButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#534AB7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  errorMessage: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '12px',
    borderLeft: '3px solid #E24B4A',
  },
  demoInfo: {
    backgroundColor: '#FAEEDA',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '3px solid #BA7517',
  },
  svcGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    marginBottom: '16px',
  },
  svcCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    padding: '14px',
  },
  invGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
  },
  invCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    padding: '12px',
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '6px',
    height: '120px',
    padding: '0 4px',
  },
}
import { useState, useEffect } from 'react'
import axios from 'axios'
import './styles.css'

const API_BASE_URL = 'http://localhost'
const COP_RATE = 4000

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
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
  const [systemStatus, setSystemStatus] = useState('operativo')

  useEffect(() => {
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
    setCurrentPage('dashboard')
  }

  const formatPrice = (price) => {
    const cop = price * COP_RATE
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(cop)
  }

  const renderLogin = () => (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h1 style={styles.loginTitle}>Gestión de Ventas</h1>
        <p style={styles.loginSubtitle}>Sistema de Microservicios</p>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email:</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
              placeholder="demo@example.com"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Contraseña:</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              placeholder="demo123"
              style={styles.input}
            />
          </div>
          {loginError && <div style={styles.errorMessage}>{loginError}</div>}
          <button type="submit" disabled={loginLoading} style={styles.loginButton}>
            {loginLoading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div style={styles.demoInfo}>
          <p style={{margin: '8px 0', fontSize: '13px'}}><strong>Demo:</strong> demo@example.com / demo123</p>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div>
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Ventas hoy</div>
          <div style={styles.metricValue}>{orders.length}</div>
          <div style={styles.metricDelta}>+12% vs ayer</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Ingresos</div>
          <div style={styles.metricValue}>${(orders.reduce((sum, o) => sum + (o.total || 0), 0) * COP_RATE | 0).toLocaleString('es-CO')}</div>
          <div style={styles.metricDelta}>+8% vs ayer</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Productos</div>
          <div style={styles.metricValue}>{products.length}</div>
          <div style={styles.metricDelta}>En inventario</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Usuarios</div>
          <div style={styles.metricValue}>{users.length}</div>
          <div style={styles.metricDelta}>Registrados</div>
        </div>
      </div>

      <div style={styles.twoCol}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Últimas Órdenes</h3>
          {orders.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id}>
                    <td>#{order.numero_orden}</td>
                    <td>{order.usuario_nombre}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td><span style={styles.statusPill}>{order.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin órdenes</p>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Top Productos</h3>
          {products.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map(product => (
                  <tr key={product.id}>
                    <td>{product.nombre}</td>
                    <td>{product.categoria_nombre}</td>
                    <td>{formatPrice(product.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin productos</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderProductos = () => (
    <div>
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Total SKUs</div>
          <div style={styles.metricValue}>{products.length}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Stock Total</div>
          <div style={styles.metricValue}>∞</div>
          <div style={styles.metricDelta}>Disponibles</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Categorías</div>
          <div style={styles.metricValue}>{new Set(products.map(p => p.categoria_nombre)).size}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Valor Inventario</div>
          <div style={styles.metricValue}>${(products.reduce((sum, p) => sum + (p.precio || 0), 0) * COP_RATE | 0).toLocaleString('es-CO')}</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Inventario de Productos</h3>
        {products.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td><strong>{product.nombre}</strong></td>
                  <td>{product.categoria_nombre}</td>
                  <td>{formatPrice(product.precio)}</td>
                  <td><span style={{...styles.statusPill, backgroundColor: product.activo ? '#E1F5EE' : '#FCEBEB', color: product.activo ? '#085041' : '#791F1F'}}>{product.activo ? 'Activo' : 'Inactivo'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin productos</p>
        )}
      </div>
    </div>
  )

  const renderUsuarios = () => (
    <div>
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Total Usuarios</div>
          <div style={styles.metricValue}>{users.length}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Activos Hoy</div>
          <div style={styles.metricValue}>{Math.ceil(users.length * 0.8)}</div>
          <div style={styles.metricDelta}>{Math.round((users.length * 0.8 / users.length) * 100)}%</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Nuevos esta semana</div>
          <div style={styles.metricValue}>3</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Retención</div>
          <div style={styles.metricValue}>94%</div>
          <div style={{...styles.metricDelta, color: '#1D9E75'}}>Excelente</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Lista de Usuarios</h3>
        {users.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Fecha Registro</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('es-CO')}</td>
                  <td><span style={styles.statusPill}>Activo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin usuarios</p>
        )}
      </div>
    </div>
  )

  const renderOrdenes = () => (
    <div>
      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Total órdenes</div>
          <div style={styles.metricValue}>{orders.length}</div>
          <div style={styles.metricDelta}>Este período</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Completadas</div>
          <div style={styles.metricValue}>{orders.filter(o => o.estado === 'completado').length}</div>
          <div style={styles.metricDelta}>{Math.round((orders.filter(o => o.estado === 'completado').length / (orders.length || 1)) * 100)}%</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Pendientes</div>
          <div style={styles.metricValue}>{orders.filter(o => o.estado === 'pendiente').length}</div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Ingresos Totales</div>
          <div style={styles.metricValue}>${(orders.reduce((sum, o) => sum + (o.total || 0), 0) * COP_RATE | 0).toLocaleString('es-CO')}</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Historial de Órdenes</h3>
        {orders.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><strong>#{order.numero_orden}</strong></td>
                  <td>{order.usuario_nombre}</td>
                  <td>{order.items?.length || 0}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td><span style={styles.statusPill}>{order.estado}</span></td>
                  <td style={{fontSize: '12px', color: '#999'}}>{new Date(order.created_at).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Sin órdenes registradas</p>
        )}
      </div>
    </div>
  )

  if (!isAuthenticated) {
    return renderLogin()
  }

  const pageNames = {
    dashboard: 'Dashboard',
    productos: 'Productos',
    usuarios: 'Usuarios',
    ordenes: 'Órdenes',
  }

  const pages = {
    dashboard: renderDashboard,
    productos: renderProductos,
    usuarios: renderUsuarios,
    ordenes: renderOrdenes,
  }

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoTitle}>VentaMS</div>
          <div style={styles.logoSub}>Sistema de ventas</div>
        </div>
        
        <div style={styles.navSection}>Principal</div>
        {['dashboard', 'productos', 'usuarios', 'ordenes'].map(page => (
          <div
            key={page}
            style={{...styles.navItem, ...(currentPage === page ? styles.navItemActive : {})}}
            onClick={() => setCurrentPage(page)}
          >
            <span style={styles.navIcon}>📊</span>
            {pageNames[page]}
          </div>
        ))}

        <div style={styles.sidebarFooter}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>{user?.name?.substring(0, 2).toUpperCase()}</div>
            <div>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {/* TOPBAR */}
        <div style={styles.topbar}>
          <div style={styles.topbarTitle}>{pageNames[currentPage]}</div>
          <span style={{...styles.topbarBadge, ...(systemStatus === 'operativo' ? styles.badgeOk : styles.badgeErr)}}>
            Sistema {systemStatus}
          </span>
          <button style={styles.btn} onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div style={styles.pageContent}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              Cargando datos...
            </div>
          ) : (
            pages[currentPage]()
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    minHeight: '700px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1f2937',
  },
  
  sidebar: {
    width: '220px',
    minWidth: '220px',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
    backgroundColor: '#ffffff',
  },
  
  logo: {
    padding: '0 16px 20px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '12px',
  },
  
  logoTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#534AB7',
  },
  
  logoSub: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px',
  },
  
  navSection: {
    fontSize: '11px',
    color: '#999',
    padding: '8px 16px 4px',
    letterSpacing: '0.04em',
    fontWeight: '500',
  },
  
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#666',
    transition: 'all 0.15s',
    borderRight: '2px solid transparent',
  },
  
  navItemActive: {
    backgroundColor: '#f3f4f6',
    color: '#534AB7',
    fontWeight: '500',
    borderRight: '2px solid #534AB7',
  },
  
  navIcon: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '14px',
  },
  
  sidebarFooter: {
    marginTop: 'auto',
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
  },
  
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#EEEDFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: '#3C3489',
    flexShrink: 0,
  },
  
  userName: {
    fontSize: '13px',
    fontWeight: '500',
  },
  
  userRole: {
    fontSize: '11px',
    color: '#999',
  },
  
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  
  topbarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    flex: 1,
  },
  
  topbarBadge: {
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  
  badgeOk: {
    backgroundColor: '#E1F5EE',
    color: '#085041',
  },
  
  badgeErr: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
  },
  
  btn: {
    padding: '7px 14px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#1f2937',
    transition: 'all 0.15s',
  },
  
  pageContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  
  metric: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '16px',
  },
  
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  
  metricDelta: {
    fontSize: '11px',
    marginTop: '4px',
    color: '#10b981',
  },
  
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#1f2937',
  },
  
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  
  statusPill: {
    fontSize: '11px',
    padding: '2px 9px',
    borderRadius: '12px',
    display: 'inline-block',
    backgroundColor: '#E1F5EE',
    color: '#085041',
  },
  
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px',
  },
  
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  },
  
  loginTitle: {
    fontSize: '28px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#534AB7',
    margin: '0 0 8px 0',
  },
  
  loginSubtitle: {
    fontSize: '14px',
    color: '#999',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  
  loginForm: {
    marginBottom: '20px',
  },
  
  formGroup: {
    marginBottom: '16px',
  },
  
  formLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937',
  },
  
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  
  loginButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#534AB7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  
  errorMessage: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '12px',
    borderLeft: '3px solid #E24B4A',
  },
  
  demoInfo: {
    backgroundColor: '#FAEEDA',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '3px solid #BA7517',
  },
}
