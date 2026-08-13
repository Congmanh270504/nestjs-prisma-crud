import { useState } from "react";
import WebcamScanner from "./components/WebcamScanner";
import RegisterFaceModal from "./components/RegisterFaceModal";
import UserList from "./components/UserList";
import "./index.css";

type Tab = "identify" | "users";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("identify");
  const [showRegister, setShowRegister] = useState(false);
  const [userListKey, setUserListKey] = useState(0);

  const handleRegisterSuccess = (name: string) => {
    setShowRegister(false);
    setUserListKey((k) => k + 1);
    alert(`✅ Đã đăng ký khuôn mặt thành công cho "${name}"!`);
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">🧠</div>
          <span>FaceRecog AI</span>
        </div>
        <div className="nav-tabs">
          {(["identify", "users"] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "identify" ? "🔍 Nhận diện" : "👥 Người dùng"}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowRegister(true)}
          style={{ padding: "8px 16px", fontSize: 13 }}
        >
          ➕ Đăng ký mặt
        </button>
      </nav>

      {/* Content */}
      <main className="main-content">
        {activeTab === "identify" && (
          <div>
            <div className="section-header" style={{ marginBottom: 28 }}>
              <h1 className="section-title">Nhận diện khuôn mặt</h1>
            </div>
            <WebcamScanner onRegisterClick={() => setShowRegister(true)} />
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="section-header" style={{ marginBottom: 28 }}>
              <h1 className="section-title">Danh sách người dùng</h1>
              <button
                className="btn btn-primary"
                onClick={() => setShowRegister(true)}
              >
                ➕ Đăng ký mặt mới
              </button>
            </div>
            <UserList key={userListKey} />
          </div>
        )}
      </main>

      {/* Register Modal */}
      {showRegister && (
        <RegisterFaceModal
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  );
}
