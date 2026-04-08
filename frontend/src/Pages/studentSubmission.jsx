import "../CSS/Template.css";
import "../CSS/Submission.css";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function StudentSubmission() {
  const navigate = useNavigate();
  const { courseSlug, assignmentId } = useParams();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null);

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setSuccessMessage("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");
      setSubmissionResult(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      if (selectedFiles.length === 0) {
        throw new Error("Please select at least one file before submitting.");
      }

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_BASE}/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let message = "Submission failed.";
        try {
          const err = await response.json();
          message = err?.detail || err?.message || message;
        } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      setSubmissionResult(data);
      setSuccessMessage("Assignment submitted successfully.");
      setSelectedFiles([]);
    } catch (err) {
      setError(err?.message || "Something went wrong while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mainContent">
      <div className="submissionPage">
        <h1 className="pageTitle">Submit Assignment</h1>

        <button
          className="backButton"
          type="button"
          onClick={() => navigate(`/student/course/${courseSlug}/assignment/${assignmentId}`)}
        >
          ← Back to Assignment
        </button>

        <form className="submissionCard" onSubmit={handleSubmit}>
          <label className="fileLabel">Choose file(s)</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={submitting}
          />

          <div className="selectedFiles">
            {selectedFiles.length > 0 ? (
              selectedFiles.map((file, index) => (
                <p key={index}>{file.name}</p>
              ))
            ) : (
              <p>No files selected yet.</p>
            )}
          </div>

          <button className="submitButton" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Assignment"}
          </button>
        </form>

        {successMessage && (
          <div className="successBox">
            <p>{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="errorBox">
            <p>{error}</p>
          </div>
        )}

        {submissionResult && (
          <div className="resultCard">
            <h2>Submission Result</h2>
            <p>
              <strong>Status:</strong>{" "}
              {submissionResult.status || "Submitted"}
            </p>
            <p>
              <strong>Submission ID:</strong>{" "}
              {submissionResult.submission_id || "N/A"}
            </p>
            <p>
              <strong>Submitted At:</strong>{" "}
              {submissionResult.submitted_at || "N/A"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentSubmission;