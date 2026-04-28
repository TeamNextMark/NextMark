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
    let isMounted = true;

    async function fetchSubmission() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found. Please log in again.");
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
        if (isMounted) setSubmission(data);
      } catch (err) {
        if (isMounted) setError(err?.message || "Something went wrong.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSubmission();
    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  function getStatusClass(status) { 
    const normalized = (status || "").toLowerCase();

    if (normalized === "graded") return "status-graded";
    if (normalized === "pending_review") return "status-pending";

    if (normalized === "completed") return "status-completed";
    if (normalized === "queued") return "status-queued";
    if (normalized === "running") return "status-running";
    if (normalized === "failed") return "status-failed";

    return "status-default";
  }

  if (loading) {
    return (
      <div className="submission-page">
        <div className="submission-shell">
          <div className="submission-card loading-card">
            <p>Loading submission...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submission-page">
        <div className="submission-shell">
          <div className="submission-card error-card">
            <h1>Unable to load submission</h1>
            <p>{error}</p>
            <div className="submission-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  navigate(`/student/course/${courseSlug}/assignment/${assignmentId}`)
                }
              >
                Back to Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="submission-page">
        <div className="submission-shell">
          <div className="submission-card error-card">
            <h1>Submission not found</h1>
            <p>We couldn’t find the submission details for this assignment.</p>
            <div className="submission-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  navigate(`/student/course/${courseSlug}/assignment/${assignmentId}`)
                }
              >
                Back to Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getDisplayStatus = (submission) => {
    if (submission.faculty_reviewed) return "graded";
    if (submission.grading_result || submission.ai_feedback) return "pending_review";
    if (submission.status === "running") return "running";
    return submission.status || "queued";
  };

  const displayStatus = getDisplayStatus(submission);

  <div className={`status-pill ${getStatusClass(displayStatus)}`}>
    {displayStatus === "graded"
      ? "Graded"
      : displayStatus === "pending_review"
      ? "Pending Faculty Review"
      : displayStatus}
  </div>

  return (
    <div className="submission-page">
      <div className="submission-shell">
        <div className="submission-card">
          <div className="submission-hero">
            <div className="success-icon">✓</div>

            <div className="submission-hero-text">
              <p className="eyebrow">Submission received</p>
              <h1>Assignment submitted successfully</h1>
              <p className="hero-subtext">
                {displayStatus === "graded"
                  ? "Your submission has been graded and reviewed by your instructor."
                  : displayStatus === "pending_review"
                  ? "Your submission has been processed and is awaiting instructor review."
                  : displayStatus === "running"
                  ? "Your submission is currently being processed."
                  : "Your work has been uploaded and queued for processing."}
              </p>
            </div>

            <div className={`status-pill ${getStatusClass(submission.status)}`}>
              {submission.status || "queued"}
            </div>
          </div>

          <div className="submission-grid">
            <div className="info-panel">
              <h2>Submission Details</h2>

              <div className="info-row">
                <span className="info-label">Submission ID</span>
                <span className="info-value">{submission.submission_id}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Assignment ID</span>
                <span className="info-value">{submission.assignment_id}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Submitted At</span>
                <span className="info-value">{formatDate(submission.submitted_at)}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Final Grade</span>
                <span className="info-value">
                  {submission.faculty_reviewed ? submission.score ?? "Pending" : "Waiting for faculty review"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Faculty Reviewed</span>
                <span className="info-value">
                  {submission.faculty_reviewed ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="info-panel">
              <h2>{submission.faculty_reviewed ? "Final Feedback" : "AI Feedback"}</h2>

              <div className="timeline">
                <div className="timeline-item active">
                  <div className="timeline-dot" />
                  <div>
                    <p className="timeline-title">AI / System Feedback</p>
                    <p className="timeline-text">
                      {submission.ai_feedback || "AI feedback is not available yet. Please check again after processing completes."}
                    </p>
                  </div>
                </div>

                {submission.faculty_reviewed ? (
                  <>
                    <div className="timeline-item active">
                      <div className="timeline-dot" />
                      <div>
                        <p className="timeline-title">Instructor Comments</p>
                        <p className="timeline-text">
                          {submission.instructor_comments || "No instructor comments were provided."}
                        </p>
                      </div>
                    </div>

                    {Array.isArray(submission.rubric_breakdown) && submission.rubric_breakdown.length > 0 && (
                      <div className="timeline-item active">
                        <div className="timeline-dot" />
                        <div>
                          <p className="timeline-title">Rubric Breakdown</p>
                          {submission.rubric_breakdown.map((item, index) => (
                            <p className="timeline-text" key={`${item?.criterion || "criterion"}-${index}`}>
                              {item?.criterion || `Criterion ${index + 1}`}: {item?.earned ?? "N/A"}/{item?.max ?? "N/A"} {item?.comment ? `- ${item.comment}` : ""}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="timeline-item">
                    <div className="timeline-dot" />
                    <div>
                      <p className="timeline-title">Grade pending faculty review</p>
                      <p className="timeline-text">
                        Your AI feedback is visible now. Your grade will appear only after faculty review is finalized.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="submission-actions">
            <button
              className="secondary-btn"
              onClick={() =>
                navigate(`/student/course/${courseSlug}/assignment/${assignmentId}`)
              }
            >
              Back to Assignment
            </button>

            <button
              className="primary-btn"
              onClick={() => navigate(`/student/course/${courseSlug}`)}
            >
              Go to Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentSubmissionPage;