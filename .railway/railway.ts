import { defineRailway, project, service } from "railway/iac";

// Last resort for a per-service CaC repo. Prefer one .railway file for the
// project and drop this if you later combine services into that file.
export const partial = "mindrep";

export default defineRailway(() => {
  const mindrep = service("mindrep", {
    start: "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips='*'",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    // builder from CaC: "RAILPACK"
  });
  return project("mindrep", {
    resources: [mindrep],
  });
});
