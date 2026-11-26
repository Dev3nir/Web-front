import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Form, Input, Button, Typography } from "antd";

import Logo from "../assets/logos/logo.png";
import imagen from "../assets/img_login.jpg";
import API_URL from "../config/backend.js";
import { ArrowLeftOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;


const HOME_BY_ROL = {
  administrador: "/admin/",
  capturista: "/capturista",
  responsable: "/responsable",
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    if (!values) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      console.log("RESPONSE:", data);

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Error de autenticación",
          text:
            data.message === "Contraseña incorrecta"
              ? "Contraseña incorrecta"
              : data.message || "Error de login",
        });
        return;
      }

      // Normaliza rol (por si el backend lo manda con mayúsculas o "Administrador")
      const rol = (data.rol || "").toLowerCase().trim();

      // Guarda sesión
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id_usuario: data.id,
          nombreUsuario: data.nombre_usuario,
          rol,
        })
      );

      Swal.fire({
        icon: "success",
        title: "Login exitoso",
        text: "Accediendo al panel...",
        timer: 1200,
        showConfirmButton: false,
      });

      // Redirección por rol (con fallback a la landing)
      navigate("/panel");
    } catch (error) {
      console.log("ERROR LOGIN:", error);
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
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        userSelect: "none",
      }}
    >
      {/* Lado Izquierdo: Formulario */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          backgroundColor: "#ffffff",
          zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Logo y encabezado */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <a 
              onClick={() => navigate("/")} 
              style={{ 
                position: "absolute", 
                left: 30, 
                top: 40, 
                display: "flex", 
                alignItems: "center", 
                color: "#6B7280", 
                fontSize: "14px",
                textDecoration: "none",
                fontWeight: 500
              }}
            >
              <ArrowLeftOutlined style={{ marginRight: 4 }} /> Volver
            </a>
            <img
              src={Logo}
              alt="Logo Ecolink"
              style={{
                width: "56px",
                height: "56px",
                objectFit: "contain",
                marginBottom: "16px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Title
              level={2}
              style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: "28px" }}
            >
              Bienvenido de nuevo
            </Title>
            <Text type="secondary" style={{ fontSize: "14px", color: "#6B7280" }}>
              Por favor ingresa tus datos para continuar.
            </Text>
          </div>

          {/* Formulario */}
          <Form
            name="login"
            layout="vertical"
            requiredMark={false}
            onFinish={handleLogin}
            size="large"
          >
            <Form.Item
              label={<span style={{ fontWeight: 500, color: "#374151" }}>Nombre de usuario</span>}
              name="username"
              rules={[
                { required: true, message: "Por favor ingresa tu nombre de usuario" },
              ]}
              style={{ marginBottom: "20px" }}
            >
              <Input
                placeholder="Ingresa tu usuario"
                style={{
                  borderRadius: "8px",
                  padding: "10px 14px",
                  borderColor: "#D1D5DB",
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500, color: "#374151" }}>Contraseña</span>}
              name="password"
              rules={[{ required: true, message: "Por favor ingresa tu contraseña" }]}
              style={{ marginBottom: "12px" }}
            >
              <Input.Password
                placeholder="••••••••"
                style={{
                  borderRadius: "8px",
                  padding: "10px 14px",
                  borderColor: "#D1D5DB",
                }}
              />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
              <a
                href="/recuperar-password"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/recuperar-password");
                }}
                style={{
                  color: "#188a12",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "8px",
                  backgroundColor: "#4ebc3f",
                  borderColor: "#63f163",
                  fontWeight: 600,
                  fontSize: "16px",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
              >
                Ingresar
              </Button>
            </Form.Item>
          </Form>

          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: "12px", color: "#9CA3AF" }}>
              © Ecolink 2026
            </Text>
          </div>
        </div>
      </motion.div>

      {/* Lado Derecho: Imagen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1,
          display: "none",
          position: "relative",
          backgroundColor: "#F3F4F6",
        }}
        className="login-right-image"
      >
        <img
          src={imagen}
          alt="Login visual"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </motion.div>

      <style>{`
        @media (min-width: 768px) {
          .login-right-image {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;