import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";

export default function AlertaLeyKarinEmail() {
  const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://apiconvivencia.daemlu.cl";
  const logoUrl = `${baseUrl}/img/logo_daem.png`;

  return (
    <Html>
      <Head />
      <Preview>Nueva Denuncia Ley Karin Recibida</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={logoUrl}
              width="300"
              height="61"
              alt="Logo DAEM"
              style={logo}
            />
          </Section>
          <Heading style={h1}>Nueva Denuncia - Ley Karin</Heading>
          <Text style={text}>
            Estimado/a Encargado/a,
          </Text>
          <Text style={text}>
            Te informamos que ha ingresado un nuevo formulario de denuncia a través del portal de la Ley Karin.
          </Text>
          <Hr style={hr} />
          <Heading style={h2}>Acción Requerida</Heading>
          <Text style={text}>
            Por favor, revisa el detalle completo de la denuncia y toma las acciones correspondientes ingresando al sistema.
          </Text>
          <Section style={{ textAlign: "center" as const, margin: "30px 0" }}>
            <Button
              href="http://convivencia.daemlu.cl"
              style={button}
            >
              Revisar Denuncia
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Este es un correo generado automáticamente. Por favor no responder a esta dirección.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  border: "1px solid #e6ebf1",
  width: "580px",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "20px",
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const h2 = {
  color: "#444",
  fontSize: "18px",
  fontWeight: "bold",
  marginTop: "20px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "15px 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "4px",
  color: "#fff",
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "210px",
  padding: "14px 7px",
  margin: "0 auto",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
