// src/pages/Trazabilidad/MovimientosList.page.jsx
// Movimientos de equipos (trazabilidad: reasignación, reparación, entrega a gestor, baja...)
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table, Button, Input, InputNumber, Select, Tag, Space, Modal, Form, Popconfirm,
  Tooltip, Typography, Card, message, Alert, Row, Col,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined,
  NodeIndexOutlined, ClearOutlined,
} from "@ant-design/icons";
import {
  listarMovimientos, tiposMovimiento, crearMovimiento, actualizarMovimiento,
  validarMovimiento, eliminarMovimiento,
} from "../../services/movimientos.service.js";
import { listarGestores } from "../../services/gestores.service.js";
import { apiFetch } from "../../utils/api.js";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Respaldo por si /movimientos/tipos no responde
const TIPOS_DEFAULT = [
  { tipo: "ingreso", etiqueta: "Ingreso al inventario" },
  { tipo: "reasignacion", etiqueta: "Reasignación / reutilización" },
  { tipo: "envio_reparacion", etiqueta: "Envío a reparación" },
  { tipo: "retorno_reparacion", etiqueta: "Regreso de reparación" },
  { tipo: "almacenamiento", etiqueta: "Almacenamiento / resguardo" },
  { tipo: "entrega_gestor", etiqueta: "Entrega a gestor especializado" },
  { tipo: "baja", etiqueta: "Baja definitiva" },
];

const COLOR_TIPO = {
  ingreso: "blue", reasignacion: "green", envio_reparacion: "gold", retorno_reparacion: "cyan",
  almacenamiento: "default", entrega_gestor: "purple", baja: "red",
};

