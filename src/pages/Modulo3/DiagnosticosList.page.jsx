import { useEffect, useMemo, useState } from "react";
import {
    Table, Button, Input, Select, Tag, Space, Modal, Form,
    Popconfirm, Tooltip, Typography, Card, message,
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
    SearchOutlined, FileSearchOutlined,
} from "@ant-design/icons";
import {
    listarDiagnosticos,
    crearDiagnostico,
    actualizarDiagnostico,
    eliminarDiagnostico,
} from "../../services/diagnosticos.service.js";
import { apiFetch } from "../../utils/api.js";

const { Title, Text } = Typography;
const { TextArea } = Input;

const RECOMENDACIONES = {
    reparar: { label: "Reparar", color: "blue" },
    reutilizar: { label: "Reutilizar", color: "green" },
    conservar: { label: "Conservar", color: "cyan" },
    gestion_especializada: { label: "Gestión especializada", color: "volcano" },
};

const RECOMENDACION_OPTIONS = Object.entries(RECOMENDACIONES).map(([value, r]) => ({
    value,
    label: r.label,
}));

const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
};

const formatFecha = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("es-MX");
};

export default function DiagnosticosList() {
    const user = getCurrentUser();
    const puedeEditar = user.rol === "responsable" || user.rol === "administrador";
    const esAdmin = user.rol === "administrador";

    const [diagnosticos, setDiagnosticos] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // filtros
    const [busqueda, setBusqueda] = useState("");
    const [filtroRec, setFiltroRec] = useState();

    // modal crear / editar
    const [modal, setModal] = useState({ open: false, editing: null });
    const [form] = Form.useForm();

    const cargar = async () => {
        try {
            setLoading(true);
            const [diagsRes, eqRes] = await Promise.allSettled([
                listarDiagnosticos(),
                apiFetch("/equipos"),
            ]);

            if (diagsRes.status === "fulfilled") {
                setDiagnosticos(Array.isArray(diagsRes.value) ? diagsRes.value : []);
            } else {
                message.error(diagsRes.reason?.message || "No se pudieron cargar los diagnósticos");
            }

            if (eqRes.status === "fulfilled") {
                setEquipos(Array.isArray(eqRes.value) ? eqRes.value : []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    // Mapa rápido id -> equipo para mostrar código/nombre aunque el back solo devuelva equipo_id
    const equiposMap = useMemo(() => {
        const map = {};
        for (const eq of equipos) map[eq.id] = eq;
        return map;
    }, [equipos]);

    const equipoLabel = (row) => {
  if (row.equipo_codigo || row.equipo_nombre) {
    return `${row.equipo_codigo ?? ""} ${row.equipo_nombre ?? ""}`.trim();
  }
  const eq = equiposMap[row.equipo_id];
  if (eq) {
    return `${eq.codigo} · ${eq.categoria_nombre ?? `Cat #${eq.categoria_id}`}${eq.marca ? ` (${eq.marca})` : ""}`;
  }
  return `Equipo #${row.equipo_id}`;
};

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return diagnosticos.filter((d) => {
            const texto = `${equipoLabel(d)} ${d.diagnostico ?? ""} ${d.responsable_nombre ?? ""}`.toLowerCase();
            return (!q || texto.includes(q)) && (!filtroRec || d.recomendacion === filtroRec);
        });
    }, [diagnosticos, equiposMap, busqueda, filtroRec]);

    // ---------- crear / editar ----------
    const abrirCrear = () => {
        form.resetFields();
        form.setFieldsValue({ recomendacion: "reparar" });
        setModal({ open: true, editing: null });
    };

    const abrirEditar = (row) => {
        form.resetFields();
        form.setFieldsValue({
            equipo_id: row.equipo_id,
            diagnostico: row.diagnostico,
            recomendacion: row.recomendacion,
        });
        setModal({ open: true, editing: row });
    };

    const guardar = async () => {
        try {
            const v = await form.validateFields();
            setSaving(true);

            const payload = {
                equipo_id: v.equipo_id,
                diagnostico: v.diagnostico.trim(),
                recomendacion: v.recomendacion,
                ...(user.id_usuario ? { responsable_id: user.id_usuario } : {}),
            };

            if (modal.editing) {
                await actualizarDiagnostico(modal.editing.id, payload);
                message.success("Diagnóstico actualizado");
            } else {
                await crearDiagnostico(payload);
                message.success("Diagnóstico registrado");
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

    const handleEliminar = async (id) => {
        try {
            await eliminarDiagnostico(id);
            message.success("Diagnóstico eliminado");
            cargar();
        } catch (e) {
            message.error(e.message);
        }
    };

    const columns = [
        {
            title: "Equipo",
            dataIndex: "equipo_id",
            render: (_, row) => <Text strong>{equipoLabel(row)}</Text>,
        },
        {
            title: "Diagnóstico",
            dataIndex: "diagnostico",
            ellipsis: true,
        },
        {
            title: "Recomendación",
            dataIndex: "recomendacion",
            render: (v) => (
                <Tag color={RECOMENDACIONES[v]?.color}>
                    {RECOMENDACIONES[v]?.label ?? v}
                </Tag>
            ),
        },
        {
            title: "Fecha",
            dataIndex: "fecha",
            sorter: (a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0),
            render: (v) => formatFecha(v),
        },
        {
            title: "Responsable",
            dataIndex: "responsable_nombre",
            render: (v, row) => v || (row.responsable_id ? `Usuario #${row.responsable_id}` : "—"),
        },
        ...(puedeEditar || esAdmin
            ? [
                {
                    title: "Acciones",
                    fixed: "right",
                    width: 120,
                    render: (_, row) => (
                        <Space size="small">
                            {puedeEditar && (
                                <Tooltip title="Editar">
                                    <Button icon={<EditOutlined />} onClick={() => abrirEditar(row)} />
                                </Tooltip>
                            )}
                            {esAdmin && (
                                <Popconfirm
                                    title="¿Eliminar diagnóstico?"
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
                            )}
                        </Space>
                    ),
                },
            ]
            : []),
    ];

    const editando = Boolean(modal.editing);

    return (
        <div>
            <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                <Space align="center">
                    <FileSearchOutlined style={{ fontSize: 26 }} />
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Diagnósticos técnicos</Title>
                        <Text type="secondary">
                            {diagnosticos.length} registrados · {filtrados.length} mostrados
                        </Text>
                    </div>
                </Space>
                {puedeEditar && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
                        Nuevo diagnóstico
                    </Button>
                )}
            </Space>

            <Card style={{ marginTop: 16 }}>
                <Space wrap style={{ marginBottom: 16 }}>
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Buscar por equipo, diagnóstico o responsable"
                        style={{ width: 320 }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    <Select
                        allowClear
                        placeholder="Recomendación"
                        style={{ width: 220 }}
                        options={RECOMENDACION_OPTIONS}
                        value={filtroRec}
                        onChange={setFiltroRec}
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
                    locale={{ emptyText: "No hay diagnósticos registrados" }}
                />
            </Card>

            <Modal
                forceRender
                open={modal.open}
                title={editando ? "Editar diagnóstico" : "Nuevo diagnóstico"}
                okText={editando ? "Guardar cambios" : "Registrar diagnóstico"}
                cancelText="Cancelar"
                confirmLoading={saving}
                onOk={guardar}
                onCancel={() => setModal({ open: false, editing: null })}
            >
                <Form form={form} layout="vertical" requiredMark="optional">
                    <Form.Item
                        name="equipo_id"
                        label="Equipo"
                        rules={[{ required: true, message: "Selecciona un equipo" }]}
                    >
                        <Select
  showSearch
  optionFilterProp="label"
  placeholder="Selecciona el equipo a diagnosticar"
  options={equipos.map((eq) => ({
    value: eq.id,
    label: `${eq.codigo} · ${eq.categoria_nombre ?? `Cat #${eq.categoria_id}`}${eq.marca ? ` (${eq.marca})` : ""}`,
  }))}
/>
                    </Form.Item>

                    <Form.Item
                        name="recomendacion"
                        label="Recomendación"
                        rules={[{ required: true, message: "Selecciona una recomendación" }]}
                    >
                        <Select options={RECOMENDACION_OPTIONS} />
                    </Form.Item>

                    <Form.Item
                        name="diagnostico"
                        label="Descripción del diagnóstico"
                        rules={[{ required: true, message: "Describe el estado técnico del equipo" }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Ej. Falla en fuente de poder, el resto de componentes funciona correctamente."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}