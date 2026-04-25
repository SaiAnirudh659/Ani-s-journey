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
    return <div style={pageStyle}>Please login first</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={navStyle}>
        <h1>Ani's Journey ☺️</h1>

        <div>
          {isAdmin && (
            <button onClick={() => navigate("/admin")} style={navButtonStyle}>
              Admin Dashboard
            </button>
          )}

          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>
      </div>

      <p><b>Name:</b> {user.displayName || "No Name"}</p>
      <p><b>Email:</b> {user.email || "No Email"}</p>
      <p><b>Phone:</b> {user.phoneNumber || "No Phone"}</p>

      <h2>Today's Mission</h2>
      <ul>
        <li>Apply 5 jobs</li>
        <li>Apply 2 remote jobs</li>
        <li>Update your job status</li>
      </ul>

      {isAdmin && (
        <>
          <h2>Add Job (Admin)</h2>

          <input
            placeholder="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Job Link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            style={inputStyle}
          />

          <button onClick={addJob} style={buttonStyle}>
            Add Job
          </button>
        </>
      )}

      <h2>Available Jobs</h2>

      {jobs.length === 0 ? (
        <p>No jobs available right now.</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} style={cardStyle}>
            <h3>{job.title}</h3>
            <p>{job.company}</p>

            <a href={job.link} target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>
              Apply Here
            </a>

            <div style={{ marginTop: "10px" }}>
              {["Applied", "Not Applied", "Interview", "Rejected", "Selected"].map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(job.id, status)}
                  style={{
                    marginRight: "5px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: applications[job.id] === status ? "#2563eb" : "#e5e7eb",
                    color: applications[job.id] === status ? "white" : "#111827",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <p><b>Status:</b> {applications[job.id] || "Not Applied"}</p>

            {isAdmin && (
              <button onClick={() => deleteJob(job.id)} style={deleteButtonStyle}>
                Delete Job
              </button>
            )}
          </div>
        ))
      )}
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
  marginBottom: "25px",
};

const navButtonStyle = {
  padding: "10px 14px",
  marginRight: "10px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
};

const logoutButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginBottom: "10px",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  marginBottom: "20px",
  cursor: "pointer",
};

const deleteButtonStyle = {
  marginTop: "10px",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
};

const cardStyle = {
  background: "#1e293b",
  padding: "15px",
  marginTop: "10px",
  borderRadius: "10px",
};

export default Dashboard;