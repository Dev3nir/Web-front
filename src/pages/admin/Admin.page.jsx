
// src/pages/admin/Admin.page.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Input, Select, Tag, Avatar, Space, Modal, Form, Switch,
  Popconfirm, Tooltip, Typography, Card, message,
} from "antd";
import {
  UserAddOutlined, EditOutlined, KeyOutlined, StopOutlined, DeleteOutlined,
  ReloadOutlined, SearchOutlined, UserOutlined, MailOutlined, LockOutlined,
  IdcardOutlined, TeamOutlined,
} from "@ant-design/icons";
import {
  listarUsuarios, crearUsuario, actualizarUsuario,
  cambiarPasswordUsuario, desactivarUsuario, eliminarUsuario,
} from "../../services/usuarios.service.js";
 
const { Title, Text } = Typography;
 
const ROLES = {
  capturista: { label: "Capturista", color: "blue" },
  responsable: { label: "Responsable ambiental", color: "green" },
  administrador: { label: "Administrador", color: "volcano" },
};
const ROL_OPTIONS = Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label }));
 
export default function AdminPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
 
  // filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState();
  const [filtroEstado, setFiltroEstado] = useState();
 
  // modales
  const [modal, setModal] = useState({ open: false, editing: null }); // crear / editar
  const [pwdModal, setPwdModal] = useState({ open: false, user: null });
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
 
  const cargar = async () => {
    try {
      setLoading(true);
      setUsuarios(await listarUsuarios());
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => { cargar(); }, []);
 
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      const texto = `${u.nombre_usuario} ${u.nombre_completo} ${u.correo ?? ""}`.toLowerCase();
      return (
        (!q || texto.includes(q)) &&
        (!filtroRol || u.rol === filtroRol) &&
        (filtroEstado === undefined || Boolean(u.activo) === filtroEstado)
      );
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);
 
  // ---------- crear / editar ----------
  const abrirCrear = () => {
    form.resetFields();
    form.setFieldsValue({ rol: "capturista", activo: true });
    setModal({ open: true, editing: null });
  };
 
  const abrirEditar = (u) => {
    form.resetFields();
    form.setFieldsValue({
      nombre_usuario: u.nombre_usuario,
      nombre_completo: u.nombre_completo,
      correo: u.correo,
      rol: u.rol,
      activo: Boolean(u.activo),
    });
    setModal({ open: true, editing: u });
  };
 
  const guardar = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      if (modal.editing) {
        await actualizarUsuario(modal.editing.id, {
          nombre_completo: v.nombre_completo.trim(),
          correo: v.correo?.trim() || null,
          rol: v.rol,
          activo: v.activo ? 1 : 0,
        });
        message.success("Usuario actualizado");
      } else {
        await crearUsuario({
          nombre_usuario: v.nombre_usuario.trim(),
          nombre_completo: v.nombre_completo.trim(),
          correo: v.correo?.trim() || null,
          password: v.password,
          rol: v.rol,
        });
        message.success("Usuario creado");
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
 
  // ---------- contraseña ----------
  const abrirPassword = (u) => {
    pwdForm.resetFields();
    setPwdModal({ open: true, user: u });
  };
 
  const guardarPassword = async () => {
    try {
      const v = await pwdForm.validateFields();
      setSaving(true);
      await cambiarPasswordUsuario(pwdModal.user.id, { password: v.password });
      message.success("Contraseña actualizada");
      setPwdModal({ open: false, user: null });
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };
 
  // ---------- desactivar / eliminar ----------
  const handleDesactivar = async (id) => {
    try {
      await desactivarUsuario(id);
      message.success("Usuario desactivado");
      cargar();
    } catch (e) {
      message.error(e.message);
    }
  };
 
  const handleEliminar = async (id) => {
    try {
      await eliminarUsuario(id);
      message.success("Usuario eliminado");
      cargar();
    } catch (e) {
      message.error(e.message);
    }
  };
 
  const columns = [
    {
      title: "Usuario",
      dataIndex: "nombre_usuario",
      sorter: (a, b) => a.nombre_usuario.localeCompare(b.nombre_usuario),
      render: (v, row) => (
        <Space>
          <Avatar style={{ background: "#6FA382" }} icon={<UserOutlined />} />
          <div>
            <Text strong>{v}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.correo || "Sin correo"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Nombre",
      dataIndex: "nombre_completo",
      sorter: (a, b) => a.nombre_completo.localeCompare(b.nombre_completo),
    },
    {
      title: "Rol",
      dataIndex: "rol",
      render: (v) => <Tag color={ROLES[v]?.color}>{ROLES[v]?.label ?? v}</Tag>,
    },
    {
      title: "Estado",
      dataIndex: "activo",
      render: (v) => (v ? <Tag color="success">Activo</Tag> : <Tag>Inactivo</Tag>),
    },
    {
      title: "Acciones",
      fixed: "right",
      render: (_, row) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={() => abrirEditar(row)} />
          </Tooltip>
          <Tooltip title="Cambiar contraseña">
            <Button icon={<KeyOutlined />} onClick={() => abrirPassword(row)} />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar usuario?"
            description="Ya no podrá iniciar sesión, pero se conserva su historial."
            okText="Desactivar"
            cancelText="Cancelar"
            onConfirm={() => handleDesactivar(row.id)}
            disabled={!row.activo}
          >
            <Tooltip title={row.activo ? "Desactivar" : "Ya está inactivo"}>
              <Button icon={<StopOutlined />} disabled={!row.activo} />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="¿Eliminar definitivamente?"
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
            <Title level={3} style={{ margin: 0 }}>Gestión de usuarios</Title>
            <Text type="secondary">{usuarios.length} registrados · {filtrados.length} mostrados</Text>
          </div>
        </Space>
        <Button type="primary" icon={<UserAddOutlined />} onClick={abrirCrear}>
          Nuevo usuario
        </Button>
      </Space>
 
      <Card style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar por usuario, nombre o correo"
            style={{ width: 280 }}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Rol"
            style={{ width: 200 }}
            options={ROL_OPTIONS}
            value={filtroRol}
            onChange={setFiltroRol}
          />
          <Select
            allowClear
            placeholder="Estado"
            style={{ width: 140 }}
            options={[
              { value: true, label: "Activos" },
              { value: false, label: "Inactivos" },
            ]}
            value={filtroEstado}
            onChange={setFiltroEstado}
          />
          <Tooltip title="Recargar">
            <Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} />
          </Tooltip>
        </Space>
 
        <Table
          rowKey="id"
          dataSource={filtrados}
          columns={columns}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: "No hay usuarios que coincidan" }}
        />
      </Card>
 
      {/* Modal crear / editar */}
      <Modal
        forceRender
        open={modal.open}
        title={editando ? "Editar usuario" : "Nuevo usuario"}
        okText={editando ? "Guardar cambios" : "Crear usuario"}
        cancelText="Cancelar"
        confirmLoading={saving}
        onOk={guardar}
        onCancel={() => setModal({ open: false, editing: null })}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="nombre_usuario"
            label="Nombre de usuario"
            rules={[{ required: true, message: "Escribe el nombre de usuario" }]}
          >
            <Input prefix={<IdcardOutlined />} disabled={editando} placeholder="ej. jperez" />
          </Form.Item>
          <Form.Item
            name="nombre_completo"
            label="Nombre completo"
            rules={[{ required: true, message: "Escribe el nombre completo" }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="correo"
            label="Correo"
            rules={[{ type: "email", message: "Correo no válido" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="opcional" />
          </Form.Item>
          {!editando && (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: "Escribe una contraseña" },
                { min: 8, message: "Mínimo 8 caracteres" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
          )}
          <Form.Item name="rol" label="Rol" rules={[{ required: true }]}>
            <Select options={ROL_OPTIONS} />
          </Form.Item>
          {editando && (
            <Form.Item name="activo" label="Usuario activo" valuePropName="checked">
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          )}
        </Form>
      </Modal>
 
      {/* Modal contraseña */}
      <Modal
        forceRender
        open={pwdModal.open}
        title={`Cambiar contraseña${pwdModal.user ? ` · ${pwdModal.user.nombre_usuario}` : ""}`}
        okText="Actualizar contraseña"
        cancelText="Cancelar"
        confirmLoading={saving}
        onOk={guardarPassword}
        onCancel={() => setPwdModal({ open: false, user: null })}
      >
        <Form form={pwdForm} layout="vertical">
          <Form.Item
            name="password"
            label="Nueva contraseña"
            rules={[
              { required: true, message: "Escribe la nueva contraseña" },
              { min: 8, message: "Mínimo 8 caracteres" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="confirmar"
            label="Confirmar contraseña"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirma la contraseña" },
              ({ getFieldValue }) => ({
                validator: (_, v) =>
                  !v || getFieldValue("password") === v
                    ? Promise.resolve()
                    : Promise.reject(new Error("Las contraseñas no coinciden")),
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
 