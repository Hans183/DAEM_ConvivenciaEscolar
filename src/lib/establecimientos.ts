export async function getEstablecimientos() {
  const res = await fetch(
    "https://apiconvivencia.daemlu.cl/_/#/collections?collection=pbc_2991098212&filter=&sort=-%40rowid",
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Error al obtener establecimientos");
  }

  const data = await res.json();
  return data.items;
}
