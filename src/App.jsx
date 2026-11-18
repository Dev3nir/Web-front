// Landing pública – Módulo 1 (Página de inicio y concientización)
// Uso: npm i antd @ant-design/icons  →  reemplaza src/App.jsx con este archivo
import { useState } from "react";
import {
  ConfigProvider, Layout, Grid, Button, Drawer, Row, Col, Card, Statistic,
  Segmented, Typography, Steps, Tag, Collapse, List, Space,
} from "antd";
import esES from "antd/locale/es_ES";
import {
  MenuOutlined, LoginOutlined, ToolOutlined, SwapOutlined,
  SafetyCertificateOutlined, EnvironmentOutlined, CalendarOutlined, LinkOutlined,
} from "@ant-design/icons";

import LoginPage from "./pages/Login.page";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

// Paleta: 60% hielo/blanco · 30% verde suave · 10% grafito
const C = {
  ice: "#F2F5F3", white: "#FFFFFF", sage: "#dce9dc",
  green: "#61bd61", empty: "#d4dbd3", graphite: "#2A302E",
};

const LINKS = [
  ["problema", "El problema"], ["impactos", "Impactos"], ["cuidado", "Alarga su vida"],
["ruta", "Reparar y entregar"], ["campanas", "Campañas"], ["recursos", "Recursos"],
];

// TODO: sustituir por fetch("/api/campanas") cuando exista el backend
const CAMPANAS = [
  { id: 1, nombre: "Recolecta de celulares y baterías", fechas: "Fechas por definir", lugar: "Campus principal", tipos: ["Celulares", "Baterías", "Cargadores"] },
{ id: 2, nombre: "Computadoras y monitores en desuso", fechas: "Fechas por definir", lugar: "Biblioteca", tipos: ["Computadoras", "Monitores", "Impresoras"] },
{ id: 3, nombre: "Cables y periféricos", fechas: "Fechas por definir", lugar: "Edificio de ingeniería", tipos: ["Cables", "Teclados", "Ratones"] },
];

const RECURSOS = [
  { t: "Global E-waste Monitor 2024", d: "El informe completo de la UIT y UNITAR.", u: "https://www.globalewaste.org" },
{ t: "Comunicado de la UIT (español)", d: "Resumen del informe: cifras, metales y emisiones.", u: "https://www.itu.int/es/mediacentre/Pages/PR-2024-03-20-e-waste-recycling.aspx" },
{ t: "UNITAR: reciclaje vs. residuos", d: "Por qué los residuos crecen cinco veces más rápido que su reciclaje.", u: "https://unitar.org/about/news-stories/press/global-e-waste-monitor-2024-electronic-waste-rising-five-times-faster-documented-e-waste-recycling" },
];

