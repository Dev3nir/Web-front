import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Form, Input, Button, Typography, Layout } from "antd";

import Logo from "../assets/logos/logo.png";
import imagen from "../assets/img_login.jpg";
import API_URL from "../config/backend.js";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const RecuperarPassPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRecuperar = async (values) => {
    if (!values) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/recuperar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "No se pudo enviar",
          text: data.message || "Verifica tu correo e inténtalo de nuevo.",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Correo enviado",
        text: "Revisa tu bandeja de entrada para continuar con la recuperación.",
        confirmButtonText: "Volver al login",
      }).then(() => navigate("/login"));
    } catch (error) {
      console.error("ERROR RECUPERAR:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar al servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#ffffff",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Header blanco, solo logo + marca */}
      <Header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          height: 64,
          lineHeight: "64px",
          padding: "0 24px",
        }}
      >
        <img
          src={Logo}
          alt="Ecolink"
          style={{ width: 32, height: 32, objectFit: "contain", marginRight: 10 }}
        />
        <span style={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>Ecolink</span>
      </Header>

      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            display: "flex",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Formulario */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ flex: 1, display: "flex", justifyContent: "center" }}
          >
            <div style={{ width: "100%", maxWidth: 420 }}>
              <Title
                level={2}
                style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: 28 }}
              >
                Recuperar contraseña
              </Title>
              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                Ingresa tu correo electrónico y te enviaremos instrucciones para
                recuperar tu acceso.
              </Text>

              <Form
                name="recuperar"
                layout="vertical"
                requiredMark={false}
                onFinish={handleRecuperar}
                size="large"
                style={{ marginTop: 24 }}
              >
                <Form.Item
                  label={
                    <span style={{ fontWeight: 500, color: "#374151" }}>
                      Correo electrónico
                    </span>
                  }
                  name="email"
                  rules={[
                    { required: true, message: "Ingresa tu correo electrónico" },
                    { type: "email", message: "Ingresa un correo válido" },
                  ]}
                >
                  <Input
                    placeholder="tu@correo.com"
                    style={{
                      borderRadius: 8,
                      padding: "10px 14px",
                      borderColor: "#D1D5DB",
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: "#4ebc3f",
                      borderColor: "#63f163",
                      fontWeight: 600,
                      fontSize: 16,
                    }}
                  >
                    Enviar correo de recuperación
                  </Button>
                </Form.Item>

                <div style={{ textAlign: "center" }}>
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                    style={{ color: "#188a12", fontSize: 14, fontWeight: 500 }}
                  >
                    ← Volver al inicio de sesión
                  </a>
                </div>
              </Form>
            </div>
          </motion.div>

          {/* Imagen derecha */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="recuperar-right-image"
            style={{
              flex: 1,
              display: "none",
              height: "70vh",
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#F3F4F6",
            }}
          >
            <img
              src={imagen}
              alt="Recuperar contraseña"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </motion.div>
        </div>
      </Content>

      <style>{`
        @media (min-width: 768px) {
          .recuperar-right-image { display: flex !important; }
        }
      `}</style>
    </Layout>
  );
};

export default RecuperarPassPage;