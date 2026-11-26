// src/pages/Modulo4/CampanasList.page.jsx
// Módulo 4 — Campañas (acceso: responsable, administrador; el alta/edición también)
import { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Input, Select, Tag, Space, Modal, Form, DatePicker,
  Popconfirm, Tooltip, Typography, Card, message,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, NotificationOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  listarCampanas, crearCampana, actualizarCampana, eliminarCampana,
} from "../../services/campanas.service.js";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ⚠️ Ajusta etiquetas/colores si tu back usa otros valores de estado
const ESTADOS = {
  activa: { label: "Activa", color: "green" },
  finalizada: { label: "Finalizada", color: "default" },
};
const ESTADO_OPTIONS = Object.entries(ESTADOS).map(([value, e]) => ({ value, label: e.label }));

// Helpers de fecha (el back manda/recibe "YYYY-MM-DD")
const fmt = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—");
const toDate = (v) => (v ? dayjs(v).format("YYYY-MM-DD") : null);

export default function CampanasList() {
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState();

  // modal crear / editar
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form] = Form.useForm();

  const cargar = async () => {
    try {
      setLoading(true);
      setCampanas(await listarCampanas());
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return campanas.filter((c) => {
      const texto = `${c.nombre} ${c.descripcion ?? ""} ${c.ubicacion ?? ""}`.toLowerCase();
      return (
        (!q || texto.includes(q)) &&
        (!filtroEstado || c.estado === filtroEstado)
      );
    });
  }, [campanas, busqueda, filtroEstado]);

  // ---------- crear / editar ----------
  const abrirCrear = () => {
    form.resetFields();
    form.setFieldsValue({ estado: "activa" });
    setModal({ open: true, editing: null });
  };

  const abrirEditar = (c) => {
    form.resetFields();
    form.setFieldsValue({
      nombre: c.nombre,
      descripcion: c.descripcion,
      ubicacion: c.ubicacion,
      estado: c.estado,
      fechas:
        c.fecha_inicio && c.fecha_fin
          ? [dayjs(c.fecha_inicio), dayjs(c.fecha_fin)]
          : undefined,
    });
    setModal({ open: true, editing: c });
  };

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const data = {
        nombre: v.nombre.trim(),
        descripcion: v.descripcion?.trim() || null,
        ubicacion: v.ubicacion?.trim() || null,
        estado: v.estado,
        fecha_inicio: v.fechas?.[0] ? toDate(v.fechas[0]) : null,
        fecha_fin: v.fechas?.[1] ? toDate(v.fechas[1]) : null,
      };
      if (modal.editing) {
        await actualizarCampana(modal.editing.id, data);
        message.success("Campaña actualizada");
      } else {
        await crearCampana(data);
        message.success("Campaña creada");
      }
      setModal({ open: false, editing: null });
      cargar();
    } catch (e) {
      if (e?.errorFields) return; // error de validación del formulario
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarCampana(id);
      message.success("Campaña eliminada");
      cargar();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (v, row) => (
        <>
          <Text strong>{v}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.descripcion || "Sin descripción"}
          </Text>
        </>
      ),
    },
    {
      title: "Fechas",
      key: "fechas",
      render: (_, row) => `${fmt(row.fecha_inicio)} → ${fmt(row.fecha_fin)}`,
    },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      render: (v) => v || "—",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (v) => <Tag color={ESTADOS[v]?.color}>{ESTADOS[v]?.label ?? v}</Tag>,
    },
    {
      title: "Acciones",
      fixed: "right",
      render: (_, row) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => abrirEditar(row)} />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar campaña?"
            description="También podrían perderse sus participaciones. Esta acción no se puede deshacer."
            okText="Eliminar"
            okButtonProps={{ danger: true }}
            cancelText="Cancelar"
            onConfirm={() => handleEliminar(row.id)}
          >
            <Tooltip title="Eliminar">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const editando = Boolean(modal.editing);

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
        <Space align="center">
          <NotificationOutlined style={{ fontSize: 26 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Campañas de reciclaje</Title>
            <Text type="secondary">{campanas.length} registradas · {filtradas.length} mostradas</Text>
          </div>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
          Nueva campaña
        </Button>
      </Space>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar por nombre, descripción o ubicación"
            style={{ width: 300 }}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Estado"
            style={{ width: 160 }}
            options={ESTADO_OPTIONS}
            value={filtroEstado}
            onChange={setFiltroEstado}
          />
          <Tooltip title="Recargar">
            <Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} />
          </Tooltip>
        </Space>

        <Table
          rowKey="id"
          dataSource={filtradas}
          columns={columns}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: "No hay campañas que coincidan" }}
        />
      </Card>

      {/* Modal crear / editar */}
      <Modal
        forceRender
        open={modal.open}
        title={editando ? "Editar campaña" : "Nueva campaña"}
        okText={editando ? "Guardar cambios" : "Crear campaña"}
        cancelText="Cancelar"
        confirmLoading={saving}
        onOk={guardar}
        onCancel={() => setModal({ open: false, editing: null })}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="nombre"
            label="Nombre de la campaña"
            rules={[{ required: true, message: "Escribe el nombre de la campaña" }]}
          >
            <Input placeholder="ej. Reciclatón 2026" />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={3} placeholder="opcional" />
          </Form.Item>
          <Form.Item name="fechas" label="Periodo (inicio y fin)">
            <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="ubicacion" label="Ubicación">
            <Input placeholder="ej. Plaza principal" />
          </Form.Item>
          <Form.Item name="estado" label="Estado" rules={[{ required: true }]}>
            <Select options={ESTADO_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
