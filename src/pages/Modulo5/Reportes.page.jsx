// src/pages/Modulo5/Reportes.page.jsx
// Módulo 5 — Indicadores y reportes (responsable ambiental y administrador)
import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Card, Col, Progress, Row, Space, Statistic, Table, Tag,
  Tooltip, Typography, message, Spin,
} from "antd";
import {
  ReloadOutlined, DownloadOutlined, PrinterOutlined, LaptopOutlined, ToolOutlined,
  SwapOutlined, SafetyCertificateOutlined, DollarOutlined, RiseOutlined, TeamOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  obtenerResumen, obtenerIndicadoresCampanas, obtenerIndicadoresReutilizacion,
} from "../../services/indicadores.service.js";
import {
  VizStyles, VIZ, ChartCard, BarList, StackedBarList, MonthColumns,
} from "../../components/charts/Charts.jsx";

const { Title, Text, Paragraph } = Typography;

//------------------------------------------------ HELPERS ------------------------------------------------
const ETIQUETAS = {
  // condición del equipo
  funcional: "Funcional", reparable: "Reparable", reutilizable: "Reutilizable",
  pendiente_gestion: "Pendiente de gestión especializada", sin_condicion: "Sin condición",
  // recomendación de diagnóstico
  reparar: "Reparar", reutilizar: "Reutilizar", conservar: "Conservar",
  gestion_especializada: "Gestión especializada", sin_recomendacion: "Sin recomendación",
  // tipos de movimiento
  ingreso: "Ingreso", reasignacion: "Reasignación", envio_reparacion: "Envío a reparación",
  retorno_reparacion: "Regreso de reparación", almacenamiento: "Almacenamiento",
  entrega_gestor: "Entrega a gestor", baja: "Baja",
};
const etiqueta = (v) =>
  ETIQUETAS[v] ?? String(v ?? "—").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const num = (v) => Number(v || 0);