const CUIDADOS = [
  { key: "1", label: "Baterías", children: "Evita dejarlas en 0% o en 100% por mucho tiempo y no las expongas al calor. Usa cargadores compatibles." },
{ key: "2", label: "Limpieza y ventilación", children: "Quita el polvo de ventiladores y rejillas. Un equipo caliente se desgasta más rápido." },
{ key: "3", label: "Software", children: "Mantén el sistema actualizado, libera almacenamiento y reinstala si el equipo va lento antes de cambiarlo." },
{ key: "4", label: "Protección física", children: "Usa funda, protector de pantalla y regulador de voltaje. No jales los cables por el cable: sujeta el conector." },
{ key: "5", label: "Guarda lo que no usas", children: "Si vas a guardar un equipo, apágalo, retira pilas y mantenlo en un lugar seco para que otra persona pueda usarlo." },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=Figtree:wght@400;500;600&display=swap');
html{scroll-behavior:smooth}
body{margin:0;background:${C.ice};color:${C.graphite};font-family:'Figtree',system-ui,sans-serif}
h1,h2,h3,.brand{font-family:'Bricolage Grotesque','Figtree',sans-serif!important;color:${C.graphite}!important}
section{scroll-margin-top:72px;padding:72px 24px}
.wrap{max-width:1720px;margin:0 auto}
.band-sage{background:${C.sage}} .band-white{background:${C.white}}
.dots{display:grid;grid-template-columns:repeat(10,1fr);gap:6px;width:100%;max-width:340px}
.dot{aspect-ratio:1;border-radius:50%;background:${C.empty}} .dot.on{background:${C.green}}
.nav a{color:${C.graphite};margin:0 14px;text-decoration:none;font-weight:500}
.nav a:hover{text-decoration:underline;text-underline-offset:6px}
.ant-layout-header{padding:0 24px!important}
a:focus-visible,button:focus-visible{outline:3px solid ${C.graphite};outline-offset:2px}
@media (max-width:576px){section{padding:48px 16px}}
`;

function DotGrid({ pct }) {
  const on = Math.max(1, Math.round(pct));
  return (
    <div className="dots" role="img" aria-label={`${pct}% de cada 100 kg se recicla formalmente`}>
    {Array.from({ length: 100 }, (_, i) => <span key={i} className={`dot${i < on ? " on" : ""}`} />)}
    </div>
  );
}

export default function App() {
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const [open, setOpen] = useState(false);
  const [ambito, setAmbito] = useState("Mundo");
  const pct = ambito === "Mundo" ? 22.3 : 3.5;


  const navigate = useNavigate();

  const goLogin = () => navigate("/login");

  return (
    <ConfigProvider
    locale={esES}
    theme={{ token: { colorPrimary: C.graphite, colorText: C.graphite, borderRadius: 10, fontFamily: "'Figtree', system-ui, sans-serif" } }}
    >
    <style>{css}</style>
    <Layout style={{ background: C.ice }}>
    <Header style={{ position: "sticky", top: 0, zIndex: 20, background: C.white, borderBottom: `1px solid ${C.empty}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <a href="#inicio" className="brand" style={{ fontSize: 20, fontWeight: 700, color: C.graphite, textDecoration: "none" }}>Ecolink</a>
    {mobile ? (
      <Space>
      <Button type="primary" icon={<LoginOutlined />} onClick={goLogin}>Ingresar</Button>
      <Button aria-label="Abrir menú" icon={<MenuOutlined />} onClick={() => setOpen(true)} />
      </Space>
    ) : (
      <div className="nav" style={{ display: "flex", alignItems: "center" }}>
      {LINKS.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
      <Button type="primary" icon={<LoginOutlined />} onClick={goLogin} style={{ marginLeft: 12 }}>Iniciar sesión</Button>
      </div>
    )}
    </Header>

    <Drawer title="Menú" placement="right" open={open} onClose={() => setOpen(false)} width={260}>
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 16 }}>
    {LINKS.map(([id, t]) => (
      <a key={id} href={`#${id}`} onClick={() => setOpen(false)} style={{ color: C.graphite }}>{t}</a>
    ))}
    </div>
    </Drawer>

    <Content>
    {/* HERO */}
    <section id="inicio">
    <Row className="wrap" gutter={[48, 40]} align="middle">
    <Col xs={24} md={13}>
    <Title level={1} style={{ fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.08, marginTop: 0 }}>
    Tu equipo viejo todavía puede tener otra vida
    </Title>
    <Paragraph style={{ fontSize: 18, maxWidth: 1020 }}>
    Los residuos electrónicos crecen más rápido que su reciclaje. Aquí aprendes a
    alargar la vida de tus dispositivos, repararlos, reutilizarlos o entregarlos de forma segura.
    </Paragraph>
    <Space wrap>
    <Button type="primary" size="large" href="#campanas">Ver campañas</Button>
    <Button size="large" href="#problema">Entender el problema</Button>
    </Space>
    </Col>
    <Col xs={24} md={11}>
    <Card style={{ background: C.white, borderColor: C.empty }}>
    <Segmented block options={["Mundo", "México"]} value={ambito} onChange={setAmbito} style={{ marginBottom: 20 }} />
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
    <DotGrid pct={pct} />
    <div style={{ flex: 1, minWidth: 140 }}>
    <div className="brand" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{pct}%</div>
    <Text>de los residuos electrónicos se recolecta y recicla formalmente. Cada punto es 1 de cada 100 kg.</Text>
    </div>
    </div>
    </Card>
    </Col>
    </Row>
    </section>

    {/* PROBLEMA */}
    <section id="problema" className="band-sage">
    <div className="wrap">
    <Title level={2}>El problema en cifras</Title>
    <br></br>
    <Paragraph style={{ maxWidth: 1980, fontSize: 17 }}>
    Un residuo electrónico es cualquier aparato eléctrico o electrónico que ya no funciona o ya no se quiere.
    En 2022 el mundo generó un récord, y la cifra sigue subiendo.
    </Paragraph>
    <br></br>
    <Row gutter={[16, 16]}>
    {[
      ["Residuos generados en el mundo (2022)", 62, " millones de t", "82% más que en 2010"],
          ["Se espera para 2030", 82, " millones de t", "Crece 2.6 millones de t cada año"],
          ["Metales valiosos desperdiciados", 91, " mil millones USD", "Por reciclar poco"],
          ["Generación por mexicano al año", 11.8, " kg", "El promedio mundial es 7.8 kg"],
    ].map(([t, v, s, d]) => (
      <Col xs={24} sm={12} lg={6} key={t}>
      <Card style={{ height: "100%" }}>
      <Statistic title={t} value={v} suffix={s} valueStyle={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 30 }} />
      <Text type="secondary">{d}</Text>
      </Card>
      </Col>
    ))}
    </Row>
    <Paragraph style={{ marginTop: 24, fontSize: 16 }}>
    <b>En México</b> se generan alrededor de 1.5 millones de toneladas al año y solo se recicla cerca del 3.5%.
    El país está entre los 10 mayores generadores del mundo.
    </Paragraph>
    </div>
    </section>

    {/* IMPACTOS */}
    <section id="impactos">
    <div className="wrap">
    <Title level={2}>Impactos ambientales y sociales</Title>
    <Row gutter={[16, 16]}>
    <Col xs={24} md={12}>
    <Card title="Ambientales" style={{ height: "100%" }}>
    <List size="small" split={false} dataSource={[
      "Contienen sustancias como plomo, mercurio o berilio que contaminan suelo y agua si se tiran sin control.",
      "Un equipo trae metales (31 millones de t en 2022), plásticos (17) y otros materiales que podrían recuperarse.",
          "Gestionarlos bien evitó 93 millones de t de CO₂ equivalente en 2022.",
          "Solo 1% de la demanda de tierras raras se cubre con reciclaje: se sigue minando más.",
    ]} renderItem={(x) => <List.Item>• {x}</List.Item>} />
    </Card>
    </Col>
    <Col xs={24} md={12}>
    <Card title="Sociales" style={{ height: "100%" }}>
    <List size="small" split={false} dataSource={[
      "Muchos residuos se exportan: 5.1 millones de t en 2022, gran parte de países ricos a países de ingresos bajos y medios.",
      "El manejo informal expone a quienes desarman equipos a sustancias tóxicas.",
      "Solo 81 países tienen alguna regulación sobre recolección y reciclaje de residuos electrónicos.",
      "Reutilizar y reparar acerca la tecnología a escuelas y laboratorios con menos recursos.",
    ]} renderItem={(x) => <List.Item>• {x}</List.Item>} />
    </Card>
    </Col>
    </Row>
    </div>
    </section>

    {/* CUIDADO */}
    <section id="cuidado" className="band-white">
    <Row className="wrap" gutter={[40, 24]}>
    <Col xs={24} md={9}>
    <Title level={2} style={{ marginTop: 0 }}>Alarga la vida de tus dispositivos</Title>
    <Paragraph style={{ fontSize: 17 }}>
    El mejor residuo es el que no se genera. Estos hábitos retrasan el momento de desechar.
    </Paragraph>
    </Col>
    <Col xs={24} md={15}>
    <Collapse accordion defaultActiveKey={["1"]} items={CUIDADOS} />
    </Col>
    </Row>
    </section>

    {/* RUTA */}
    <section id="ruta" className="band-sage">
    <div className="wrap">
    <Title level={2}>Reparar, reutilizar o entregar</Title>
    <Card>
    <Steps direction={mobile ? "vertical" : "horizontal"} current={-1} items={[
      { title: "Reparar", icon: <ToolOutlined />, description: "Si falla una pieza (batería, pantalla, disco), revisa si una reparación es más barata que reemplazar." },
          { title: "Reutilizar", icon: <SwapOutlined />, description: "Si funciona pero ya no lo necesitas, dónalo o reasígnalo a laboratorios, áreas o personas que lo aprovechen." },
          { title: "Entregar responsablemente", icon: <SafetyCertificateOutlined />, description: "Si ya no sirve, llévalo a una campaña o a un gestor autorizado. No lo tires a la basura común." },
    ]} />
    </Card>
    <Title level={4} style={{ marginTop: 28 }}>Antes de entregar un dispositivo</Title>
    <Space wrap>
    {["Respalda tu información", "Borra tus datos y cierra sesiones", "Restablece de fábrica", "Retira tarjetas SIM y memorias", "Entrega las baterías por separado si se pueden retirar"].map((t) => <Tag key={t} color="default" style={{ padding: "4px 10px", fontSize: 14 }}>{t}</Tag>)}
    </Space>
    </div>
    </section>

    {/* CAMPAÑAS */}
    <section id="campanas">
    <div className="wrap">
    <Title level={2}>Campañas de recolección</Title>
    <Paragraph style={{ fontSize: 17 }}>Ejemplos de campañas; se mostrarán aquí las que publique el responsable ambiental.</Paragraph>
    <Row gutter={[16, 16]}>
    {CAMPANAS.map((c) => (
      <Col xs={24} md={8} key={c.id}>
      <Card style={{ height: "100%" }} actions={[<Button type="link" key="m" style={{ color: C.graphite }}>Ver detalles</Button>]}>
      <Title level={4} style={{ marginTop: 0 }}>{c.nombre}</Title>
      <p><CalendarOutlined /> {c.fechas}</p>
      <p><EnvironmentOutlined /> {c.lugar}</p>
      <Space wrap>{c.tipos.map((t) => <Tag key={t} color="green">{t}</Tag>)}</Space>
      </Card>
      </Col>
    ))}
    </Row>
    </div>
    </section>

    {/* RECURSOS */}
