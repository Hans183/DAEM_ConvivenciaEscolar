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
} from "@react-email/components";


interface DenunciaRecibidaEmailProps {
  nombresDenunciante?: string;
  materia: string;
  fecha: string;
  anonima?: boolean;
}

export default function DenunciaRecibidaEmail({
  nombresDenunciante,
  materia,
  fecha,
  anonima = false,
}: DenunciaRecibidaEmailProps) {
  const destinatario = anonima ? "Estimado/a Denunciante" : `Estimado/a ${nombresDenunciante}`;

  const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://apiconvivencia.daemlu.cl";
  const logoUrl = `${baseUrl}/img/logo_daem.png`;

  return (
    <Html>
      <Head />
      <Preview>Confirmación de recepción de denuncia - Ley Karin</Preview>
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
          <Heading style={h1}>Acuse de Recibo - Ley Karin</Heading>
          <Text style={text}>
            {destinatario},
          </Text>
          <Text style={text}>
            Te informamos que hemos recibido exitosamente tu formulario de denuncia relacionado con <strong>{materia}</strong>, de conformidad a los procedimientos estipulados por la de Ley Karin.
          </Text>
          <Section style={informationTable}>
            <Text style={informationTableRow}>
              <strong>Fecha de Ingreso:</strong> {fecha}
            </Text>
            <Text style={informationTableRow}>
              <strong>Materia:</strong> {materia}
            </Text>
            {anonima && (
              <Text style={informationTableRow}>
                <strong>Reserva de Identidad:</strong> Solicitada
              </Text>
            )}
          </Section>
          <Hr style={hr} />
          <Heading style={h2}>Pasos a seguir</Heading>
          <Text style={text}>
            Dentro de los próximos días, el equipo designado bajo el protocolo de la Ley N°21.643 
            examinará los antecedentes y eventualmente se pondrán en contacto contigo (si así procede) 
            para dar curso a las acciones correspondientes.
          </Text>
          <Text style={text}>
            Tu información será manejada bajo estricta confidencialidad. 
          </Text>
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

const informationTable = {
  margin: "20px 0",
  padding: "16px",
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
};

const informationTableRow = {
  margin: "0 0 8px 0",
  color: "#333",
  fontSize: "14px",
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
