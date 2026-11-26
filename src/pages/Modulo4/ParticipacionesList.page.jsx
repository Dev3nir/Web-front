// src/pages/Modulo4/ParticipacionesList.page.jsx
// Módulo 4 — Participaciones en campañas
// (ver: responsable/admin · registrar/editar: capturista, responsable, admin · borrar: admin)
import { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Input, Select, Tag, Space, Modal, Form, InputNumber,
  Popconfirm, Tooltip, Typography, Card, message,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  listarParticipaciones, crearParticipacion, actualizarParticipacion,
  eliminarParticipacion,
} from "../../services/participaciones.service.js";
import { listarCampanas } from "../../services/campanas.service.js";

const { Title, Text } = Typography;

const fmt = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—");

export default function ParticipacionesList() {
  const [participaciones, setParticipaciones] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCampana, setFiltroCampana] = useState();

  // modal crear / editar
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form] = Form.useForm();

  const cargar = async () => {
    try {
      setLoading(true);
      const [parts, camps] = await Promise.all([
        listarParticipaciones(),
        listarCampanas(), // para el select y para mostrar el nombre de la campaña
      ]);
      setParticipaciones(parts);
      setCampanas(camps);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // mapa id → nombre de campaña (por si el back no manda el JOIN)
  const nombreCampana = (row) =>
    row.campana_nombre ??
    campanas.find((c) => c.id === row.campana_id)?.nombre ??
    `#${row.campana_id}`;

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return participaciones.filter((p) => {
      const texto = `${p.nombre_participante} ${p.correo ?? ""} ${p.tipo_residuo ?? ""}`.toLowerCase();
      return (
        (!q || texto.includes(q)) &&
        (!filtroCampana || p.campana_id === filtroCampana)
      );
    });
  }, [participaciones, busqueda, filtroCampana]);

  // ---------- crear / editar ----------
  const abrirCrear = () => {
    form.resetFields();
    setModal({ open: true, editing: null });
  };

  const abrirEditar = (p) => {
    form.resetFields();
    form.setFieldsValue({
      campana_id: p.campana_id,
      nombre_participante: p.nombre_participante,
      correo: p.correo,
      telefono: p.telefono,
      tipo_residuo: p.tipo_residuo,
      peso_kg: p.peso_kg != null ? Number(p.peso_kg) : undefined,
      observaciones: p.observaciones,
    });
    setModal({ open: true, editing: p });
  };

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const data = {
        campana_id: v.campana_id,
        nombre_participante: v.nombre_participante.trim(),
        correo: v.correo?.trim() || null,
        telefono: v.telefono?.trim() || null,
        tipo_residuo: v.tipo_residuo?.trim() || null,
        peso_kg: v.peso_kg ?? null,
        observaciones: v.observaciones?.trim() || null,
      };
      if (modal.editing) {
        await actualizarParticipacion(modal.editing.id, data);
        message.success("Participación actualizada");
      } else {
        await crearParticipacion(data);
        message.success("Participación registrada");
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
      await eliminarParticipacion(id);
      message.success("Participación eliminada");
      cargar();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: "Participante",
      dataIndex: "nombre_participante",
      sorter: (a, b) => a.nombre_participante.localeCompare(b.nombre_participante),
      render: (v, row) => (
        <>
          <Text strong>{v}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.correo || row.telefono || "Sin contacto"}
          </Text>
        </>
      ),
    },
    {
      title: "Campaña",
      key: "campana",
      render: (_, row) => <Tag color="green">{nombreCampana(row)}</Tag>,
    },
    {
      title: "Tipo de residuo",
      dataIndex: "tipo_residuo",
      render: (v) => v || "—",
    },
    {
      title: "Peso (kg)",
      dataIndex: "peso_kg",
      align: "right",
      sorter: (a, b) => Number(a.peso_kg || 0) - Number(b.peso_kg || 0),
      render: (v) => (v != null ? Number(v).toLocaleString("es-MX") : "—"),
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      render: fmt,
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
            title="¿Eliminar participación?"
            description="Esta acción no se puede deshacer."
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
          <TeamOutlined style={{ fontSize: 26 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Participaciones</Title>
            <Text type="secondary">
              {participaciones.length} registradas · {filtradas.length} mostradas
            </Text>
          </div>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
          Registrar participación
        </Button>
      </Space>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar por nombre, correo o tipo de residuo"
            style={{ width: 300 }}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Campaña"
            style={{ width: 220 }}
            options={campanas.map((c) => ({ value: c.id, label: c.nombre }))}
            value={filtroCampana}
            onChange={setFiltroCampana}
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
          locale={{ emptyText: "No hay participaciones que coincidan" }}
        />
      </Card>

      {/* Modal crear / editar */}
      <Modal
        forceRender
        open={modal.open}
        title={editando ? "Editar participación" : "Registrar participación"}
        okText={editando ? "Guardar cambios" : "Registrar"}
        cancelText="Cancelar"
        confirmLoading={saving}
        onOk={guardar}
        onCancel={() => setModal({ open: false, editing: null })}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="campana_id"
            label="Campaña"
            rules={[{ required: true, message: "Selecciona la campaña" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Selecciona una campaña"
              options={campanas.map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </Form.Item>
          <Form.Item
            name="nombre_participante"
            label="Nombre del participante"
            rules={[{ required: true, message: "Escribe el nombre del participante" }]}
          >
            <Input placeholder="ej. María López" />
          </Form.Item>
          <Form.Item
            name="correo"
            label="Correo"
            rules={[{ type: "email", message: "Correo no válido" }]}
          >
            <Input placeholder="opcional" />
          </Form.Item>
          <Form.Item name="telefono" label="Teléfono">
            <Input placeholder="opcional" />
          </Form.Item>
          <Form.Item name="tipo_residuo" label="Tipo de residuo">
            <Input placeholder="ej. celular, laptop, baterías" />
          </Form.Item>
          <Form.Item name="peso_kg" label="Peso entregado (kg)">
            <InputNumber min={0} step={0.1} style={{ width: "100%" }} placeholder="opcional" />
          </Form.Item>
          <Form.Item name="observaciones" label="Observaciones">
            <Input.TextArea rows={2} placeholder="opcional" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
