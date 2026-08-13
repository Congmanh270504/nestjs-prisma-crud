import { useEffect, useState } from "react";
import { listUsers, type FaceUser } from "../api/faceApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function UserList() {
  const [users, setUsers] = useState<FaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      setError("Không thể tải danh sách người dùng. Kiểm tra kết nối server.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[var(--text-primary)]">👥 Danh sách đã đăng ký</CardTitle>
            <CardDescription className="text-[var(--text-secondary)] mt-1">
              {loading ? "Đang tải..." : `${users.length} người trong hệ thống`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={fetchUsers}
            disabled={loading}
            size="sm"
          >
            🔄 Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">😶</div>
            <p className="text-[var(--text-secondary)]">Chưa có ai được đăng ký khuôn mặt</p>
            <p className="text-[var(--text-muted)] mt-1 text-sm">Bấm "Đăng ký mặt mới" ở góc trên bên phải</p>
          </div>
        )}

        {/* List */}
        {!loading && !error && users.length > 0 && (
          <div className="user-list">
            {users.map((user, idx) => (
              <div key={user.id} className="user-item">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h4 className="text-[var(--text-primary)]">{user.name}</h4>
                  <p className="text-[var(--text-muted)]">
                    Đăng ký: {new Date(user.created_at).toLocaleDateString("vi-VN", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Badge
                    variant="secondary"
                    className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs"
                  >
                    #{idx + 1}
                  </Badge>
                  <span className="text-xs text-[var(--text-muted)] hidden sm:block">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
