import { Navigate, Route, Routes } from "react-router";
import { BoardPage } from "./board/BoardPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/todo" replace />} />
      <Route path="/todo" element={<BoardPage />} />
      <Route path="/todo/:project" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/todo" replace />} />
    </Routes>
  );
}
