import "../CSS/facultyAssignment.css";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function FacultyAssignment() {
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const [acceptAiGrade, setAcceptAiGrade] = useState(true);
  const [manualScore, setManualScore] = useState("");
  const [facultyComments, setFacultyComments] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }

        const [assignmentRes, submissionsRes] = await Promise.all([
          fetch(`${API_BASE}/assignments/${assignmentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/assignments/${assignmentId}/submissions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!assignmentRes.ok) {
          let message = "Failed to load assignment";
          try {
            const err = await assignmentRes.json();
            message = err?.detail || err?.message || message;
          } catch {}
          throw new Error(message);
        }

        if (!submissionsRes.ok) {
          let message = "Failed to load submissions";
          try {
            const err = await submissionsRes.json();
            message = err?.detail || err?.message || message;
          } catch {}
          throw new Error(message);
        }

        const assignmentData = await assignmentRes.json();
        const submissionsData = await submissionsRes.json();

        const safeSubmissions = Array.isArray(submissionsData) ? submissionsData : [];

        setAssignment(assignmentData);
        setSubmissions(safeSubmissions);
        setSelectedSubmission(safeSubmissions[0] || null);
      } catch (err) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [assignmentId]);

  useEffect(() => {
    async function fetchSelectedSubmissionDetails() {
      if (!selectedSubmission?.submission_id) {
        setSelectedSubmissionDetails(null);
        return;
      }

      try {
        setDetailsLoading(true);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found.");
        }

        const response = await fetch(
          `${API_BASE}/submissions/${selectedSubmission.submission_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          let message = "Failed to load submission details";
          try {
            const err = await response.json();
            message = err?.detail || err?.message || message;
          } catch {}
          throw new Error(message);
        }

        const data = await response.json();
        setSelectedSubmissionDetails(data);
      } catch (err) {
        console.error(err);
        setSelectedSubmissionDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    }

    fetchSelectedSubmissionDetails();
  }, [selectedSubmission]);

  useEffect(() => {
    if (!selectedSubmissionDetails) return;

    setAcceptAiGrade(
      selectedSubmissionDetails?.accepted_ai_grade ?? true
    );

    setManualScore(
      selectedSubmissionDetails?.score != null
        ? String(selectedSubmissionDetails.score)
        : ""
    );

    setFacultyComments(
      selectedSubmissionDetails?.faculty_comments || ""
    );
  }, [selectedSubmissionDetails]);

  async function finalizeGrade() {
    if (!selectedSubmission?.submission_id) return;

    try {
      setSavingGrade(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found.");
      }

      const response = await fetch(
        `${API_BASE}/submissions/${selectedSubmission.submission_id}/grade`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accept_ai_grade: acceptAiGrade,
            manual_score: acceptAiGrade ? null : Number(manualScore),
            faculty_comments: facultyComments,
          }),
        }
      );

      if (!response.ok) {
        let message = "Failed to finalize grade";
        try {
          const err = await response.json();
          message = err?.detail || err?.message || message;
        } catch {}
        throw new Error(message);
      }

      const refreshed = await fetch(
        `${API_BASE}/submissions/${selectedSubmission.submission_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!refreshed.ok) {
        throw new Error("Failed to refresh submission details");
      }

      const refreshedData = await refreshed.json();
      setSelectedSubmissionDetails(refreshedData);

      setSubmissions((prev) =>
        prev.map((item) =>
          item.submission_id === selectedSubmission.submission_id
            ? {
                ...item,
                score: refreshedData.score,
                faculty_reviewed: refreshedData.faculty_reviewed,
              }
            : item
        )
      );
    } catch (err) {
      alert(err?.message || "Could not save grade");
    } finally {
      setSavingGrade(false);
    }
  }

  function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  function getStatusInfo(item) {
  if (!item) {
    return { label: "Unknown", dotClass: "purple", tagClass: "tag-gray" };
  }

  if (item.faculty_reviewed) {
    return { label: "Reviewed", dotClass: "green", tagClass: "tag-green" };
  }

  if (item.score == null) {
    return { label: "In queue", dotClass: "purple", tagClass: "tag-gray" };
  }

  if (item.score < 60) {
    return { label: "Needs review", dotClass: "red", tagClass: "tag-red" };
  }

  return { label: "Pending faculty review", dotClass: "yellow", tagClass: "tag-yellow" };
}

  const reviewedCount = useMemo(
    () => submissions.filter((s) => s.faculty_reviewed).length,
    [submissions]
  );

  const progressPercent = submissions.length
    ? Math.round((reviewedCount / submissions.length) * 100)
    : 0;

  const assignmentTitle =
    assignment?.assignment_name ||
    assignment?.title ||
    assignment?.name ||
    "Untitled Assignment";

  const assignmentMaxScore = assignment?.max_score ?? 100;

  const selectedScore =
    selectedSubmissionDetails?.score ?? selectedSubmission?.score ?? null;

  const selectedReviewed =
    selectedSubmissionDetails?.faculty_reviewed ?? selectedSubmission?.faculty_reviewed ?? false;

  const codeOrOutput = detailsLoading
    ? "Loading submission details..."
    : selectedSubmissionDetails?.code_preview ||
      selectedSubmissionDetails?.stdout ||
      selectedSubmissionDetails?.stderr ||
      selectedSubmissionDetails?.output ||
      "No code/output preview available yet.";

  const previewLabel =
    selectedSubmissionDetails?.code_filename ||
    (selectedSubmissionDetails?.code_preview ? "Submitted Code" : "Submission Output");

  const aiConfidencePercent =
    selectedSubmissionDetails?.ai_confidence != null
      ? Math.round(selectedSubmissionDetails.ai_confidence * 100)
      : null;

  const aiRecommendedScore =
    selectedSubmissionDetails?.ai_recommended_score ??
    selectedSubmissionDetails?.score ??
    0;

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-body">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="review-page">
        <div className="review-body">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="review-page">
        <div className="review-body">
          <p>Assignment not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-body">
        <aside className="review-sidebar">
          <h2 className="sidebar-title">Submission Queue</h2>

          <select className="sidebar-select" defaultValue="all">
            <option value="all">All Submissions</option>
          </select>

          <select className="sidebar-select" defaultValue="status">
            <option value="status">Sort by: Status</option>
          </select>

          <div className="progress-block">
            <div className="progress-row">
              <span>Progress:</span>
              <span>
                {reviewedCount}/{submissions.length} Reviewed
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="submission-list">
            {submissions.length > 0 ? (
              submissions.map((item) => {
                const statusInfo = getStatusInfo(item);

                return (
                  <div
                    key={item.submission_id}
                    className={`submission-item ${
                      selectedSubmission?.submission_id === item.submission_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setSelectedSubmission(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="submission-top">
                      <div className="submission-left">
                        <span className={`status-dot ${statusInfo.dotClass}`} />
                        <span className="student-id">
                          {item.student_id ||
                            item.student_email ||
                            item.user_id ||
                            "Unknown Student"}
                        </span>
                      </div>
                      <div className="submission-score">
                        {item.score != null
                          ? `${item.score}/${assignmentMaxScore}`
                          : "--"}
                      </div>
                    </div>

                    <div className="submission-time">
                      {formatDate(item.submitted_at)}
                    </div>

                    <div className={`submission-tag ${statusInfo.tagClass}`}>
                      {statusInfo.label}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No submissions yet.</p>
            )}
          </div>
        </aside>

        <main className="review-main">
          <section className="panel student-summary-panel">
            <div className="student-summary-left">
              <h1>{assignmentTitle}</h1>
              <p>
                {selectedSubmission
                  ? `Student: ${
                      selectedSubmission.student_id ||
                      selectedSubmission.student_email ||
                      selectedSubmission.user_id ||
                      "Unknown"
                    } | Submitted: ${formatDate(selectedSubmission.submitted_at)}`
                  : "No submission selected"}
              </p>
            </div>

            <div className="student-summary-right">
              <div className="large-score">
                {selectedScore != null
                  ? `${selectedScore}/${assignmentMaxScore}`
                  : "--"}
              </div>
              <div className="confidence-text">
                Faculty Reviewed: {selectedReviewed ? "Yes" : "No"}
              </div>
              {aiConfidencePercent != null && (
                <div className="confidence-text">
                  AI Confidence: {aiConfidencePercent}%
                </div>
              )}
            </div>
          </section>

          <section className="panel code-panel">
            <div className="panel-header dark-header">
              <span>{previewLabel}</span>
              <button className="small-dark-btn" type="button">
                Expand
              </button>
            </div>

            <div className="code-box">
              <pre>{codeOrOutput}</pre>
            </div>
          </section>

          <section className="panel test-results-panel">
            <div className="panel-header light-header">
              <span>Execution Results</span>
              <span className="passed-count">
                {selectedSubmissionDetails?.status || "Pending"}
              </span>
            </div>

            <div className="test-results-content">
              <div className="test-row">
                <div className="test-icon">•</div>
                <div className="test-info">
                  <div className="test-title">Exit Code</div>
                  <div className="test-detail">
                    {selectedSubmissionDetails?.exit_code ?? "N/A"}
                  </div>
                </div>
              </div>

              <div className="test-row">
                <div className="test-icon">•</div>
                <div className="test-info">
                  <div className="test-title">Timed Out</div>
                  <div className="test-detail">
                    {selectedSubmissionDetails?.timed_out == null
                      ? "N/A"
                      : selectedSubmissionDetails.timed_out
                      ? "Yes"
                      : "No"}
                  </div>
                </div>
              </div>

              <div className="test-row">
                <div className="test-icon">•</div>
                <div className="test-info">
                  <div className="test-title">Duration</div>
                  <div className="test-detail">
                    {selectedSubmissionDetails?.duration_ms != null
                      ? `${selectedSubmissionDetails.duration_ms} ms`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {Array.isArray(selectedSubmissionDetails?.test_results) &&
                selectedSubmissionDetails.test_results.map((test, index) => (
                  <div
                    key={`${test?.name || "test"}-${index}`}
                    className={`test-row ${test?.passed ? "" : "fail"}`}
                  >
                    <div className="test-icon">{test?.passed ? "✓" : "✕"}</div>
                    <div className="test-info">
                      <div className="test-title">{test?.name || `Test ${index + 1}`}</div>
                      <div className="test-detail">
                        Expected: {test?.expected ?? "N/A"}
                      </div>
                      <div className="test-detail">
                        Got: {test?.got ?? "N/A"}
                      </div>
                    </div>
                  </div>
                ))}

              {selectedSubmissionDetails?.stderr && (
                <div className="test-row fail">
                  <div className="test-icon">✕</div>
                  <div className="test-info">
                    <div className="test-title">stderr</div>
                    <div className="test-detail">{selectedSubmissionDetails.stderr}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="feedback-box">
            <div className="feedback-title">
              AI / System Feedback
              {aiConfidencePercent != null ? ` (${aiConfidencePercent}% confidence)` : ""}
            </div>

            <p>
              {selectedSubmissionDetails?.ai_feedback ||
                (selectedSubmissionDetails?.status === "completed"
                  ? "This submission has completed execution. Review output, score, and any errors before finalizing."
                  : "This submission is still queued or has limited execution details available.")}
            </p>

            {selectedSubmissionDetails?.faculty_comments && (
              <div style={{ marginTop: "16px" }}>
                <strong>Instructor Comments:</strong>
                <p style={{ marginTop: "6px" }}>
                  {selectedSubmissionDetails.faculty_comments}
                </p>
              </div>
            )}

            {Array.isArray(selectedSubmissionDetails?.rubric_breakdown) &&
              selectedSubmissionDetails.rubric_breakdown.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px" }}>Criterion</th>
                        <th style={{ textAlign: "left", padding: "8px" }}>Earned</th>
                        <th style={{ textAlign: "left", padding: "8px" }}>Max</th>
                        <th style={{ textAlign: "left", padding: "8px" }}>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubmissionDetails.rubric_breakdown.map((item, index) => (
                        <tr key={`${item?.criterion || "criterion"}-${index}`}>
                          <td style={{ padding: "8px" }}>{item?.criterion ?? "N/A"}</td>
                          <td style={{ padding: "8px" }}>{item?.earned ?? "N/A"}</td>
                          <td style={{ padding: "8px" }}>{item?.max ?? "N/A"}</td>
                          <td style={{ padding: "8px" }}>{item?.comment ?? "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>

          <section className="panel" style={{ marginTop: "20px" }}>
            <div className="panel-header light-header">
              <span>Instructor Review</span>
            </div>

            <div style={{ padding: "16px" }}>
              <div style={{ marginBottom: "16px", fontWeight: 600 }}>
                Final Score Decision
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label>
                  <input
                    type="radio"
                    name="gradeOption"
                    checked={acceptAiGrade}
                    onChange={() => setAcceptAiGrade(true)}
                  />
                  {" "}
                  Accept AI Grade ({aiRecommendedScore}/{assignmentMaxScore})
                </label>

                <label>
                  <input
                    type="radio"
                    name="gradeOption"
                    checked={!acceptAiGrade}
                    onChange={() => setAcceptAiGrade(false)}
                  />
                  {" "}
                  Manual Grade
                </label>
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Manual Score
                </label>
                <input
                  type="number"
                  min="0"
                  max={assignmentMaxScore}
                  step="0.01"
                  disabled={acceptAiGrade}
                  value={manualScore}
                  onChange={(e) => setManualScore(e.target.value)}
                  style={{
                    width: "120px",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
                <span style={{ marginLeft: "8px" }}>/ {assignmentMaxScore}</span>
              </div>

              <div style={{ marginTop: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Instructor Comments
                </label>
                <textarea
                  value={facultyComments}
                  onChange={(e) => setFacultyComments(e.target.value)}
                  placeholder="Add comments for the student..."
                  style={{
                    width: "100%",
                    minHeight: "110px",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #ccc",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={finalizeGrade}
                  disabled={savingGrade}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {savingGrade ? "Saving..." : "Finalize Grade"}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default FacultyAssignment;