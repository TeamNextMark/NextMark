import "../CSS/instructorAssignment.css";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function InstructorAssignment() {
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("accessToken");

        const [assignmentRes, submissionsRes] = await Promise.all([
          fetch(`${API_BASE}/assignments/${assignmentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/assignments/${assignmentId}/submissions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!assignmentRes.ok) throw new Error("Failed to load assignment");
        if (!submissionsRes.ok) throw new Error("Failed to load submissions");

        const assignmentData = await assignmentRes.json();
        const submissionsData = await submissionsRes.json();

        setAssignment(assignmentData);
        setSubmissions(submissionsData);
        setSelectedSubmission(submissionsData[0] || null);
      } catch (err) {
        setError(err.message || "Something went wrong");
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

        const response = await fetch(
          `${API_BASE}/submissions/${selectedSubmission.submission_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to load submission details");

        const data = await response.json();
        setSelectedSubmissionDetails(data);
      } catch (err) {
        setSelectedSubmissionDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    }

    fetchSelectedSubmissionDetails();
  }, [selectedSubmission]);

  function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function getStatusInfo(item) {
    if (!item) return { label: "Unknown", dotClass: "purple", tagClass: "tag-gray" };

    if (!item.score && !item.faculty_reviewed) {
      return { label: "In queue", dotClass: "purple", tagClass: "tag-gray" };
    }

    if (item.score != null && item.score < 60) {
      return { label: "Needs review", dotClass: "red", tagClass: "tag-red" };
    }

    if (item.score != null && item.score < 80) {
      return { label: "Medium confidence", dotClass: "yellow", tagClass: "tag-yellow" };
    }

    return { label: "Reviewed", dotClass: "green", tagClass: "tag-green" };
  }

  const reviewedCount = useMemo(
    () => submissions.filter((s) => s.faculty_reviewed).length,
    [submissions]
  );

  const progressPercent = submissions.length
    ? Math.round((reviewedCount / submissions.length) * 100)
    : 0;

  if (loading) return <div className="review-page"><div className="review-body"><p>Loading...</p></div></div>;
  if (error && !assignment) return <div className="review-page"><div className="review-body"><p>{error}</p></div></div>;
  if (!assignment) return <div className="review-page"><div className="review-body"><p>Assignment not found.</p></div></div>;

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
              <span>{reviewedCount}/{submissions.length} Reviewed</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
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
                      selectedSubmission?.submission_id === item.submission_id ? "active" : ""
                    }`}
                    onClick={() => setSelectedSubmission(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="submission-top">
                      <div className="submission-left">
                        <span className={`status-dot ${statusInfo.dotClass}`} />
                        <span className="student-id">{item.student_id}</span>
                      </div>
                      <div className="submission-score">
                        {item.score != null ? `${item.score}/${assignment.max_score ?? 100}` : "--"}
                      </div>
                    </div>

                    <div className="submission-time">{formatDate(item.submitted_at)}</div>

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
              <h1>{assignment.assignment_name}</h1>
              <p>
                {selectedSubmission
                  ? `Student: ${selectedSubmission.student_id} | Submitted: ${formatDate(selectedSubmission.submitted_at)}`
                  : "No submission selected"}
              </p>
            </div>

            <div className="student-summary-right">
              <div className="large-score">
                {selectedSubmission?.score != null
                  ? `${selectedSubmission.score}/${assignment.max_score ?? 100}`
                  : "--"}
              </div>
              <div className="confidence-text">
                Faculty Reviewed: {selectedSubmission?.faculty_reviewed ? "Yes" : "No"}
              </div>
            </div>
          </section>

          <section className="panel code-panel">
            <div className="panel-header dark-header">
              <span>Submission Output</span>
              <button className="small-dark-btn" type="button">Expand</button>
            </div>

            <div className="code-box">
              <pre>
{detailsLoading
  ? "Loading submission details..."
  : selectedSubmissionDetails?.stdout ||
    selectedSubmissionDetails?.stderr ||
    "No code/output preview available yet."}
              </pre>
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
                    {selectedSubmissionDetails?.timed_out ? "Yes" : "No"}
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
            <div className="feedback-title">AI / System Feedback</div>
            <p>
              {selectedSubmissionDetails?.status === "completed"
                ? "This submission has completed execution. Review output, score, and any errors before finalizing."
                : "This submission is still queued or has limited execution details available."}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default InstructorAssignment;