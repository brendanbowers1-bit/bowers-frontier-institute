import { MotionConfig } from "framer-motion";
import { Br3nDashboard } from "./components/Br3nDashboard";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Br3nDashboard />
    </MotionConfig>
  );
}
