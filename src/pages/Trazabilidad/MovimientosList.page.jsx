// src/pages/Trazabilidad/MovimientosList.page.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table, Button, Input, InputNumber, Select, Tag, Space, Modal, Form, Popconfirm,
  Tooltip, Typography, Card, message, Alert, Row, Col,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, 
  NodeIndexOutlined, ClearOutlined,
} from "@ant-design/icons";
import {
  listarMovimientos, tiposMovimiento, crearMovimiento, actualizarMovimiento,
  eliminarMovimiento,
} from "../../services/movimientos.service.js";
import { listarGestores } from "../../services/gestores.service.js";
import { apiFetch } from "../../utils/api.js";

const { Title, Text } = Typography;
const { TextArea } = Input;

const TIPOS_DEFAULT = [
  { tipo: "reasignacion", etiqueta: "Reasignación" },
  { tipo: "reutilizacion", etiqueta: "Reutilización" },
  { tipo: "conservacion", etiqueta: "Conservación / resguardo" },
  { tipo: "gestion_especializada", etiqueta: "Entrega a gestor especializado" },
];

const COLOR_TIPO = {
  reasignacion: "green",
  reutilizacion: "cyan",
  conservacion: "gold",
  gestion_especializada: "purple",
};

// Qué pide cada tipo (mismas reglas que el back)
const REGLAS = {
  reasignacion:          { destino: "¿A qué laboratorio, departamento o usuario se reasigna?" },
  reutilizacion:         { destino: "¿Dónde se reutiliza el equipo?" },
  conservacion:          { destino: "¿Dónde queda resguardado el equipo?" },
  gestion_especializada: { gestor: true, destino: "¿A qué planta o centro de acopio se entrega?"},
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
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [filtros, setFiltros] = useState({
    equipo_id: params.get("equipo") || undefined, 
    tipo: undefined, 
    desde: "", 
    hasta: "",
  });
  
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form] = Form.useForm();
  const tipoSel = Form.useWatch("tipo", form);
  const gestorSel = Form.useWatch("gestor_id", form);

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
    aplicarFiltro({ equipo_id: undefined, tipo: undefined, desde: "", hasta: "" });

  const gestorElegido = useMemo(
    () => gestores.find((g) => String(g.id) === String(gestorSel)),
    [gestores, gestorSel]
  );

  const opcionesEquipo = equipos.map((e) => ({
    value: e.id,
    label: `#${e.id} · ${e.codigo || ""} ${[e.marca, e.modelo].filter(Boolean).join(" ") || "Equipo"}`,
  }));

  // ---------- crear / editar ----------
  const abrirCrear = () => {
    form.resetFields();
    form.setFieldsValue({ 
      tipo: "reasignacion", 
      fecha: hoyISO(), 
      equipo_id: filtros.equipo_id ? Number(filtros.equipo_id) : undefined 
    });
    setModal({ open: true, editing: null });
  };

  const abrirEditar = (m) => {
    form.resetFields();
    form.setFieldsValue({
      equipo_id: m.equipo_id, 
      tipo: m.tipo, 
      fecha: m.fecha ? String(m.fecha).slice(0, 10) : undefined,
      destino: m.destino, 
      gestor_id: m.gestor_id, 
      peso_kg: m.peso_kg ? Number(m.peso_kg) : null,
      observaciones: m.observaciones,
    });
    setModal({ open: true, editing: m });
  };

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const esEntrega = v.tipo === "gestion_especializada";
      
      const data = {
        equipo_id: v.equipo_id,
        tipo: v.tipo,
        fecha: v.fecha || null,
        destino: v.destino?.trim() || null,
        gestor_id: esEntrega ? v.gestor_id : null,
        peso_kg: esEntrega ? v.peso_kg ?? null : null,
        observaciones: v.observaciones?.trim() || null,
      };
      
      const resp = modal.editing
        ? await actualizarMovimiento(modal.editing.id, data)
        : await crearMovimiento(data);

      message.success(resp?.message || "Guardado");
      
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
      title: "Equipo", dataIndex: "equipo_id",
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
        r.tipo === "gestion_especializada" ? (
          <div>
            {r.gestor_nombre}
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.peso_kg ? `${Number(r.peso_kg)} kg` : ""}
            </Text>
          </div>
        ) : (
          r.destino || <Text type="secondary">—</Text>
        ),
    },
    { title: "Registró", dataIndex: "responsable_nombre", render: (v) => v || "—" },
    {
      title: "Acciones", fixed: "right",
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
          </Tooltip>
          {esAdmin && (
            <Popconfirm title="¿Eliminar movimiento?" okText="Eliminar" okButtonProps={{ danger: true }}
              cancelText="Cancelar"
              onConfirm={() => accion(() => eliminarMovimiento(r.id))}>
              <Tooltip title="Eliminar">
                <Button danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const regla = REGLAS[tipoSel] || {};

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
        <Space align="center">
          <NodeIndexOutlined style={{ fontSize: 26 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Movimientos de equipos</Title>
            <Text type="secondary">
              {puedeVer ? `${movs.length} mostrados` : "Registra a dónde va cada equipo"}
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
                options={opcionesEquipo} value={filtros.equipo_id ? Number(filtros.equipo_id) : undefined}
                onChange={(v) => aplicarFiltro({ equipo_id: v })} />
            ) : (
              <InputNumber min={1} placeholder="Id de equipo" style={{ width: 140 }}
                value={filtros.equipo_id ? Number(filtros.equipo_id) : null}
                onChange={(v) => aplicarFiltro({ equipo_id: v || undefined })} />
            )}
            <Select allowClear placeholder="Tipo" style={{ width: 220 }} value={filtros.tipo}
              options={tipos.map((t) => ({ value: t.tipo, label: t.etiqueta }))}
              onChange={(v) => aplicarFiltro({ tipo: v })} />
           
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
            message="Puedes registrar movimientos; un responsable ambiental los revisa." />
          <Table rowKey={(r) => r.id ?? `${r.equipo_id}-${r.tipo}`} size="small" pagination={false} dataSource={recientes}
            locale={{ emptyText: "Aún no registras movimientos en esta sesión" }}
            columns={[
              { title: "Equipo", dataIndex: "equipo_id", render: (v) => `#${v}` },
              { title: "Tipo", dataIndex: "tipo", render: (v) => <Tag color={COLOR_TIPO[v]}>{etiquetaTipo(v)}</Tag> },
              { title: "Destino", dataIndex: "destino", render: (v) => v || "—" },
              { title: "Estado", render: () => <Tag>Registrado</Tag> },
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
              <Form.Item name="equipo_id" label="Equipo" rules={[{ required: true, message: "Elige el equipo" }]}>
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
            <Form.Item name="destino" label="Destino" rules={[{ required: true, whitespace: true, message: regla.destino }, { max: 150 }]}>
              <Input placeholder={regla.destino} />
            </Form.Item>
          )}

          {regla.gestor && (
            <>
              <Form.Item name="gestor_id" label="Gestor" rules={[{ required: true, message: "Elige el gestor" }]}>
                <Select showSearch optionFilterProp="label" placeholder="Gestor activo"
                  notFoundContent="No hay gestores activos"
                  options={gestores.map((g) => ({ value: g.id, label: g.nombre }))} />
              </Form.Item>
              <Row gutter={12}>
                <Col xs={24} sm={24}>
                  <Form.Item name="peso_kg" label="Peso entregado (kg)" rules={[{ required: true, message: "Registra el peso" }]}>
                    <InputNumber min={0.01} step={0.5} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item name="observaciones" label="Observaciones">
            <TextArea rows={3} maxLength={255} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}