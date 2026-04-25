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
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [link, setLink] = useState("");

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

  if (!user) {
    return <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Please login first</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-nav">
        <div className="nav-brand">
          <h1>Sai Anirudh Kasarla Journey ☺️</h1>
        </div>

        <div className="nav-buttons">
          {isAdmin && (
            <button className="nav-button" onClick={() => navigate("/admin")}>
              Admin Dashboard
            </button>
          )}

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="content-container">
        <div className="user-info">
          <h2>Welcome back!</h2>
          <div className="user-details">
            <p><strong>Name:</strong> {user.displayName || "No Name"}</p>
            <p><strong>Email:</strong> {user.email || "No Email"}</p>
            <p><strong>Phone:</strong> {user.phoneNumber || "No Phone"}</p>
          </div>
        </div>

        <div className="mission-section">
          <h2>Today's Mission</h2>
          <ul className="mission-list">
            <li>Apply to 5 jobs</li>
            <li>Apply to 2 remote jobs</li>
            <li>Update your job application status</li>
          </ul>
        </div>

        {isAdmin && (
          <div className="admin-section">
            <h2>Add New Job (Admin)</h2>
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
                Add Job
              </button>
            </div>
          </div>
        )}

        <div className="jobs-section">
          <h2>Available Jobs</h2>

          {jobs.length === 0 ? (
            <div className="empty-state">
              <p>No jobs available right now. Check back later!</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="card-header">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="company-name">{job.company}</p>
                  </div>

                  <div className="card-actions">
                    <a href={job.link} target="_blank" rel="noreferrer" className="apply-link">
                      Apply Here →
                    </a>
                  </div>

                  <div className="status-section">
                    <p className="status-label">Application Status:</p>
                    <div className="status-buttons">
                      {["Applied", "Not Applied", "Interview", "Rejected", "Selected"].map((status) => (
                        <button
                          key={status}
                          className="status-button"
                          onClick={() => updateStatus(job.id, status)}
                          style={{
                            background: applications[job.id] === status ? "#2563eb" : "#374151",
                            color: applications[job.id] === status ? "white" : "#d1d5db",
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isAdmin && (
                    <button className="delete-button" onClick={() => deleteJob(job.id)}>
                      Delete Job
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;