const pesos = (v) => num(v).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const fecha = (v) => (v ? new Date(v).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const ESTADO_CAMPANA = {
  activa: { color: "green", label: "Activa" },
  proxima: { color: "blue", label: "Próxima" },
  finalizada: { color: "default", label: "Finalizada" },
};

/** Descarga un CSV creando un <a> temporal en el DOM. */
function descargarCSV(nombre, secciones) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lineas = [];
  secciones.forEach(({ titulo, encabezados, filas }) => {
    lineas.push(esc(titulo));
    lineas.push(encabezados.map(esc).join(","));
    filas.forEach((f) => lineas.push(f.map(esc).join(",")));
    lineas.push("");
  });
  const blob = new Blob(["﻿" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const cssPagina = `
@media print {
  .ant-layout-sider, .ant-layout-header, .no-print { display: none !important; }
  .ant-layout-content { padding: 0 !important; background: #fff !important; }
  .ant-card { break-inside: avoid; box-shadow: none !important; }
}
.kpi .ant-statistic-content { font-family: 'Bricolage Grotesque', 'Figtree', sans-serif; }
`;

function Kpi({ titulo, valor, icono, ayuda, formatter, sufijo }) {
  return (
    <Card className="kpi" style={{ height: "100%" }}>
      <Statistic
        title={
          <Space size={6}>
            {icono}
            <span>{titulo}</span>
            {ayuda && (
              <Tooltip title={ayuda}>
                <InfoCircleOutlined style={{ color: VIZ.textoSec }} />
              </Tooltip>
            )}
          </Space>
        }
        value={valor ?? "—"}
        formatter={valor === null || valor === undefined ? () => "—" : formatter}
        suffix={valor === null || valor === undefined ? null : sufijo}
      />
    </Card>
  );
}

//------------------------------------------------ PÁGINA ------------------------------------------------
export default function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [reuso, setReuso] = useState(null);
  const [campanas, setCampanas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actualizado, setActualizado] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    const [r1, r2, r3] = await Promise.allSettled([
      obtenerResumen(),
      obtenerIndicadoresReutilizacion(),
      obtenerIndicadoresCampanas(),
    ]);
    if (r1.status === "fulfilled") setResumen(r1.value);
    if (r2.status === "fulfilled") setReuso(r2.value);
    if (r3.status === "fulfilled") setCampanas(r3.value);
    const fallo = [r1, r2, r3].find((r) => r.status === "rejected");
    if (fallo) {
      setError(fallo.reason?.message || "No se pudieron cargar los indicadores");
      message.error("Algunos indicadores no se pudieron cargar");
    }
    setActualizado(new Date());
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  // Avisos del back (tablas de otros módulos que todavía no responden)
  const avisos = useMemo(
    () => [...new Set([...(resumen?.avisos || []), ...(reuso?.avisos || []), ...(campanas?.avisos || [])])],
    [resumen, reuso, campanas]
  );

  const equipos = resumen?.equipos || {};
  const reparaciones = reuso?.reparaciones ?? resumen?.reparaciones;
  const reutilizados = reuso?.reutilizados ?? resumen?.reutilizados;
  const entregas = reuso?.entregas ?? resumen?.entregas;
  const listaCampanas = campanas?.campanas || [];
  const maxPart = Math.max(1, ...listaCampanas.map((c) => num(c.participaciones)));

  const movimientos = (reuso?.movimientos_por_tipo || []).map((m) => ({
    etiqueta: m.etiqueta,
    validados: num(m.validados),
    pendientes: num(m.total) - num(m.validados),
  }));

  const kgDoc = num(entregas?.kg_documentados);
  const kgPend = num(entregas?.kg_pendientes);
  const pctDoc = kgDoc + kgPend > 0 ? Math.round((kgDoc / (kgDoc + kgPend)) * 100) : 0;

  // Tasa de aprovechamiento: equipos reparados o reutilizados / equipos registrados
  const aprovechados = num(reparaciones?.equipos_reparados) + num(reutilizados?.validados);
  const tasa = num(equipos.total) > 0 ? Math.min(100, Math.round((aprovechados / num(equipos.total)) * 100)) : null;

  const exportar = () => {
    const filasEtiqueta = (arr) => (arr || []).map((x) => [etiqueta(x.etiqueta), num(x.total)]);
    descargarCSV(`reporte-ewaste-${new Date().toISOString().slice(0, 10)}.csv`, [
      {
        titulo: "Resumen",
        encabezados: ["Indicador", "Valor"],
        filas: [
          ["Equipos registrados", num(equipos.total)],
          ["Reparaciones registradas", num(reparaciones?.reparaciones)],
          ["Equipos reparados", num(reparaciones?.equipos_reparados)],
          ["Equipos reutilizados (validados)", num(reutilizados?.validados)],
          ["Costo total de reparación (MXN)", num(reparaciones?.costo_total)],
          ["Ahorro estimado (MXN)", num(reparaciones?.ahorro_estimado)],
          ["Kg entregados a gestores (documentados)", kgDoc],
          ["Kg entregados pendientes de validar", kgPend],
        ],
      },
      { titulo: "Equipos por condición", encabezados: ["Condición", "Equipos"], filas: filasEtiqueta(equipos.por_condicion) },
      { titulo: "Equipos por categoría", encabezados: ["Categoría", "Equipos"], filas: filasEtiqueta(equipos.por_categoria) },
      { titulo: "Equipos registrados por mes", encabezados: ["Mes", "Equipos"], filas: (equipos.por_mes || []).map((m) => [m.mes, num(m.total)]) },
      { titulo: "Diagnósticos por recomendación", encabezados: ["Recomendación", "Diagnósticos"], filas: filasEtiqueta(reuso?.diagnosticos_por_recomendacion) },
      { titulo: "Movimientos por tipo", encabezados: ["Tipo", "Validados", "Pendientes"], filas: movimientos.map((m) => [etiqueta(m.etiqueta), m.validados, m.pendientes]) },
      {
        titulo: "Entregas por gestor",
        encabezados: ["Gestor", "Verificado", "Entregas", "Kg", "Validadas"],
        filas: (reuso?.entregas_por_gestor || []).map((g) => [g.nombre, g.verificado ? "Sí" : "No", num(g.entregas), num(g.kg), num(g.validadas)]),
      },
      {
        titulo: "Resultados por campaña",
        encabezados: ["Campaña", "Estado", "Inicio", "Fin", "Ubicación", "Participaciones", "Equipos recibidos"],
        filas: listaCampanas.map((c) => [c.nombre, ESTADO_CAMPANA[c.estado]?.label, fecha(c.fecha_inicio), fecha(c.fecha_fin), c.ubicacion, num(c.participaciones), c.equipos_recibidos ?? "—"]),
      },
    ]);
    message.success("Reporte descargado");
  };

  const colsEtiqueta = (nombre) => [
    { title: nombre, dataIndex: "etiqueta", render: etiqueta },
    { title: "Total", dataIndex: "total", align: "right", sorter: (a, b) => num(a.total) - num(b.total) },
  ];

  const sinDatos = !resumen && !reuso && !campanas;

  return (
    <div>
      <style>{cssPagina}</style>
      <VizStyles />

      {/* Encabezado */}
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }} wrap>
        <div>
          <Title level={3} style={{ margin: 0 }}>Indicadores y reportes</Title>
          <Text type="secondary">
            {actualizado ? `Actualizado ${actualizado.toLocaleString("es-MX")}` : "Cargando…"}
          </Text>
        </div>
        <Space wrap className="no-print">
          <Button icon={<ReloadOutlined />} onClick={cargar} loading={loading}>Actualizar</Button>
          <Button icon={<DownloadOutlined />} onClick={exportar} disabled={sinDatos}>Exportar CSV</Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()} disabled={sinDatos}>Imprimir</Button>
        </Space>
      </Space>

      {error && (
        <Alert className="no-print" type="error" showIcon style={{ marginBottom: 16 }}
          message="No se pudieron cargar algunos indicadores" description={error} />
      )}
      {avisos.length > 0 && (
        <Alert className="no-print" type="warning" showIcon closable style={{ marginBottom: 16 }}
          message="Algunos datos todavía no están disponibles"
          description={avisos.join(" · ")} />
      )}

      <Spin spinning={loading && sinDatos}>
        {/* KPIs */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Kpi titulo="Equipos registrados" valor={equipos.total} icono={<LaptopOutlined />} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Kpi titulo="Equipos reparados" valor={reparaciones ? num(reparaciones.equipos_reparados) : null}
              icono={<ToolOutlined />} ayuda={reparaciones ? `${num(reparaciones.reparaciones)} reparaciones registradas` : null} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Kpi titulo="Equipos reutilizados" valor={reutilizados ? num(reutilizados.validados) : null}
              icono={<SwapOutlined />}
              ayuda={reutilizados ? `Reasignaciones validadas. ${num(reutilizados.pendientes)} pendientes de validar.` : null} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Kpi titulo="Entregado a gestores" valor={entregas ? kgDoc : null} sufijo="kg"
              icono={<SafetyCertificateOutlined />}
              formatter={(v) => num(v).toLocaleString("es-MX", { maximumFractionDigits: 1 })}
              ayuda="Solo entregas validadas a gestores verificados" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Kpi titulo="Costo de reparación" valor={reparaciones ? num(reparaciones.costo_total) : null}
              icono={<DollarOutlined />} formatter={(v) => pesos(v)} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Kpi titulo="Ahorro estimado" valor={reparaciones ? num(reparaciones.ahorro_estimado) : null}
              icono={<RiseOutlined />} formatter={(v) => pesos(v)}
              ayuda="Lo que se evitó gastar en equipos nuevos al reparar" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Kpi titulo="Participaciones en campañas" valor={resumen?.campanas ? num(resumen.campanas.participaciones) : null}
              icono={<TeamOutlined />}
              ayuda={resumen?.campanas ? `${resumen.campanas.total} campañas, ${resumen.campanas.activas} activas` : null} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ height: "100%" }}>
              <Text type="secondary">Tasa de aprovechamiento</Text>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                <Progress type="circle" size={64} percent={tasa ?? 0} strokeColor={VIZ.serie}
                  format={(p) => (tasa === null ? "—" : `${p}%`)} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Equipos reparados o reutilizados sobre el total registrado
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Equipos */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={14}>
            <ChartCard title="Equipos registrados por mes" data={equipos.por_mes}
              rowKey="mes" columns={[{ title: "Mes", dataIndex: "mes" }, { title: "Equipos", dataIndex: "total", align: "right" }]}>
              <MonthColumns data={equipos.por_mes} />
            </ChartCard>
          </Col>
          <Col xs={24} lg={10}>
            <ChartCard title="Equipos por condición" data={equipos.por_condicion} columns={colsEtiqueta("Condición")}>
              <BarList data={equipos.por_condicion} label={(d) => etiqueta(d.etiqueta)} />
            </ChartCard>
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard title="Equipos por categoría" data={equipos.por_categoria} columns={colsEtiqueta("Categoría")}>
              <BarList data={equipos.por_categoria} />
            </ChartCard>
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard title="Diagnósticos por recomendación" data={reuso?.diagnosticos_por_recomendacion}
              columns={colsEtiqueta("Recomendación")}>
              <BarList data={reuso?.diagnosticos_por_recomendacion} label={(d) => etiqueta(d.etiqueta)} />
            </ChartCard>
          </Col>
        </Row>

        {/* Trazabilidad */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <ChartCard title="Movimientos por tipo" data={movimientos}
              columns={[
                { title: "Tipo", dataIndex: "etiqueta", render: etiqueta },
                { title: "Validados", dataIndex: "validados", align: "right" },
                { title: "Pendientes", dataIndex: "pendientes", align: "right" },
              ]}>
              <StackedBarList
                data={movimientos}
                label={(d) => etiqueta(d.etiqueta)}
                series={[
                  { key: "validados", nombre: "Validados", color: VIZ.validado },
                  { key: "pendientes", nombre: "Pendientes de validar", color: VIZ.pendiente },
                ]}
              />
            </ChartCard>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Entregas a gestores" style={{ height: "100%" }}>
              {entregas ? (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic title="Documentadas" value={kgDoc} suffix="kg"
                        formatter={(v) => num(v).toLocaleString("es-MX", { maximumFractionDigits: 1 })} />
                      <Text type="secondary">{num(entregas.entregas_documentadas)} entregas · {num(entregas.equipos_documentados)} equipos</Text>
                    </Col>
                    <Col span={12}>
                      <Statistic title="Sin documentar" value={kgPend} suffix="kg"
                        formatter={(v) => num(v).toLocaleString("es-MX", { maximumFractionDigits: 1 })} />
                      <Text type="secondary">{num(entregas.entregas_pendientes)} entregas por validar o con gestor sin verificar</Text>
                    </Col>
                  </Row>
                  <Progress percent={pctDoc} strokeColor={VIZ.validado} style={{ marginTop: 16 }}
                    format={(p) => `${p}% documentado`} />
                  <Table
                    size="small" style={{ marginTop: 12 }} rowKey="id" pagination={false}
                    dataSource={reuso?.entregas_por_gestor || []}
                    locale={{ emptyText: "No hay gestores registrados" }}
                    columns={[
                      { title: "Gestor", dataIndex: "nombre" },
                      {
                        title: "Verificado", dataIndex: "verificado",
                        render: (v) => (v ? <Tag color="success">Sí</Tag> : <Tag color="warning">No verificado</Tag>),
                      },
                      { title: "Entregas", dataIndex: "entregas", align: "right" },
                      { title: "Kg", dataIndex: "kg", align: "right", render: (v) => num(v).toLocaleString("es-MX") },
                    ]}
                  />
                </>
              ) : (
                <Text type="secondary">Sin datos todavía</Text>
              )}
            </Card>
          </Col>
        </Row>

        {/* Campañas */}
        <Card title="Resultados por campaña" style={{ marginTop: 16 }}>
          <Table
            rowKey="id"
            size="middle"
            dataSource={listaCampanas}
            scroll={{ x: 720 }}
            pagination={{ pageSize: 6, showSizeChanger: false }}
            locale={{ emptyText: "No hay campañas registradas" }}
            columns={[
              { title: "Campaña", dataIndex: "nombre", sorter: (a, b) => String(a.nombre).localeCompare(String(b.nombre)) },
              {
                title: "Estado", dataIndex: "estado",
                filters: Object.entries(ESTADO_CAMPANA).map(([value, e]) => ({ value, text: e.label })),
                onFilter: (v, r) => r.estado === v,
                render: (v) => <Tag color={ESTADO_CAMPANA[v]?.color}>{ESTADO_CAMPANA[v]?.label ?? v}</Tag>,
              },
              { title: "Fechas", render: (_, r) => `${fecha(r.fecha_inicio)} – ${fecha(r.fecha_fin)}` },
              { title: "Ubicación", dataIndex: "ubicacion" },
              {
                title: "Participaciones", dataIndex: "participaciones", width: 200,
                sorter: (a, b) => num(a.participaciones) - num(b.participaciones),
                render: (v) => (
                  <Space style={{ width: "100%" }}>
                    <div style={{ width: 110, background: VIZ.track, height: 10, borderRadius: 4 }}>
                      <div style={{ width: `${(num(v) / maxPart) * 100}%`, background: VIZ.serie, height: "100%", borderRadius: "0 4px 4px 0" }} />
                    </div>
                    <Text strong>{num(v)}</Text>
                  </Space>
                ),
              },
              {
                title: "Equipos recibidos", dataIndex: "equipos_recibidos", align: "right",
                render: (v) => (v === null || v === undefined ? "—" : num(v)),
              },
            ]}
          />
        </Card>

        <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 13 }}>
          Un equipo solo se cuenta como entregado a un gestor cuando el movimiento fue validado por un
          responsable ambiental y el gestor tiene su autorización verificada. Las entregas sin documentar
          se muestran aparte para no presentarlas como recicladas.
        </Paragraph>
      </Spin>
    </div>
  );
}
