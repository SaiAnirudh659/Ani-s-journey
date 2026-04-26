import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import "./AdminDashboard.css";

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

  const deleteJob = async (jobId) => {
    const confirmDelete = window.confirm(
      "Are you sure? This will delete the job and all user statuses for this job."
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "jobs", jobId));

      const q = query(collection(db, "applications"), where("jobId", "==", jobId));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "applications", docSnap.id))
      );

      await Promise.all(deletePromises);

      alert("Job and related statuses deleted!");
      fetchAdminData();
    } catch (error) {
      console.log(error);
      alert("Error deleting job");
    }
  };

  const deleteApplication = async (appId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "applications", appId));
      alert("Application deleted!");
      fetchAdminData();
    } catch (error) {
      console.log(error);
      alert("Error deleting application");
    }
  };

  if (authLoading) {
    return (
      <div className="admin-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>Loading admin...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>Please login first</div>
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="admin-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Access Denied ❌</h1>
          <p style={{ color: '#94a3b8' }}>You are not allowed to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* Top Navigation */}
      <div className="dashboard-nav">
        <div className="nav-brand">
          <h1>👑 Admin Dashboard</h1>
        </div>
        <div className="nav-actions">
          <div className="user-welcome">
            <span>Welcome back, Admin!</span>
          </div>
          <div className="nav-buttons">
            <button className="nav-button" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
            <button className="logout-button" onClick={() => navigate("/")}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{applications.length}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <div className="stat-number">{Object.keys(jobs).length}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-number">
                {applications.filter(app => app.status === 'Applied').length}
              </div>
              <div className="stat-label">Jobs Applied</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">
                {applications.filter(app => app.status === 'Selected').length}
              </div>
              <div className="stat-label">Selections</div>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="admin-section">
          <div className="section-header">
            <h2>📊 All Applications</h2>
            <div className="section-stats">
              <span>{applications.length} total applications</span>
            </div>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.userName}</td>
                    <td>{app.userEmail}</td>
                    <td>{app.userPhone}</td>
                    <td>{jobs[app.jobId]?.title || "Unknown Job"}</td>
                    <td>{jobs[app.jobId]?.company || "Unknown Company"}</td>
                    <td>
                      <span className={`status-badge status-${app.status.toLowerCase().replace(' ', '-')}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>{app.updatedAt?.toDate?.()?.toLocaleDateString() || "N/A"}</td>
                    <td>
                      <button
                        className="delete-app-button"
                        onClick={() => deleteApplication(app.id)}
                        title="Delete this application"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Jobs Management */}
        <div className="admin-section">
          <div className="section-header">
            <h2>⚙️ Jobs Management</h2>
            <div className="section-stats">
              <span>{Object.keys(jobs).length} active jobs</span>
            </div>
          </div>

          <div className="jobs-grid">
            {Object.entries(jobs).map(([jobId, job]) => (
              <div key={jobId} className="job-management-card">
                <div className="job-header">
                  <div className="job-info">
                    <h3>{job.title}</h3>
                    <p className="company-name">{job.company}</p>
                  </div>
                  <button
                    className="delete-job-button"
                    onClick={() => deleteJob(jobId)}
                    title="Delete this job"
                  >
                    🗑️
                  </button>
                </div>
                <div className="job-actions">
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noreferrer"
                    className="view-job-link"
                  >
                    🔗 View Job Posting
                  </a>
                </div>
                <div className="job-stats">
                  <span className="stat-item">
                    📝 {applications.filter(app => app.jobId === jobId).length} applications
                  </span>
                  <span className="stat-item">
                    🎯 {applications.filter(app => app.jobId === jobId && app.status === 'Applied').length} applied
                  </span>
                  <span className="stat-item">
                    ⏳ {applications.filter(app => app.jobId === jobId && app.status === 'Interview').length} interviews
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;