<section id="recursos" className="band-white">
  <div className="wrap">
    <Title level={2} style={{ textAlign: "center" }}>Recursos educativos</Title>
    <br />

    <Row gutter={[16, 16]} justify="center">
      {RECURSOS.map((r) => (
        <Col xs={24} md={8} key={r.u}>
          <Card
            hoverable
            style={{ height: "100%" }}
            onClick={() => window.open(r.u, "_blank", "noopener")}
          >
            <Title level={5} style={{ marginTop: 0 }}>
              <LinkOutlined /> {r.t}
            </Title>
            <Text type="secondary">{r.d}</Text>
          </Card>
        </Col>
      ))}
    </Row>
  </div>
</section>
    </Content>
    
    <Footer style={{ background: C.graphite, color: C.ice }}>
    <div className="wrap">
    <div className="brand" style={{ fontSize: 20, fontWeight: 700 }}>Ecolink</div>
    <p style={{ maxWidth: 1720, opacity: 0.85 }}>
    Fuentes: Global E-waste Monitor 2024 (UIT y UNITAR); estimaciones para México basadas en ese informe.
    Proyecto escolar – Programación Web, AGO-DIC 2026.
    </p>
    <br></br>
    <Button ghost icon={<LoginOutlined />} onClick={goLogin} style={{ color: C.ice, borderColor: C.ice }}>Acceso para personal autorizado</Button>
    </div>
    </Footer>
    </Layout>
    </ConfigProvider>
  );
}
