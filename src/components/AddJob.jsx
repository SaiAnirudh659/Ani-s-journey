import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function AddJob() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [link, setLink] = useState("");

  const handleAddJob = async () => {
    if (!title || !company || !link) {
      alert("Fill all fields");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        title,
        company,
        link,
        createdAt: new Date()
      });

      alert("Job added successfully!");

      setTitle("");
      setCompany("");
      setLink("");
    } catch (error) {
      console.log(error);
      alert("Error adding job");
    }
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Add Job (Admin)</h2>

      <input
        placeholder="Job Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="phone-input"
      />

      <input
        placeholder="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="phone-input"
      />

      <input
        placeholder="Job Link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="phone-input"
      />

      <button onClick={handleAddJob} className="verify-btn">
        Add Job
      </button>
    </div>
  );
}

export default AddJob;