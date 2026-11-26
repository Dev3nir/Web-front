// src/layouts/AppLayout.jsx
import { Layout, Menu } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const { Sider, Content, Header } = Layout;

const MENU = [
  // [key, label, path, rolesPermitidos]
  ["dashboard",  "Inicio",          "/panel",                 ["capturista","responsable","administrador"]],
  ["equipos",    "Inventario",      "/panel/equipos",         ["capturista","responsable","administrador"]],
  ["diag",       "Diagnósticos",    "/panel/diagnosticos",    ["responsable","administrador"]],
  ["repar",      "Reparaciones",    "/panel/reparaciones",    ["responsable","administrador"]],
  ["campanas",   "Campañas",        "/panel/campanas",        ["responsable","administrador"]],
  ["partic",     "Participaciones", "/panel/participaciones", ["capturista","responsable","administrador"]],
  ["movim",    "Movimientos", "/panel/movimientos", ["capturista","responsable","administrador"]],
  ["gestores", "Gestores",    "/panel/gestores",    ["capturista","responsable","administrador"]],
  ["reportes",   "Reportes",        "/panel/reportes",        ["responsable","administrador"]],
  ["usuarios",   "Usuarios",        "/panel/usuarios",        ["administrador"]],
];

const PATH_BY_KEY = Object.fromEntries(MENU.map(([k, , p]) => [k, p]));

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = (user.rol || "").toLowerCase();

  // Opciones visibles según rol
  const items = MENU
    .filter(([,,, roles]) => roles.includes(rol))
    .map(([key, label]) => ({ key, label }));

  // Detecta qué opción está activa según la URL actual
  const selectedKey =
    MENU.find(([, , path]) =>
      path === "/panel"
        ? location.pathname === "/panel"
        : location.pathname.startsWith(path)
    )?.[0] || "dashboard";

  const cerrarSesion = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light" breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            padding: 16,
            fontWeight: 700,
            fontSize: 18,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          Ecolink
        </div>
        <Menu
          items={items}
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(PATH_BY_KEY[key])}
          style={{ borderInlineEnd: "none" }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingInline: 24,
            gap: 16,
          }}
        >
          <span style={{ color: "#666" }}>
            {user.nombreUsuario || "usuario"} ({rol})
          </span>
          <a onClick={cerrarSesion} style={{ cursor: "pointer" }}>
            Cerrar sesión
          </a>
        </Header>

        <Content style={{ padding: 24, background: "#f5f5f5" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}