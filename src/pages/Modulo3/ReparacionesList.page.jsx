import { useEffect, useMemo, useState } from "react";
import {
    Table, Button, Input, InputNumber, Select, Space, Modal, Form,
    Popconfirm, Tooltip, Typography, Card, Row, Col, Statistic, message,
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
    SearchOutlined, ToolOutlined,
} from "@ant-design/icons";
import {
    listarReparaciones,
    crearReparacion,
    actualizarReparacion,
    eliminarReparacion,
} from "../../services/reparaciones.service.js";
import { listarDiagnosticos } from "../../services/diagnosticos.service.js";
import { apiFetch } from "../../utils/api.js";

const { Title, Text } = Typography;
const { TextArea } = Input;

const MXN = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
});

const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
};

const hoyISO = () => new Date().toISOString().slice(0, 10);

const formatFecha = (val) => {
    if (!val) return "—";
    const soloFecha = String(val).slice(0, 10);
    const [y, m, d] = soloFecha.split("-");
    return y && m && d ? `${d}/${m}/${y}` : val;
};

export default function ReparacionesList() {
    const user = getCurrentUser();
    const puedeEditar = user.rol === "responsable" || user.rol === "administrador";
    const esAdmin = user.rol === "administrador";

    const [reparaciones, setReparaciones] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [diagnosticos, setDiagnosticos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // filtro
    const [busqueda, setBusqueda] = useState("");

    // modal crear / editar
    const [modal, setModal] = useState({ open: false, editing: null });
    const [form] = Form.useForm();
    const equipoSeleccionado = Form.useWatch("equipo_id", form);

    const cargar = async () => {
        try {
            setLoading(true);
            const [repRes, eqRes, diagRes] = await Promise.allSettled([
                listarReparaciones(),
                apiFetch("/equipos"),
                listarDiagnosticos(),
            ]);

            if (repRes.status === "fulfilled") {
                setReparaciones(Array.isArray(repRes.value) ? repRes.value : []);
            } else {
                message.error(repRes.reason?.message || "No se pudieron cargar las reparaciones");
            }

            if (eqRes.status === "fulfilled") {
                setEquipos(Array.isArray(eqRes.value) ? eqRes.value : []);
            }

            if (diagRes.status === "fulfilled") {
                setDiagnosticos(Array.isArray(diagRes.value) ? diagRes.value : []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

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
        return reparaciones.filter((r) => {
            const texto = `${equipoLabel(r)} ${r.descripcion ?? ""} ${r.responsable_nombre ?? ""}`.toLowerCase();
            return !q || texto.includes(q);
        });
    }, [reparaciones, equiposMap, busqueda]);

    // Totales visibles
    const totales = useMemo(() => {
        return filtrados.reduce(
            (acc, r) => ({
                costo: acc.costo + Number(r.costo || 0),
                ahorro: acc.ahorro + Number(r.ahorro_estimado || 0),
            }),
            { costo: 0, ahorro: 0 }
        );
    }, [filtrados]);

    // Diagnósticos filtrados por el equipo elegido en el modal
    const diagnosticosDelEquipo = useMemo(() => {
        if (!equipoSeleccionado) return [];
        return diagnosticos
            .filter((d) => Number(d.equipo_id) === Number(equipoSeleccionado))
            .map((d) => ({
                value: d.id,
                label: `#${d.id} · ${d.recomendacion} — ${(d.diagnostico || "").slice(0, 50)}`,
            }));
    }, [diagnosticos, equipoSeleccionado]);

    // ---------- crear / editar ----------
    const abrirCrear = () => {
        form.resetFields();
        form.setFieldsValue({
            costo: 0,
            ahorro_estimado: 0,
            fecha: hoyISO(),
        });
        setModal({ open: true, editing: null });
    };

    const abrirEditar = (row) => {
        form.resetFields();
        form.setFieldsValue({
            equipo_id: row.equipo_id,
            diagnostico_id: row.diagnostico_id ?? undefined,
            descripcion: row.descripcion,
            costo: Number(row.costo ?? 0),
            ahorro_estimado: Number(row.ahorro_estimado ?? 0),
            fecha: row.fecha ? String(row.fecha).slice(0, 10) : hoyISO(),
        });
        setModal({ open: true, editing: row });
    };

    const guardar = async () => {
        try {
            const v = await form.validateFields();
            setSaving(true);

            const payload = {
                equipo_id: v.equipo_id,
                diagnostico_id: v.diagnostico_id ?? null,
                descripcion: v.descripcion.trim(),
                costo: Number(v.costo ?? 0),
                ahorro_estimado: Number(v.ahorro_estimado ?? 0),
                fecha: v.fecha,
                ...(user.id_usuario ? { responsable_id: user.id_usuario } : {}),
            };

            if (modal.editing) {
                await actualizarReparacion(modal.editing.id, payload);
                message.success("Reparación actualizada");
            } else {
                await crearReparacion(payload);
                message.success("Reparación registrada");
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
            await eliminarReparacion(id);
            message.success("Reparación eliminada");
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
            title: "Descripción",
            dataIndex: "descripcion",
            ellipsis: true,
        },
        {
            title: "Costo",
            dataIndex: "costo",
            align: "right",
            sorter: (a, b) => Number(a.costo || 0) - Number(b.costo || 0),
            render: (v) => MXN.format(Number(v || 0)),
        },
        {
            title: "Ahorro estimado",
            dataIndex: "ahorro_estimado",
            align: "right",
            sorter: (a, b) => Number(a.ahorro_estimado || 0) - Number(b.ahorro_estimado || 0),
            render: (v) => (
                <Text type="success" strong>
                    {MXN.format(Number(v || 0))}
                </Text>
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
                                    title="¿Eliminar reparación?"
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
                    <ToolOutlined style={{ fontSize: 26 }} />
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Reparaciones</Title>
                        <Text type="secondary">
                            {reparaciones.length} registradas · {filtrados.length} mostradas
                        </Text>
                    </div>
                </Space>
                {puedeEditar && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
                        Nueva reparación
                    </Button>
                )}
            </Space>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic title="Reparaciones mostradas" value={filtrados.length} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Costo total"
                            value={totales.costo}
                            precision={2}
                            prefix="$"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Ahorro estimado total"
                            value={totales.ahorro}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: "#3f8600" }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 16 }}>
                <Space wrap style={{ marginBottom: 16 }}>
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Buscar por equipo, descripción o responsable"
                        style={{ width: 320 }}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
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
                    scroll={{ x: 850 }}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    locale={{ emptyText: "No hay reparaciones registradas" }}
                />
            </Card>

            <Modal
                forceRender
                open={modal.open}
                title={editando ? "Editar reparación" : "Nueva reparación"}
                okText={editando ? "Guardar cambios" : "Registrar reparación"}
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
    placeholder="Selecciona el equipo reparado"
    onChange={() => form.setFieldValue("diagnostico_id", undefined)}
    options={equipos.map((eq) => ({
        value: eq.id,
        label: `${eq.codigo} · ${eq.categoria_nombre ?? `Cat #${eq.categoria_id}`}${eq.marca ? ` (${eq.marca})` : ""}`,
    }))}
/>
                    </Form.Item>

                    <Form.Item
                        name="diagnostico_id"
                        label="Diagnóstico asociado (opcional)"
                    >
                        <Select
                            allowClear
                            disabled={!equipoSeleccionado}
                            placeholder={
                                equipoSeleccionado
                                    ? "Selecciona un diagnóstico previo si aplica"
                                    : "Primero selecciona un equipo"
                            }
                            options={diagnosticosDelEquipo}
                            notFoundContent="Este equipo no tiene diagnósticos registrados"
                        />
                    </Form.Item>

                    <Form.Item
                        name="descripcion"
                        label="Descripción de la reparación"
                        rules={[{ required: true, message: "Describe el trabajo realizado" }]}
                    >
                        <TextArea
                            rows={3}
                            placeholder="Ej. Reemplazo de fuente de poder y limpieza interna."
                        />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="costo"
                                label="Costo (MXN)"
                                rules={[{ required: true, message: "Ingresa el costo" }]}
                            >
                                <InputNumber
                                    min={0}
                                    step={50}
                                    precision={2}
                                    prefix="$"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="ahorro_estimado"
                                label="Ahorro estimado (MXN)"
                                rules={[{ required: true, message: "Ingresa el ahorro estimado" }]}
                            >
                                <InputNumber
                                    min={0}
                                    step={50}
                                    precision={2}
                                    prefix="$"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="fecha"
                        label="Fecha de reparación"
                        rules={[{ required: true, message: "Selecciona la fecha" }]}
                    >
                        <Input type="date" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}