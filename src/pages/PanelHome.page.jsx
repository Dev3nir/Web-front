// src/pages/PanelHome.page.jsx
import { Card, Col, Row, Typography } from "antd";
const { Title, Paragraph } = Typography;

export default function PanelHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = (user.rol || "").toLowerCase();

  const saludo = {
    administrador: "Panel de administración",
    responsable: "Panel del responsable ambiental",
    capturista: "Panel del capturista",
  }[rol] || "Panel";

  return (
    <div>
      <Title level={2}>{saludo}</Title>
      <Paragraph>Bienvenido, {user.nombreUsuario || "usuario"}.</Paragraph>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}><Card title="Equipos registrados">—</Card></Col>
        <Col xs={24} md={8}><Card title="Campañas activas">—</Card></Col>
        <Col xs={24} md={8}><Card title="Pendientes de diagnóstico">—</Card></Col>
      </Row>
    </div>
  );
}