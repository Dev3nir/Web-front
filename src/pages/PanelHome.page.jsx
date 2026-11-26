// src/pages/PanelHome.page.jsx
import { useEffect, useState } from "react";
import { Card, Col, Row, Typography, Statistic, Spin } from "antd";
import { 
  LaptopOutlined, 
  CalendarOutlined, 
  ToolOutlined 
} from "@ant-design/icons";
import { apiFetch } from "../utils/api.js"; // Ajusta la ruta si es necesario

const { Title, Paragraph } = Typography;

export default function PanelHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = (user.rol || "").toLowerCase();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    equipos: 0,
    campanas: 0,
    pendientes: 0,
  });

  const saludo = {
    administrador: "Panel de administración",
    responsable: "Panel del responsable ambiental",
    capturista: "Panel del capturista",
  }[rol] || "Panel";

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Ejecutamos las 3 consultas al mismo tiempo
        const [resEquipos, resCampanas, resPendientes] = await Promise.allSettled([
          apiFetch("/equipos"),
          apiFetch("/campanas"),
          apiFetch("/equipos/pendientes/count"),
        ]);

        // 1. Equipos
        const totalEquipos = resEquipos.status === "fulfilled" && Array.isArray(resEquipos.value)
          ? resEquipos.value.length
          : 0;

        // 2. Campañas Activas / Publicadas
        const totalCampanas = resCampanas.status === "fulfilled" && Array.isArray(resCampanas.value)
          ? resCampanas.value.filter((c) => c.estado === "Publicada" || c.estado === "Borrador").length
          : 0; // Si falla (porque el capturista no puede verlas), se queda en 0

        // 3. Pendientes
        const totalPendientes = resPendientes.status === "fulfilled" && resPendientes.value
          ? resPendientes.value.total
          : 0;

        setStats({
          equipos: totalEquipos,
          campanas: totalCampanas,
          pendientes: totalPendientes,
        });
      } catch (error) {
        console.error("Error cargando stats", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return (
    <div>
      <Title level={2}>{saludo}</Title>
      <Paragraph>Bienvenido, {user.nombreUsuario || "usuario"}.</Paragraph>
      
      {loading ? (
        <Spin style={{ marginTop: 24 }} />
      ) : (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Equipos registrados"
                value={stats.equipos}
                prefix={<LaptopOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Campañas activas"
                value={stats.campanas}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Pendientes de diagnóstico"
                value={stats.pendientes}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}