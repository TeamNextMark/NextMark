import "../CSS/studentAssignment.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function StudentAssignment() {
  const { assignmentId, courseSlug } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("accessToken");

        const [assignmentRes, mySubsRes] = await Promise.all([
          fetch(`${API_BASE}/assignments/${assignmentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/assignments/${assignmentId}/my-submissions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!assignmentRes.ok) throw new Error("Failed to load assignment");
        if (!mySubsRes.ok) throw new Error("Failed to load your submissions");

        const assignmentData = await assignmentRes.json();
        const mySubsData = await mySubsRes.json();

        setAssignment(assignmentData);
        setMySubmissions(mySubsData);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [assignmentId]);

  const latestSubmission = useMemo(() => {
    if (!mySubmissions.length) return null;
    return mySubmissions[0];
  }, [mySubmissions]);

  function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function getAcceptedTypes(language) {
    const lang = (language || "").toLowerCase();
    if (lang.includes("python")) return ".py";
    if (lang.includes("java")) return ".java";
    if (lang.includes("c++") || lang.includes("cpp")) return ".cpp,.h,.hpp";
    if (lang === "c") return ".c,.h";
    if (lang.includes("javascript")) return ".js";
    return "";
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  }

  async function handleSubmit() {
    if (!selectedFiles.length) {
      setError("Please select at least one file before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("accessToken");

      const formData = new FormData();
      formData.append("assignment_id", assignmentId);
      selectedFiles.forEach((file) => formData.append("files", file));

      const response = await fetch(`${API_BASE}/submissions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Submission failed");
      }

      const created = await response.json();

      // refresh submissions
      const refreshed = await fetch(
        `${API_BASE}/assignments/${assignmentId}/my-submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (refreshed.ok) {
        const refreshedData = await refreshed.json();
        setMySubmissions(refreshedData);
      }

      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // navigate to confirmation page
      navigate(
        `/student/course/${courseSlug}/assignment/${assignmentId}/submission/${created.submission_id}`,
        { replace: true }
      );

    } catch (err) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="assignment-page"><main className="page-content"><p>Loading assignment...</p></main></div>;
  if (error && !assignment) return <div className="assignment-page"><main className="page-content"><p>{error}</p></main></div>;
  if (!assignment) return <div className="assignment-page"><main className="page-content"><p>Assignment not found.</p></main></div>;

  return (
    <div className="assignment-page">
      <main className="page-content">
        <section className="card assignment-card">
          <div className="assignment-header">
            <div className="assignment-header-left">
              <h1>{assignment.assignment_name}</h1>

              <div className="assignment-meta">
                <span className="due-label">Due:</span>
                <span className="due-date">{formatDate(assignment.due_date)}</span>
                <span className="meta-divider">|</span>
                <span>Language: {assignment.code_language}</span>
                <span className="meta-divider">|</span>
                <span>Max Files: {assignment.max_files}</span>
              </div>
            </div>

            <div className="points-box">
              <div className="points-number">{assignment.max_score ?? "-"}</div>
              <div className="points-text">points</div>
            </div>
          </div>

          <div className="description-box">
            <h3>Assignment Description:</h3>
            <p>{assignment.assignment_description || "No description available."}</p>

            <hr />

            <p className="required-files-title">Accepted Files:</p>
            <p className="required-files-text">
              {getAcceptedTypes(assignment.code_language) || "See assignment instructions"}
            </p>
          </div>
        </section>

        <section className="card upload-card">
          <h2>Upload Your Solution</h2>

          <div
            className="upload-box"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: "pointer" }}
          >
            <div className="upload-icon">⇪</div>
            <p className="upload-main-text">
              <span className="browse-text">Click to browse</span> or drag and drop your files here
            </p>
            <p className="upload-subtext">
              Accepted file types: {getAcceptedTypes(assignment.code_language) || "See assignment details"}
            </p>
            <p className="upload-subtext">
              Maximum files allowed: {assignment.max_files}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept={getAcceptedTypes(assignment.code_language)}
              onChange={handleFileChange}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ marginBottom: "10px" }}>Selected Files</h3>
              <ul>
                {selectedFiles.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="notice-box">
          <div className="notice-title">Important Notice:</div>
          <div className="notice-text">
            You cannot modify your submission after clicking Submit. Please ensure all files are correct before submitting.
          </div>
        </section>

        {latestSubmission && (
          <section className="card">
            <h2 style={{ marginBottom: "12px" }}>Latest Submission</h2>
            <p><strong>Submitted:</strong> {formatDate(latestSubmission.submitted_at)}</p>
            <p><strong>Status:</strong> {latestSubmission.status || "queued"}</p>
            <p><strong>Score:</strong> {latestSubmission.score ?? "Pending"}</p>
            <p><strong>Faculty Reviewed:</strong> {latestSubmission.faculty_reviewed ? "Yes" : "No"}</p>
          </section>
        )}

        {error && (
          <section className="notice-box" style={{ marginTop: "16px" }}>
            <div className="notice-title">Error</div>
            <div className="notice-text">{error}</div>
          </section>
        )}

        <div className="action-row">
          <button className="cancel-btn" onClick={() => navigate(`/student/course/${courseSlug}`)}>
            Cancel
          </button>
          <button
            className="submit-btn"
            disabled={!selectedFiles.length || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit Assignment"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default StudentAssignment;