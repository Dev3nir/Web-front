import { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, DatePicker,
  Space, Tag, Card, Typography, message, Popconfirm
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import API_URL from "../../config/backend";

const { Title, Text } = Typography;

const CONDICIONES = [
  { value: "funcional", label: "Funcional", color: "green" },
  { value: "reparable", label: "Reparable", color: "gold" },
  { value: "reutilizable", label: "Reutilizable", color: "blue" },
  { value: "pendiente_gestion", label: "Pendiente de gestión", color: "volcano" },
];

export default function InventarioPage() {
  const [equipos, setEquipos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form] = Form.useForm();

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resEq, resCat] = await Promise.all([
        fetch(`${API_URL}/equipos`, { headers }),
        fetch(`${API_URL}/categorias`, { headers }),
      ]);

      const dataEq = await resEq.json();
      const dataCat = await resCat.json();

      setEquipos(Array.isArray(dataEq) ? dataEq : []);
      setCategorias(Array.isArray(dataCat) ? dataCat : []);
    } catch {
      message.error("No se pudieron cargar los datos del inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModal = (registro = null) => {
    setEditando(registro);
    if (registro) {
      form.setFieldsValue({
        ...registro,
        fecha_ingreso: registro.fecha_ingreso ? dayjs(registro.fecha_ingreso) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ condicion: "reparable", fecha_ingreso: dayjs() });
    }
    setModalOpen(true);
  };

  const guardarEquipo = async (values) => {
    const payload = {
      ...values,
      fecha_ingreso: values.fecha_ingreso.format("YYYY-MM-DD"),
    };

    try {
      const url = editando ? `${API_URL}/equipos/${editando.id}` : `${API_URL}/equipos`;
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return message.error(data.message || "Error al guardar el equipo");
      }

      message.success(editando ? "Equipo actualizado" : "Equipo registrado");
      setModalOpen(false);
      cargarDatos();
    } catch {
      message.error("Error de conexión con el servidor");
    }
  };

  const eliminarEquipo = async (id) => {
    try {
      const res = await fetch(`${API_URL}/equipos/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        return message.error(data.message || "No se pudo eliminar el equipo");
      }
      message.success("Equipo eliminado");
      cargarDatos();
    } catch {
      message.error("Error al eliminar el equipo");
    }
  };

  const columns = [
    { title: "Código", dataIndex: "codigo", key: "codigo" },
    {
      title: "Categoría",
      key: "categoria",
      render: (_, r) =>
        r.categoria_nombre ||
        categorias.find((c) => c.id === r.categoria_id)?.nombre ||
        r.categoria_id,
    },
    { title: "Marca", dataIndex: "marca", key: "marca", render: (v) => v || "—" },
    { title: "Modelo", dataIndex: "modelo", key: "modelo", render: (v) => v || "—" },
    {
      title: "Fecha ingreso",
      dataIndex: "fecha_ingreso",
      key: "fecha_ingreso",
      render: (f) => (f ? dayjs(f).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Condición",
      dataIndex: "condicion",
      key: "condicion",
      render: (cond) => {
        const item = CONDICIONES.find((c) => c.value === cond);
        return <Tag color={item?.color || "default"}>{item?.label || cond}</Tag>;
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => abrirModal(r)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar este equipo?"
            okText="Sí"
            cancelText="No"
            onConfirm={() => eliminarEquipo(r.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ margin: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Inventario de Equipos</Title>
         {/* <Text type="secondary">Módulo 2 · Registro y seguimiento de residuos electrónicos</Text> */}
         
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={cargarDatos}>Actualizar</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal()}>
            Nuevo equipo
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={equipos}
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editando ? "Editar equipo" : "Registrar equipo"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={guardarEquipo}>
          <Form.Item
            name="codigo"
            label="Código"
            rules={[{ required: true, message: "Ingresa el código del equipo" }]}
          >
            <Input placeholder="Ej. EQ-001" />
          </Form.Item>

          <Form.Item
            name="categoria_id"
            label="Categoría"
            rules={[{ required: true, message: "Selecciona una categoría" }]}
          >
            <Select
              placeholder="Selecciona una categoría"
              options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </Form.Item>

          <Space style={{ display: "flex" }} size="middle">
            <Form.Item name="marca" label="Marca" style={{ flex: 1 }}>
              <Input placeholder="Ej. Dell, HP" />
            </Form.Item>
            <Form.Item name="modelo" label="Modelo" style={{ flex: 1 }}>
              <Input placeholder="Ej. Latitude 5420" />
            </Form.Item>
          </Space>

          <Space style={{ display: "flex" }} size="middle">
            <Form.Item
              name="fecha_ingreso"
              label="Fecha de ingreso"
              rules={[{ required: true, message: "Selecciona la fecha" }]}
              style={{ flex: 1 }}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="condicion"
              label="Condición"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select options={CONDICIONES} />
            </Form.Item>
          </Space>

          <Form.Item name="observaciones" label="Observaciones">
            <Input.TextArea rows={3} placeholder="Estado físico, cargador, detalles..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}