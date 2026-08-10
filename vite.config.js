import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 로 배포할 때는 .env 에 VITE_BASE=/저장소이름/ 을 넣으세요.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.VITE_BASE || "/",
    plugins: [react()],
    server: { port: 5173, host: true },
  };
});
