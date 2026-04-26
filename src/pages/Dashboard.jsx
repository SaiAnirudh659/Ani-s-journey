import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./Dashboard.css";

const ADMIN_EMAIL = "kasarlasai235@gmail.com";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [link, setLink] = useState("");

  const [applyJobsTarget, setApplyJobsTarget] = useState(5);
  const [applyRemoteJobsTarget, setApplyRemoteJobsTarget] = useState(2);

  const fetchJobs = async () => {
    const snapshot = await getDocs(collection(db, "jobs"));

    const jobsData = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    setJobs(jobsData);
  };

  const fetchApplications = async (userId) => {
    const q = query(collection(db, "applications"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const apps = {};
    snapshot.docs.forEach((docSnap) => {
      apps[docSnap.data().jobId] = docSnap.data().status;
    });

    setApplications(apps);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setIsAdmin(currentUser.email === ADMIN_EMAIL);

        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            uid: currentUser.uid,
            name: currentUser.displayName || "No Name",
            email: currentUser.email || "No Email",
            phone: currentUser.phoneNumber || "No Phone",
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );

        fetchJobs();
        fetchApplications(currentUser.uid);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addJob = async () => {
    if (!title || !company || !link) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "jobs"), {
      title,
      company,
      link,
      createdAt: serverTimestamp(),
    });

    alert("Job added!");
    setTitle("");
    setCompany("");
    setLink("");
    fetchJobs();
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
      fetchJobs();
    } catch (error) {
      console.log(error);
      alert("Error deleting job");
    }
  };

  const updateStatus = async (jobId, status) => {
    await setDoc(
      doc(db, "applications", `${user.uid}_${jobId}`),
      {
        userId: user.uid,
        userName: user.displayName || "No Name",
        userEmail: user.email || "No Email",
        userPhone: user.phoneNumber || "No Phone",
        jobId,
        status,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setApplications((prev) => ({
      ...prev,
      [jobId]: status,
    }));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
          <div style={{ fontSize: '16px', color: '#e2e8f0' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // If not authenticated after loading is complete, DON'T show message
  // Just redirect silently
  if (!user) {
    // Use setTimeout to allow React to render before redirecting
    setTimeout(() => navigate("/"), 0);
    return null;
  }

  return (
    <div className="dashboard-page">
      {/* Top Navigation */}
      <div className="dashboard-nav">
        <div className="nav-brand">
          <h1>🚀 Sai Anirudh Kasarla Journey</h1>
        </div>
        <div className="nav-actions">
          <div className="user-welcome">
            <span>Welcome back, {user.displayName?.split(' ')[0] || 'User'}!</span>
          </div>
          <div className="nav-buttons">
            {isAdmin && (
              <button className="nav-button" onClick={() => navigate("/admin")}>
                Admin Panel
              </button>
            )}
            <button className="logout-button" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="dashboard-main">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {Object.values(applications).filter(status => status === 'Applied').length}
                  </div>
                  <div className="stat-label">Jobs Applied</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {Object.values(applications).filter(status => status === 'Interview').length}
                  </div>
                  <div className="stat-label">Interviews</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">
                    {Object.values(applications).filter(status => status === 'Selected').length}
                  </div>
                  <div className="stat-label">Selected</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>🎯 Today's Mission</h3>
            <div className="mission-card">
              <ul className="mission-list">
                <li className="mission-item">
                  <span className="mission-icon">📝</span>
                  <div className="mission-dropdown-container">
                    <span>Apply to</span>
                    <select 
                      className="mission-dropdown"
                      value={applyJobsTarget}
                      onChange={(e) => setApplyJobsTarget(Number(e.target.value))}
                      disabled={!isAdmin}
                    >
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                      <option value={7}>7</option>
                    </select>
                    <span>jobs</span>
                  </div>
                </li>
                <li className="mission-item">
                  <span className="mission-icon">🏠</span>
                  <div className="mission-dropdown-container">
                    <span>Apply to</span>
                    <select 
                      className="mission-dropdown"
                      value={applyRemoteJobsTarget}
                      onChange={(e) => setApplyRemoteJobsTarget(Number(e.target.value))}
                      disabled={!isAdmin}
                    >
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                    <span>remote jobs</span>
                  </div>
                </li>
                <li className="mission-item">
                  <span className="mission-icon">📊</span>
                  Update application status
                </li>
              </ul>
            </div>
          </div>

          {isAdmin && (
            <div className="sidebar-section">
              <h3>⚙️ Admin Controls</h3>
              <div className="admin-form">
                <input
                  className="input-field"
                  placeholder="Job Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Company Name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Job Link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <button className="primary-button" onClick={addJob}>
                  ➕ Add Job
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          <div className="content-header">
            <h2>💼 Available Opportunities</h2>
            <div className="content-stats">
              <span>{jobs.length} jobs available</span>
            </div>
          </div>

          <div className="jobs-container">
            {jobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No jobs available right now</h3>
                <p>Check back later for new opportunities!</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {jobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-header">
                      <div className="job-company">
                        <span className="company-badge">{job.company}</span>
                      </div>
                      {isAdmin && (
                        <button className="delete-button" onClick={() => deleteJob(job.id)}>
                          🗑️
                        </button>
                      )}
                    </div>

                    <div className="job-content">
                      <h3 className="job-title">{job.title}</h3>
                      <div className="job-actions">
                        <a href={job.link} target="_blank" rel="noreferrer" className="apply-link">
                          Apply Now
                        </a>
                      </div>
                    </div>

                    <div className="job-status">
                      <div className="status-label">
                        Application Status: <span className="current-status">{applications[job.id] || 'Not Applied'}</span>
                      </div>
                      <div className="status-buttons">
                        {["Applied", "Not Applied", "Interview", "Rejected", "Selected"].map((status) => (
                          <button
                            key={status}
                            className={`status-button ${applications[job.id] === status ? 'active' : ''}`}
                            onClick={() => updateStatus(job.id, status)}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;