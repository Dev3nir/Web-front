// src/pages/admin/Admin.page.jsx
export default function AdminPage() {
  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>Panel de Administrador</h1>
      <p>Login exitoso, redirección funcionando ✅</p>
      <button
        onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
        style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}