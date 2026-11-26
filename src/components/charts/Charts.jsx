// src/components/charts/Charts.jsx
// Gráficas ligeras hechas con HTML + CSS (sin librerías extra).
// Cada gráfica tiene tooltip al pasar el mouse y se puede ver como tabla.
import { useState } from "react";
import { Card, Empty, Segmented, Table, Tooltip, Space, Typography } from "antd";
import { BarChartOutlined, TableOutlined } from "@ant-design/icons";

const { Text } = Typography;

// Colores (validados para daltonismo y contraste)
export const VIZ = {
  serie: "#2f7d4a",      // verde principal (una sola serie)
  validado: "#2f7d4a",   // verde
  pendiente: "#f2a600",  // ámbar (siempre lleva etiqueta numérica)
  grid: "#eef1ee",
  texto: "#2A302E",
  textoSec: "#6b7270",
  track: "#f3f5f3",
};

const fmt = (n) => Number(n || 0).toLocaleString("es-MX");

const css = `
.viz-row{display:grid;grid-template-columns:minmax(90px,34%) 1fr auto;gap:10px;align-items:center;padding:6px 4px;border-radius:6px;cursor:default}
.viz-row:hover{background:${VIZ.track}}
.viz-track{height:14px;background:transparent;position:relative;display:flex;gap:2px}
.viz-bar{height:100%;border-radius:0 4px 4px 0;transition:width .5s ease}
.viz-val{font-variant-numeric:tabular-nums;color:${VIZ.texto};font-weight:600;min-width:36px;text-align:right}
.viz-lbl{color:${VIZ.texto};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.viz-cols{display:flex;align-items:flex-end;gap:6px;height:180px;border-bottom:1px solid #d4dbd3;position:relative}
.viz-col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;cursor:default}
.viz-col:hover .viz-colbar{filter:brightness(1.15)}
.viz-colbar{width:70%;max-width:36px;border-radius:4px 4px 0 0;transition:height .5s ease}
.viz-collbl{font-size:12px;color:${VIZ.textoSec};flex:1;text-align:center}
.viz-legend{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px;font-size:13px;color:${VIZ.textoSec}}
.viz-sw{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:middle}
`;

export function VizStyles() {
  return <style>{css}</style>;
}

/** Tarjeta con selector Gráfica / Tabla. */
export function ChartCard({ title, extra, data, columns, children, rowKey = "etiqueta" }) {
  const [vista, setVista] = useState("grafica");
  const vacio = !data || data.length === 0;

  return (
    <Card
      title={title}
      style={{ height: "100%" }}
      extra={
        <Space>
          {extra}
          {!vacio && columns && (
            <Segmented
              size="small"
              value={vista}
              onChange={setVista}
              options={[
                { value: "grafica", icon: <BarChartOutlined />, title: "Ver gráfica" },
                { value: "tabla", icon: <TableOutlined />, title: "Ver como tabla" },
              ]}
            />
          )}
        </Space>
      }
    >
      {vacio ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin datos todavía" />
      ) : vista === "tabla" && columns ? (
        <Table size="small" rowKey={rowKey} dataSource={data} columns={columns} pagination={false} />
      ) : (
        children
      )}
    </Card>
  );
}

/** Barras horizontales de una serie: data = [{ etiqueta, total }] */
export function BarList({ data = [], label = (d) => d.etiqueta, color = VIZ.serie, unidad = "" }) {
  const max = Math.max(1, ...data.map((d) => Number(d.total) || 0));
  return (
    <div role="list">
      {data.map((d) => {
        const pct = ((Number(d.total) || 0) / max) * 100;
        return (
          <Tooltip key={d.etiqueta} title={`${label(d)}: ${fmt(d.total)}${unidad}`} placement="topLeft">
            <div className="viz-row" role="listitem" aria-label={`${label(d)}: ${fmt(d.total)}${unidad}`}>
              <span className="viz-lbl">{label(d)}</span>
              <div className="viz-track">
                <div className="viz-bar" style={{ width: `${Math.max(pct, 1.5)}%`, background: color }} />
              </div>
              <span className="viz-val">{fmt(d.total)}{unidad}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

/**
 * Barras horizontales apiladas de dos partes.
 * data = [{ etiqueta, a, b }], series = [{ key:'a', nombre, color }, { key:'b', ... }]
 */
export function StackedBarList({ data = [], series, label = (d) => d.etiqueta }) {
  const max = Math.max(1, ...data.map((d) => series.reduce((s, x) => s + (Number(d[x.key]) || 0), 0)));
  return (
    <div>
      <div className="viz-legend">
        {series.map((s) => (
          <span key={s.key}><span className="viz-sw" style={{ background: s.color }} />{s.nombre}</span>
        ))}
      </div>
      {data.map((d) => {
        const total = series.reduce((s, x) => s + (Number(d[x.key]) || 0), 0);
        const detalle = series.map((s) => `${s.nombre}: ${fmt(d[s.key])}`).join(" · ");
        return (
          <Tooltip key={d.etiqueta} title={`${label(d)} — ${detalle}`} placement="topLeft">
            <div className="viz-row" aria-label={`${label(d)}: ${detalle}`}>
              <span className="viz-lbl">{label(d)}</span>
              <div className="viz-track">
                {series.map((s, i) => {
                  const v = Number(d[s.key]) || 0;
                  if (!v) return null;
                  const ultimo = series.slice(i + 1).every((x) => !(Number(d[x.key]) || 0));
                  return (
                    <div
                      key={s.key}
                      className="viz-bar"
                      style={{
                        width: `${(v / max) * 100}%`,
                        background: s.color,
                        borderRadius: ultimo ? "0 4px 4px 0" : 0,
                      }}
                    />
                  );
                })}
              </div>
              <span className="viz-val">{fmt(total)}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** Columnas por mes (últimos 12). data = [{ mes:'2026-05', total }] */
export function MonthColumns({ data = [], color = VIZ.serie }) {
  // Rellenar los meses sin registros con 0 para que la línea de tiempo sea continua
  const hoy = new Date();
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const fila = data.find((x) => x.mes === key);
    return {
      key,
      corto: d.toLocaleDateString("es-MX", { month: "short" }).replace(".", ""),
      largo: d.toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
      total: Number(fila?.total) || 0,
    };
  });
  const max = Math.max(1, ...meses.map((m) => m.total));
  const idxMax = meses.findIndex((m) => m.total === max && max > 0);

  return (
    <div>
      <div className="viz-cols">
        {meses.map((m, i) => (
          <Tooltip key={m.key} title={`${m.largo}: ${fmt(m.total)} equipos`}>
            <div className="viz-col" aria-label={`${m.largo}: ${m.total} equipos`}>
              {(i === idxMax || i === meses.length - 1) && m.total > 0 && (
                <Text style={{ fontSize: 12, fontWeight: 600 }}>{fmt(m.total)}</Text>
              )}
              <div
                className="viz-colbar"
                style={{ height: `${(m.total / max) * 85}%`, minHeight: m.total ? 3 : 0, background: color }}
              />
            </div>
          </Tooltip>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {meses.map((m) => <span key={m.key} className="viz-collbl">{m.corto}</span>)}
      </div>
    </div>
  );
}
