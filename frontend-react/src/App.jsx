import React, { useState } from 'react'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
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

  const handleLogin = (e) => {
    e.preventDefault()
    if (loginData.email === 'demo@example.com' && loginData.password === 'demo123') {
      setIsAuthenticated(true)
      setUser({ name: 'Ana Martínez' })
      setLoginData({ email: '', password: '' })
      setLoginError('')
    } else {
      setLoginError('Credenciales incorrectas')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setCurrentPage('dashboard')
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

  const formatPrice = (price) => `$${price.toLocaleString('es-CO')}`

  const renderLogin = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', color: '#534AB7', margin: '0 0 8px 0' }}>Gestión de Ventas</h1>
        <p style={{ fontSize: '14px', color: '#999', textAlign: 'center', margin: '0 0 24px 0' }}>Sistema de Microservicios</p>
        <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>Email:</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
              placeholder="demo@example.com"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>Contraseña:</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              placeholder="demo123"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          {loginError && <div style={{ backgroundColor: '#FCEBEB', color: '#791F1F', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', borderLeft: '3px solid #E24B4A' }}>{loginError}</div>}
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#534AB7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>
            Iniciar Sesión
          </button>
        </form>
        <div style={{ backgroundColor: '#FAEEDA', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #BA7517' }}>
          <p style={{ margin: '8px 0', fontSize: '13px' }}><strong>Demo:</strong> demo@example.com / demo123</p>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Ventas hoy</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>48</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>+12% vs ayer</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Ingresos</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>$3,840</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>+8% vs ayer</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Alertas activas</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>2</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>Inventario bajo</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Uptime servicios</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>99.8%</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>Todos OK</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Ventas por hora (hoy)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', padding: '0 4px' }}>
            {[4, 7, 12, 9, 6, 8, 11, 13, 5].map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '100%', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '3px 3px 0 0', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: `${(val / 13) * 100}%`, backgroundColor: '#534AB7', width: '100%', position: 'absolute', bottom: 0 }}></div>
                </div>
                <span style={{ fontSize: '10px', color: '#999' }}>{['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Últimas órdenes</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Orden</th>
                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Cliente</th>
                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Monto</th>
                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: '#4821', cliente: 'Carlos R.', monto: '$980', estado: 'ok' },
                { id: '#4820', cliente: 'María L.', monto: '$420', estado: 'proc' },
                { id: '#4819', cliente: 'Jorge P.', monto: '$240', estado: 'ok' },
                { id: '#4818', cliente: 'Ana S.', monto: '$89', estado: 'fail' },
                { id: '#4817', cliente: 'Luis M.', monto: '$35', estado: 'ok' },
              ].map(order => (
                <tr key={order.id}>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.id}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.cliente}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.monto}</td>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 9px',
                      borderRadius: '12px',
                      display: 'inline-block',
                      backgroundColor: order.estado === 'ok' ? '#E1F5EE' : order.estado === 'fail' ? '#FCEBEB' : '#EEEDFE',
                      color: order.estado === 'ok' ? '#085041' : order.estado === 'fail' ? '#791F1F' : '#3C3489',
                    }}>
                      {order.estado === 'ok' ? 'Completado' : order.estado === 'fail' ? 'Fallido' : 'Procesando'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderVentas = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total órdenes</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>284</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>Este mes</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Completadas</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>271</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>95.4%</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Pendientes</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>9</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>En proceso</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Fallidas</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>4</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>1.4%</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Historial de ventas</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Orden</th>
              <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Cliente</th>
              <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Producto</th>
              <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
              <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Total</th>
              <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
              <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: '#4821', cli: 'Carlos R.', prod: 'Laptop Pro 15"', qty: 1, total: '$980', estado: 'ok', fecha: '15 abr' },
              { id: '#4820', cli: 'María L.', prod: 'Monitor 27" 4K', qty: 1, total: '$420', estado: 'proc', fecha: '15 abr' },
              { id: '#4819', cli: 'Jorge P.', prod: 'Auriculares BT', qty: 2, total: '$240', estado: 'ok', fecha: '15 abr' },
              { id: '#4818', cli: 'Ana S.', prod: 'Teclado mecánico', qty: 1, total: '$89', estado: 'fail', fecha: '15 abr' },
              { id: '#4817', cli: 'Luis M.', prod: 'Hub USB-C', qty: 3, total: '$105', estado: 'ok', fecha: '14 abr' },
            ].map(order => (
              <tr key={order.id}>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.id}</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.cli}</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.prod}</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.qty}</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>{order.total}</td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 9px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    backgroundColor: order.estado === 'ok' ? '#E1F5EE' : order.estado === 'fail' ? '#FCEBEB' : '#EEEDFE',
                    color: order.estado === 'ok' ? '#085041' : order.estado === 'fail' ? '#791F1F' : '#3C3489',
                  }}>
                    {order.estado === 'ok' ? 'Completado' : order.estado === 'fail' ? 'Fallido' : 'Procesando'}
                  </span>
                </td>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#666', fontSize: '12px' }}>{order.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderInventario = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total SKUs</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>24</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Stock bajo</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>2</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>Requiere reposición</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Agotados</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>0</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>Sin quiebres</div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Rotación</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>4.2x</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: '#10b981' }}>Mensual</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Stock por producto</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { name: 'Laptop Pro 15"', stock: 12, cat: 'Electrónica', precio: 980 },
            { name: 'Monitor 27" 4K', stock: 7, cat: 'Electrónica', precio: 420 },
            { name: 'Teclado mecánico', stock: 3, cat: 'Periféricos', precio: 89 },
            { name: 'Mouse inalámbrico', stock: 2, cat: 'Periféricos', precio: 45 },
            { name: 'Auriculares BT', stock: 18, cat: 'Audio', precio: 120 },
            { name: 'Webcam HD', stock: 9, cat: 'Electrónica', precio: 75 },
            { name: 'Hub USB-C', stock: 22, cat: 'Accesorios', precio: 35 },
            { name: 'SSD 1TB', stock: 5, cat: 'Almacenamiento', precio: 110 },
          ].map(p => {
            const stockLevel = p.stock
            const color = stockLevel <= 3 ? '#E24B4A' : stockLevel <= 7 ? '#BA7517' : '#1D9E75'
            return (
              <div key={p.name} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#ffffff', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{p.name}</div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px', color: color }}>{stockLevel}</div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>{p.cat} · {formatPrice(p.precio)}</div>
                <div style={{ height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: color, width: `${Math.min((stockLevel / 25) * 100, 100)}%` }}></div>
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
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', maxWidth: '580px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Registrar nueva venta</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Cliente</div>
            <input
              type="text"
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              placeholder="Nombre del cliente"
              style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#1f2937' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Email</div>
            <input
              type="text"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#1f2937' }}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Producto</div>
            <select
              value={formData.producto}
              onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
              style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#1f2937' }}
            >
              <option>Laptop Pro 15"</option>
              <option>Monitor 27" 4K</option>
              <option>Teclado mecánico</option>
              <option>Mouse inalámbrico</option>
              <option>Auriculares BT</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Cantidad</div>
            <input
              type="number"
              value={formData.qty}
              onChange={(e) => setFormData({ ...formData, qty: parseInt(e.target.value) || 1 })}
              min="1"
              style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#1f2937' }}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Método de pago</div>
            <select
              value={formData.pago}
              onChange={(e) => setFormData({ ...formData, pago: e.target.value })}
              style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#1f2937' }}
            >
              <option>Tarjeta crédito</option>
              <option>Transferencia</option>
              <option>Efectivo</option>
              <option>PayPal</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Dirección envío</div>
            <input
              type="text"
              value={formData.dir}
              onChange={(e) => setFormData({ ...formData, dir: e.target.value })}
              placeholder="Calle, ciudad"
              style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#1f2937' }}
            />
          </div>
        </div>
        {ventaResult && (
          <div style={{ padding: '10px 14px', backgroundColor: '#E1F5EE', color: '#085041', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
            ✓ {ventaResult}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: '#534AB7', color: '#ffffff', borderColor: '#534AB7' }} onClick={procesarVenta}>
            Procesar venta
          </button>
          <button style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'transparent', color: '#1f2937' }} onClick={() => setFormData({ cliente: '', email: '', producto: 'Laptop Pro 15"', qty: 1, pago: 'Tarjeta crédito', dir: '' })}>
            Limpiar
          </button>
        </div>
      </div>
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', maxWidth: '580px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Estado del flujo</h3>
        <div>
          {flujoSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#E1F5EE', color: '#085041', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: '13px' }}>{step.label}</span>
              <span style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>{step.proto}</span>
              <span style={{ fontSize: '12px', color: '#1D9E75' }}>OK</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderMicroservicios = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[
          { name: 'API Gateway', port: '3000', status: 'ok', req: 142, lat: '18ms', cpu: 22 },
          { name: 'Auth Service', port: '3001', status: 'ok', req: 98, lat: '12ms', cpu: 15 },
          { name: 'Products', port: '3002', status: 'ok', req: 204, lat: '34ms', cpu: 48 },
          { name: 'Orders', port: '3003', status: 'ok', req: 189, lat: '21ms', cpu: 31 },
          { name: 'Inventory', port: '3004', status: 'ok', req: 67, lat: '9ms', cpu: 8 },
        ].map(svc => (
          <div key={svc.name} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#ffffff', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{svc.name}</h4>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            </div>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
              {svc.req} req/min · latencia {svc.lat}<br />CPU: {svc.cpu}%
            </div>
            <div style={{ height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: svc.cpu > 70 ? '#E24B4A' : svc.cpu > 50 ? '#BA7517' : '#1D9E75', width: `${svc.cpu}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Arquitectura del Sistema</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🌐</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Frontend React</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Interfaz de usuario moderna con Vite</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚙️</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Microservicios Node.js</div>
              <div style={{ fontSize: '12px', color: '#666' }}>API REST independientes con Express</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🐰</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>RabbitMQ</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Mensajería asíncrona entre servicios</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🗄️</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>MySQL</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Base de datos relacional para persistencia</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLogs = () => {
    const filteredLogs = logs.filter(log => logFilter === 'all' || log.type === logFilter)

    return (
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, flex: 1, color: '#1f2937' }}>Registro de Eventos</h3>
          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'transparent', color: '#1f2937', width: '140px' }}
          >
            <option value="all">Todos</option>
            <option value="ok">OK</option>
            <option value="warn">Advertencias</option>
            <option value="err">Errores</option>
          </select>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredLogs.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Hora</th>
                  <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Servicio</th>
                  <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Mensaje</th>
                  <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '500', color: '#666', padding: '0 0 8px', borderBottom: '1px solid #e5e7eb' }}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>{log.t}</td>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '500' }}>{log.svc}</td>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#666' }}>{log.msg}</td>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#1f2937' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: log.type === 'ok' ? '#E1F5EE' : log.type === 'warn' ? '#FEF3C7' : '#FCEBEB',
                        color: log.type === 'ok' ? '#085041' : log.type === 'warn' ? '#92400E' : '#991B1B',
                      }}>
                        {log.type === 'ok' ? 'OK' : log.type === 'warn' ? 'WARN' : 'ERR'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No hay logs con el filtro seleccionado</p>
          )}
        </div>
      </div>
    )
  }

  const renderNotificaciones = () => (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Centro de notificaciones</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { color: '#E24B4A', title: 'Circuit breaker activado', desc: 'Servicio de Notificaciones abrió el circuit breaker. 5 fallos consecutivos en SMTP.', time: 'Hace 7 min' },
          { color: '#BA7517', title: 'Stock bajo: Teclado mecánico', desc: 'Solo quedan 3 unidades. Se recomienda reposición urgente.', time: 'Hace 22 min' },
          { color: '#BA7517', title: 'Timeout en Inventario', desc: 'Orden #4818 falló por timeout. Se ejecutó retry 3/3 sin éxito.', time: 'Hace 25 min' },
          { color: '#1D9E75', title: 'Venta completada #4821', desc: 'Laptop Pro 15" — $980.00. Factura generada y email enviado.', time: 'Hace 30 min' },
          { color: '#1D9E75', title: 'Despliegue exitoso', desc: 'Servicio de Ventas actualizado a v2.4.1 sin interrupciones.', time: 'Hace 2 h' },
        ].map((n, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.color, marginTop: '3px', flexShrink: 0 }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{n.title}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{n.desc}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#999', flexShrink: 0 }}>{n.time}</div>
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
    <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* SIDEBAR */}
      <div style={{ width: '220px', minWidth: '220px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '16px 0', backgroundColor: '#ffffff' }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #e5e7eb', marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#534AB7' }}>VentaMS</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>Sistema de ventas</div>
        </div>

        <div style={{ fontSize: '11px', color: '#999', padding: '8px 16px 4px', letterSpacing: '0.04em', fontWeight: '500' }}>Principal</div>
        {navItems.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              color: currentPage === item.id ? '#534AB7' : '#666',
              fontWeight: currentPage === item.id ? '500' : 'normal',
              borderRight: currentPage === item.id ? '2px solid #534AB7' : '2px solid transparent',
              backgroundColor: currentPage === item.id ? '#f3f4f6' : 'transparent'
            }}
            onClick={() => setCurrentPage(item.id)}
          >
            <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>{item.icon}</span>
            {item.label}
            {item.id === 'notificaciones' && (
              <span style={{ minWidth: '18px', height: '18px', borderRadius: '9px', background: '#E24B4A', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>3</span>
            )}
          </div>
        ))}

        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#3C3489', flexShrink: 0 }}>
              {user?.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500' }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* TOPBAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', flex: 1 }}>{pageNames[currentPage]}</div>
          <span style={{
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '20px',
            backgroundColor: systemStatus === 'operativo' ? '#E1F5EE' : '#FCEBEB',
            color: systemStatus === 'operativo' ? '#085041' : '#791F1F'
          }}>
            Sistema {systemStatus}
          </span>
          <button style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'transparent', color: '#1f2937' }} onClick={simulateFail}>
            {failureActive ? '✓ Fallo activo' : 'Simular fallo'}
          </button>
          <button style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'transparent', color: '#1f2937' }} onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {pages[currentPage] ? pages[currentPage]() : <div>Página no encontrada</div>}
        </div>
      </div>
    </div>
  )
}
