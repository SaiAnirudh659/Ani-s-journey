import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

function JobList() {
  const [jobs, setJobs] = useState([]);
  const [statusMap, setStatusMap] = useState({});

  const user = auth.currentUser;

  const fetchJobsAndStatuses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));

      const jobsArray = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setJobs(jobsArray);

      if (user) {
        const savedStatuses = {};

        for (const job of jobsArray) {
          const applicationId = `${user.uid}_${job.id}`;
          const applicationRef = doc(db, "applications", applicationId);
          const applicationSnap = await getDoc(applicationRef);

          if (applicationSnap.exists()) {
            savedStatuses[job.id] = applicationSnap.data().status;
          }
        }

        setStatusMap(savedStatuses);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchJobsAndStatuses();
  }, []);

  const updateStatus = async (jobId, status) => {
    try {
      if (!user) {
        alert("Please login first");
        return;
      }

      const userId = user.uid;

      await setDoc(doc(db, "applications", `${userId}_${jobId}`), {
        userId,
        userName: user.displayName || "No Name",
        userEmail: user.email || "No Email",
        userPhone: user.phoneNumber || "No Phone",
        jobId,
        status,
        updatedAt: new Date(),
      });

      setStatusMap((prev) => ({
        ...prev,
        [jobId]: status,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Available Jobs</h2>

      {jobs.length === 0 ? (
        <p>No jobs available</p>
      ) : (
        jobs.map((job) => (
          <div
            key={job.id}
            style={{
              background: "#1e293b",
              padding: "15px",
              borderRadius: "12px",
              marginTop: "15px",
            }}
          >
            <h3>{job.title}</h3>
            <p>{job.company}</p>

            <a
              href={job.link}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#3b82f6" }}
            >
              Apply Here
            </a>

            <div style={{ marginTop: "12px" }}>
              <button onClick={() => updateStatus(job.id, "Applied")}>
                Applied
              </button>

              <button onClick={() => updateStatus(job.id, "Not Applied")}>
                Not Applied
              </button>

              <button onClick={() => updateStatus(job.id, "Interview")}>
                Interview
              </button>

              <button onClick={() => updateStatus(job.id, "Rejected")}>
                Rejected
              </button>

              <button onClick={() => updateStatus(job.id, "Selected")}>
                Selected
              </button>

              <p style={{ marginTop: "10px", fontWeight: "bold" }}>
                Status: {statusMap[job.id] || "None"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default JobList;