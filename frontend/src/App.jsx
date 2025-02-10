import "./App.css";
import "./utils/socket.js";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/home.jsx";
import CollabSpace from "./pages/collabSpace.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomCode" element={<CollabSpace />} />
      </Routes>
    </Router>
  );
}

export default App;
