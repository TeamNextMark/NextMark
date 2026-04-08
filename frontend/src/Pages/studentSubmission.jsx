import "../CSS/Template.css";
import "../CSS/Submission.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function StudentSubmissionPage() {
  const navigate = useNavigate();
  const { courseSlug, assignmentId, submissionId } = useParams();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSubmission() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }

        if (!submissionId) {
          throw new Error("Missing submission ID.");
        }

        const response = await fetch(`${API_BASE}/submissions/${submissionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let message = "Failed to load submission.";
          try {
            const err = await response.json();
            message = err?.detail || err?.message || message;
          } catch {}
          throw new Error(message);
        }

        const data = await response.json();
        setSubmission(data);
      } catch (err) {
        setError(err?.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmission();
  }, [submissionId]);

  function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  if (loading) {
    return (
      <div className="mainContent">
        <p>Loading submission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mainContent">
        <p>{error}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="mainContent">
        <p>Submission not found.</p>
      </div>
    );
  }

  return (
    <div className="mainContent">
      <div className="submissionPage">
        <h1>Submission Confirmation</h1>

        <p><strong>Submission ID:</strong> {submission.submission_id}</p>
        <p><strong>Assignment ID:</strong> {submission.assignment_id}</p>
        <p><strong>Status:</strong> {submission.status || "queued"}</p>
        <p><strong>Submitted:</strong> {formatDate(submission.submitted_at)}</p>
        <p><strong>Score:</strong> {submission.score ?? "Pending"}</p>
        <p><strong>Faculty Reviewed:</strong> {submission.faculty_reviewed ? "Yes" : "No"}</p>

        <div style={{ marginTop: "20px" }}>
          <button onClick={() => navigate(`/student/course/${courseSlug}/assignment/${assignmentId}`)}>
            Back to Assignment
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentSubmissionPage;