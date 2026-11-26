// src/pages/Trazabilidad/GestoresList.page.jsx
// Catálogo de gestores de residuos (empresas / centros que reciben los equipos)
import { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Input, Select, Tag, Space, Modal, Form, Switch, Popconfirm,
  Tooltip, Typography, Card, message, Alert, Row, Col,
} from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, SafetyCertificateOutlined, ShopOutlined,
} from "@ant-design/icons";
import {
  listarGestores, crearGestor, actualizarGestor, desactivarGestor, eliminarGestor,
} from "../../services/gestores.service.js";

const { Title, Text } = Typography;

export const TIPOS_GESTOR = [
  { value: "reciclador", label: "Reciclador" },
  { value: "reacondicionador", label: "Reacondicionador" },
  { value: "centro_acopio", label: "Centro de acopio" },
  { value: "donataria", label: "Donataria" },
  { value: "otro", label: "Otro" },
];
const tipoLabel = (v) => TIPOS_GESTOR.find((t) => t.value === v)?.label ?? v;

export default function GestoresList() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = (user.rol || "").toLowerCase();
  const puedeEditar = ["responsable", "administrador"].includes(rol);
  const esAdmin = rol === "administrador";

  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroVerif, setFiltroVerif] = useState();
  const [filtroActivo, setFiltroActivo] = useState(true);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form] = Form.useForm();
  const verificado = Form.useWatch("verificado", form);

  const cargar = async () => {
    try {
      setLoading(true);
      setGestores(await listarGestores());
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return gestores.filter((g) => {
      const texto = `${g.nombre} ${g.contacto ?? ""} ${g.materiales_aceptados ?? ""}`.toLowerCase();
      return (
        (!q || texto.includes(q)) &&
        (filtroVerif === undefined || Boolean(g.verificado) === filtroVerif) &&
        (filtroActivo === undefined || Boolean(g.activo) === filtroActivo)
      );
    });
  }, [gestores, busqueda, filtroVerif, filtroActivo]);

  const abrirCrear = () => {
    form.resetFields();
    form.setFieldsValue({ tipo: "reciclador", verificado: false, activo: true });
    setModal({ open: true, editing: null });
  };

  const abrirEditar = (g) => {
    form.resetFields();
    form.setFieldsValue({ ...g, verificado: Boolean(g.verificado), activo: Boolean(g.activo) });
    setModal({ open: true, editing: g });
  };

  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const data = {
        nombre: v.nombre.trim(),
        tipo: v.tipo,
        contacto: v.contacto?.trim() || null,
        telefono: v.telefono?.trim() || null,
        correo: v.correo?.trim() || null,
        direccion: v.direccion?.trim() || null,
        materiales_aceptados: v.materiales_aceptados?.trim() || null,
        numero_autorizacion: v.numero_autorizacion?.trim() || null,
        verificado: v.verificado ? 1 : 0,
        activo: v.activo ? 1 : 0,
      };
      if (modal.editing) {
        await actualizarGestor(modal.editing.id, data);
        message.success("Gestor actualizado");
      } else {
        await crearGestor(data);
        message.success("Gestor registrado");
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

  const accion = async (fn, ok) => {
    try {
      await fn();
      message.success(ok);
      cargar();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    {
      title: "Gestor", dataIndex: "nombre",
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (v, r) => (
        <div>
          <Text strong>{v}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{r.contacto || "Sin contacto"}{r.telefono ? ` · ${r.telefono}` : ""}</Text>
        </div>
      ),
    },
    { title: "Tipo", dataIndex: "tipo", render: (v) => <Tag>{tipoLabel(v)}</Tag> },
    { title: "Materiales aceptados", dataIndex: "materiales_aceptados", ellipsis: true, render: (v) => v || "—" },
    {
      title: "Autorización", dataIndex: "verificado",
      render: (v, r) =>
        v ? (
          <Tooltip title={r.numero_autorizacion}>
            <Tag icon={<SafetyCertificateOutlined />} color="success">Verificado</Tag>
          </Tooltip>
        ) : (
          <Tag color="warning">Sin verificar</Tag>
        ),
    },
    { title: "Estado", dataIndex: "activo", render: (v) => (v ? <Tag color="green">Activo</Tag> : <Tag>Inactivo</Tag>) },
  ];

  if (puedeEditar) {
    columns.push({
      title: "Acciones", fixed: "right",
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="Editar"><Button icon={<EditOutlined />} onClick={() => abrirEditar(r)} /></Tooltip>
          <Popconfirm title="¿Desactivar gestor?" description="Ya no se podrá elegir en nuevas entregas."
            okText="Desactivar" cancelText="Cancelar" disabled={!r.activo}
            onConfirm={() => accion(() => desactivarGestor(r.id), "Gestor desactivado")}>
            <Tooltip title={r.activo ? "Desactivar" : "Ya está inactivo"}>
              <Button icon={<StopOutlined />} disabled={!r.activo} />
            </Tooltip>
          </Popconfirm>
          {esAdmin && (
            <Popconfirm title="¿Eliminar definitivamente?" description="Si tiene entregas registradas no se podrá eliminar."
              okText="Eliminar" okButtonProps={{ danger: true }} cancelText="Cancelar"
              onConfirm={() => accion(() => eliminarGestor(r.id), "Gestor eliminado")}>
              <Tooltip title="Eliminar"><Button danger icon={<DeleteOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <div>
      <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
        <Space align="center">
          <ShopOutlined style={{ fontSize: 26 }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Gestores de residuos</Title>
            <Text type="secondary">{gestores.length} registrados · {filtrados.length} mostrados</Text>
          </div>
        </Space>
        {puedeEditar && <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>Nuevo gestor</Button>}
      </Space>

      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Buscar por nombre, contacto o material"
            style={{ width: 300 }} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <Select allowClear placeholder="Autorización" style={{ width: 170 }} value={filtroVerif} onChange={setFiltroVerif}
            options={[{ value: true, label: "Verificados" }, { value: false, label: "Sin verificar" }]} />
          <Select allowClear placeholder="Estado" style={{ width: 140 }} value={filtroActivo} onChange={setFiltroActivo}
            options={[{ value: true, label: "Activos" }, { value: false, label: "Inactivos" }]} />
          <Tooltip title="Recargar"><Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} /></Tooltip>
        </Space>
        <Table rowKey="id" dataSource={filtrados} columns={columns} loading={loading}
          scroll={{ x: 820 }} pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: "No hay gestores que coincidan" }} />
      </Card>

      <Modal forceRender open={modal.open} title={modal.editing ? "Editar gestor" : "Nuevo gestor"}
        okText={modal.editing ? "Guardar cambios" : "Registrar"} cancelText="Cancelar"
        confirmLoading={saving} onOk={guardar} onCancel={() => setModal({ open: false, editing: null })}>
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item name="nombre" label="Nombre"
            rules={[{ required: true, whitespace: true, message: "Escribe el nombre del gestor" }, { max: 150 }]}>
            <Input placeholder="ej. Recicla Electrónicos del Norte" />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select options={TIPOS_GESTOR} />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="contacto" label="Persona de contacto"><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="telefono" label="Teléfono"
                rules={[{ pattern: /^[0-9+\-\s()]{7,20}$/, message: "Teléfono no válido" }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="correo" label="Correo" rules={[{ type: "email", message: "Correo no válido" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="direccion" label="Dirección"><Input /></Form.Item>
          <Form.Item name="materiales_aceptados" label="Materiales que acepta">
            <Input placeholder="ej. Computadoras, monitores, baterías" />
          </Form.Item>
          <Form.Item name="numero_autorizacion" label="Número de autorización"
            dependencies={["verificado"]}
            rules={[({ getFieldValue }) => ({
              validator: (_, v) =>
                getFieldValue("verificado") && !v?.trim()
                  ? Promise.reject(new Error("Para marcarlo como verificado registra su autorización"))
                  : Promise.resolve(),
            })]}>
            <Input placeholder="ej. SEMARNAT-19-AUT-0001" />
          </Form.Item>
          <Space size="large">
            <Form.Item name="verificado" label="Autorización verificada" valuePropName="checked">
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
            <Form.Item name="activo" label="Activo" valuePropName="checked">
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </Space>
          {!verificado && (
            <Alert type="info" showIcon
              message="Mientras no esté verificado, sus entregas no se contarán como destino autorizado en los reportes." />
          )}
        </Form>
      </Modal>
    </div>
  );
}
