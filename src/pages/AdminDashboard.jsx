import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const ADMIN_EMAIL = "kasarlasai235@gmail.com";

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobsMap = {};

      jobsSnapshot.docs.forEach((docSnap) => {
        jobsMap[docSnap.id] = docSnap.data();
      });

      setJobs(jobsMap);

      const appsSnapshot = await getDocs(collection(db, "applications"));

      const appsArray = appsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setApplications(appsArray);
    } catch (error) {
      console.log(error);
    }
  };

  if (authLoading) {
    return <div style={pageStyle}>Loading admin...</div>;
  }

  if (!user) {
    return <div style={pageStyle}>Please login first</div>;
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div style={pageStyle}>
        <h1>Access Denied ❌</h1>
        <p>You are not allowed to view this page.</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={navStyle}>
        <h1>Admin Dashboard 👑</h1>

        <button onClick={() => navigate("/dashboard")} style={backButtonStyle}>
          ← Back to Dashboard
        </button>
      </div>

      <p>Track all Ani's Journey job applications here.</p>

      <table style={{ width: "100%", marginTop: "30px", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#1e293b" }}>
            <th style={thStyle}>User</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Job Title</th>
            <th style={thStyle}>Company</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((app) => (
            <tr key={app.id} style={{ borderBottom: "1px solid #334155" }}>
              <td style={tdStyle}>{app.userName}</td>
              <td style={tdStyle}>{app.userEmail}</td>
              <td style={tdStyle}>{app.userPhone}</td>
              <td style={tdStyle}>{jobs[app.jobId]?.title || "Unknown Job"}</td>
              <td style={tdStyle}>{jobs[app.jobId]?.company || "Unknown Company"}</td>
              <td style={tdStyle}>{app.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "40px",
  background: "#0f172a",
  color: "white",
};

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const backButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
};

const thStyle = {
  padding: "12px",
  textAlign: "left",
};

const tdStyle = {
  padding: "12px",
};

export default AdminDashboard;