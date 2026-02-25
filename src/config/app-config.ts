import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Convivencia Escolar",
  version: packageJson.version,
  copyright: `© ${currentYear}, Convivencia Escolar.`,
  meta: {
    title: "Convivencia Escolar - Sistema de registro de convivencia Escolar DAEM La Union",
    description:
      "Convivencia Escolar es un sistema de registro de convivencia Escolar DAEM La Union",
  },
};