// Qué pide cada tipo (mismas reglas que el back, para avisar antes de enviar)
const REGLAS = {
  reasignacion: { destino: "¿A qué laboratorio, departamento o usuario se reasigna?" },
  envio_reparacion: { destino: "Taller o área que hará la reparación" },
  almacenamiento: { destino: "Ubicación donde queda resguardado" },
  entrega_gestor: { gestor: true },
  baja: { motivo: true },
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const fechaTxt = (v) => (v ? new Date(v).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function MovimientosList() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = (user.rol || "").toLowerCase();
  const puedeVer = ["responsable", "administrador"].includes(rol);
  const esAdmin = rol === "administrador";

  const [params] = useSearchParams();
  const [movs, setMovs] = useState([]);
  const [tipos, setTipos] = useState(TIPOS_DEFAULT);
  const [gestores, setGestores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [recientes, setRecientes] = useState([]); // para el capturista: lo que registró en esta sesión
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtros, setFiltros] = useState({
    id_equipo: params.get("equipo") || undefined, tipo: undefined, validado: undefined, desde: "", hasta: "",
  });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form] = Form.useForm();
  const tipoSel = Form.useWatch("tipo", form);
  const gestorSel = Form.useWatch("id_gestor", form);

  const etiquetaTipo = (t) => tipos.find((x) => x.tipo === t)?.etiqueta ?? t;

  const cargar = async (f = filtros) => {
    if (!puedeVer) return;
    try {
      setLoading(true);
      setMovs(await listarMovimientos(f));
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    tiposMovimiento().then((t) => t?.length && setTipos(t)).catch(() => {});
    listarGestores({ activo: 1 }).then((g) => setGestores(g || [])).catch(() => {});
    apiFetch("/equipos").then((e) => setEquipos(Array.isArray(e) ? e : [])).catch(() => setEquipos([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = (cambios) => {
    const nuevos = { ...filtros, ...cambios };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const limpiarFiltros = () =>
    aplicarFiltro({ id_equipo: undefined, tipo: undefined, validado: undefined, desde: "", hasta: "" });

  const gestorElegido = useMemo(
    () => gestores.find((g) => String(g.id) === String(gestorSel)),
    [gestores, gestorSel]
  );

  const opcionesEquipo = equipos.map((e) => ({
    value: e.id,
    label: `#${e.id} · ${[e.marca, e.modelo].filter(Boolean).join(" ") || "Equipo"}`,
  }));

  // ---------- crear / editar ----------
  const abrirCrear = () => {
    form.resetFields();
    form.setFieldsValue({ tipo: "reasignacion", fecha: hoyISO(), id_equipo: filtros.id_equipo ? Number(filtros.id_equipo) : undefined });
    setModal({ open: true, editing: null });
  };

  const abrirEditar = (m) => {
    form.resetFields();
    form.setFieldsValue({
      id_equipo: m.id_equipo, tipo: m.tipo, fecha: m.fecha ? String(m.fecha).slice(0, 10) : undefined,
      destino: m.destino, id_gestor: m.id_gestor, cantidad_kg: m.cantidad_kg ? Number(m.cantidad_kg) : null,
      evidencia: m.evidencia, observaciones: m.observaciones,
    });
    setModal({ open: true, editing: m });
  };

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const esEntrega = v.tipo === "entrega_gestor";
      const data = {
        id_equipo: v.id_equipo,
        tipo: v.tipo,
        fecha: v.fecha || null,
        destino: REGLAS[v.tipo]?.destino ? v.destino?.trim() || null : null,
        id_gestor: esEntrega ? v.id_gestor : null,
        cantidad_kg: esEntrega ? v.cantidad_kg ?? null : null,
        evidencia: esEntrega ? v.evidencia?.trim() || null : null,
        observaciones: v.observaciones?.trim() || null,
      };
      const resp = modal.editing
        ? await actualizarMovimiento(modal.editing.id, data)
        : await crearMovimiento(data);

      message.success(resp?.message || "Guardado");
      (resp?.advertencias || []).forEach((a) => message.warning(a, 6));

      if (!puedeVer && !modal.editing) {
        setRecientes((r) => [{ ...data, id: resp?.id, fecha: data.fecha || hoyISO() }, ...r]);
      }
      setModal({ open: false, editing: null });
      cargar();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const accion = async (fn) => {
    try {
      const r = await fn();
      message.success(r?.message || "Listo");
      cargar();
    } catch (e) {
      message.error(e.message);
    }
  };

  // ---------- tabla ----------
  const columns = [
    { title: "Fecha", dataIndex: "fecha", width: 160, render: fechaTxt, sorter: (a, b) => new Date(a.fecha) - new Date(b.fecha) },
    {
      title: "Equipo", dataIndex: "id_equipo",
      render: (v, r) => (
        <div>
          <Text strong>#{v}</Text>{" "}
          <Text type="secondary">{[r.equipo_marca, r.equipo_modelo].filter(Boolean).join(" ")}</Text>
        </div>
      ),
    },
    { title: "Tipo", dataIndex: "tipo", render: (v) => <Tag color={COLOR_TIPO[v]}>{etiquetaTipo(v)}</Tag> },
    {
      title: "Destino / gestor",
      render: (_, r) =>
        r.tipo === "entrega_gestor" ? (
          <div>
            {r.gestor_nombre}{" "}
            {!r.gestor_verificado && <Tag color="warning">Gestor sin verificar</Tag>}
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.cantidad_kg ? `${Number(r.cantidad_kg)} kg` : ""}{r.evidencia ? ` · ${r.evidencia}` : ""}
            </Text>
          </div>
        ) : (
          r.destino || <Text type="secondary">—</Text>
        ),
    },
    { title: "Registró", dataIndex: "responsable_nombre", render: (v) => v || "—" },
    {
      title: "Validación", dataIndex: "validado",
      render: (v, r) =>
        v ? (
          <Tooltip title={`${r.validado_por_nombre || ""} · ${fechaTxt(r.validado_en)}`}>
            <Tag icon={<CheckCircleOutlined />} color="success">Validado</Tag>
          </Tooltip>
        ) : (
          <Tag color="default">Pendiente</Tag>
        ),
    },
    {
      title: "Acciones", fixed: "right",
      render: (_, r) => (
        <Space size="small">
          {!r.validado && (
            <Popconfirm title="¿Validar movimiento?" description="Ya no se podrá editar ni eliminar."
              okText="Validar" cancelText="Cancelar" onConfirm={() => accion(() => validarMovimiento(r.id))}>
              <Tooltip title="Validar"><Button type="primary" ghost icon={<CheckCircleOutlined />} /></Tooltip>
            </Popconfirm>
          )}
          <Tooltip title={r.validado ? "Validado: no editable" : "Editar"}>
            <Button icon={<EditOutlined />} disabled={Boolean(r.validado)} onClick={() => abrirEditar(r)} />
          </Tooltip>
          {esAdmin && (
            <Popconfirm title="¿Eliminar movimiento?" okText="Eliminar" okButtonProps={{ danger: true }}
              cancelText="Cancelar" disabled={Boolean(r.validado)}
              onConfirm={() => accion(() => eliminarMovimiento(r.id))}>
              <Tooltip title={r.validado ? "Validado: forma parte del historial" : "Eliminar"}>
                <Button danger icon={<DeleteOutlined />} disabled={Boolean(r.validado)} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const pendientes = movs.filter((m) => !m.validado).length;
  const regla = REGLAS[tipoSel] || {};

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
        <Space align="center">
          <NodeIndexOutlined style={{ fontSize: 26 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Movimientos de equipos</Title>
            <Text type="secondary">
              {puedeVer ? `${movs.length} mostrados · ${pendientes} pendientes de validar` : "Registra a dónde va cada equipo"}
            </Text>
          </div>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Registrar movimiento</Button>
      </Space>

      {puedeVer ? (
        <Card style={{ marginTop: 16 }}>
          <Space wrap style={{ marginBottom: 16 }}>
            {opcionesEquipo.length ? (
              <Select allowClear showSearch optionFilterProp="label" placeholder="Equipo" style={{ width: 220 }}
                options={opcionesEquipo} value={filtros.id_equipo ? Number(filtros.id_equipo) : undefined}
                onChange={(v) => aplicarFiltro({ id_equipo: v })} />
            ) : (
              <InputNumber min={1} placeholder="Id de equipo" style={{ width: 140 }}
                value={filtros.id_equipo ? Number(filtros.id_equipo) : null}
                onChange={(v) => aplicarFiltro({ id_equipo: v || undefined })} />
            )}
            <Select allowClear placeholder="Tipo" style={{ width: 220 }} value={filtros.tipo}
              options={tipos.map((t) => ({ value: t.tipo, label: t.etiqueta }))}
              onChange={(v) => aplicarFiltro({ tipo: v })} />
            <Select allowClear placeholder="Validación" style={{ width: 150 }} value={filtros.validado}
              options={[{ value: "1", label: "Validados" }, { value: "0", label: "Pendientes" }]}
              onChange={(v) => aplicarFiltro({ validado: v })} />
            <Input type="date" aria-label="Desde" style={{ width: 150 }} value={filtros.desde} max={filtros.hasta || hoyISO()}
              onChange={(e) => aplicarFiltro({ desde: e.target.value })} />
            <Input type="date" aria-label="Hasta" style={{ width: 150 }} value={filtros.hasta} min={filtros.desde} max={hoyISO()}
              onChange={(e) => aplicarFiltro({ hasta: e.target.value })} />
            <Tooltip title="Limpiar filtros"><Button icon={<ClearOutlined />} onClick={limpiarFiltros} /></Tooltip>
            <Tooltip title="Recargar"><Button icon={<ReloadOutlined />} onClick={() => cargar()} loading={loading} /></Tooltip>
          </Space>
          <Table rowKey="id" dataSource={movs} columns={columns} loading={loading} scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: "No hay movimientos con esos filtros" }} />
        </Card>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <Alert type="info" showIcon style={{ marginBottom: 16 }}
            message="Puedes registrar movimientos; un responsable ambiental los revisa y valida." />
          <Table rowKey={(r) => r.id ?? `${r.id_equipo}-${r.tipo}`} size="small" pagination={false} dataSource={recientes}
            locale={{ emptyText: "Aún no registras movimientos en esta sesión" }}
            columns={[
              { title: "Equipo", dataIndex: "id_equipo", render: (v) => `#${v}` },
              { title: "Tipo", dataIndex: "tipo", render: (v) => <Tag color={COLOR_TIPO[v]}>{etiquetaTipo(v)}</Tag> },
              { title: "Destino", dataIndex: "destino", render: (v) => v || "—" },
              { title: "Estado", render: () => <Tag>Pendiente de validar</Tag> },
            ]} />
        </Card>
      )}

      <Modal forceRender open={modal.open} width={620}
        title={modal.editing ? `Editar movimiento #${modal.editing.id}` : "Registrar movimiento"}
        okText={modal.editing ? "Guardar cambios" : "Registrar"} cancelText="Cancelar"
        confirmLoading={saving} onOk={guardar} onCancel={() => setModal({ open: false, editing: null })}>
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={12}>
            <Col xs={24} sm={14}>
              <Form.Item name="id_equipo" label="Equipo" rules={[{ required: true, message: "Elige el equipo" }]}>
                {opcionesEquipo.length ? (
                  <Select showSearch optionFilterProp="label" placeholder="Buscar equipo" options={opcionesEquipo} />
                ) : (
                  <InputNumber min={1} style={{ width: "100%" }} placeholder="Id del equipo" />
                )}
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item name="fecha" label="Fecha"
                rules={[{ validator: (_, v) => (!v || v <= hoyISO() ? Promise.resolve() : Promise.reject(new Error("No puede ser futura"))) }]}>
                <Input type="date" max={hoyISO()} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tipo" label="Tipo de movimiento" rules={[{ required: true }]}>
            <Select options={tipos.map((t) => ({ value: t.tipo, label: t.etiqueta }))} />
          </Form.Item>

          {regla.destino && (
            <Form.Item name="destino" label="Destino" rules={[{ required: true, whitespace: true, message: regla.destino }, { max: 255 }]}>
              <Input placeholder={regla.destino} />
            </Form.Item>
          )}

          {regla.gestor && (
            <>
              <Form.Item name="id_gestor" label="Gestor" rules={[{ required: true, message: "Elige el gestor" }]}>
                <Select showSearch optionFilterProp="label" placeholder="Gestor activo"
                  notFoundContent="No hay gestores activos"
                  options={gestores.map((g) => ({ value: g.id, label: `${g.nombre}${g.verificado ? "" : " (sin verificar)"}` }))} />
              </Form.Item>
              {gestorElegido && !gestorElegido.verificado && (
                <Alert type="warning" showIcon style={{ marginBottom: 16 }}
                  message="Este gestor no está verificado. La entrega se registra, pero no se podrá validar ni contará como destino autorizado." />
              )}
              <Row gutter={12}>
                <Col xs={24} sm={10}>
                  <Form.Item name="cantidad_kg" label="Peso entregado (kg)" rules={[{ required: true, message: "Registra el peso" }]}>
                    <InputNumber min={0.01} step={0.5} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={14}>
                  <Form.Item name="evidencia" label="Evidencia (folio / manifiesto)"
                    rules={[{ required: true, whitespace: true, message: "Registra la evidencia de entrega" }, { max: 255 }]}>
                    <Input placeholder="ej. MAN-2026-001" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item name="observaciones" label={regla.motivo ? "Motivo de la baja" : "Observaciones"}
            rules={regla.motivo ? [{ required: true, whitespace: true, message: "Explica el motivo de la baja" }] : []}>
            <TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
