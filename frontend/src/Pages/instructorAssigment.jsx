import "../CSS/instructorAssignment.css";

function InstructorAssignment() {
  const submissions = [
    {
      id: 1,
      student: "student_2213_001",
      score: "0/100",
      time: "2025-11-14 18:45",
      status: "Compilation error",
      dotClass: "red",
      active: false,
    },
    {
      id: 2,
      student: "student_2213_002",
      score: "78/100",
      time: "2025-11-14 19:12",
      status: "Medium confidence",
      dotClass: "yellow",
      active: true,
    },
    {
      id: 3,
      student: "student_2213_003",
      score: "95/100",
      time: "2025-11-14 17:30",
      status: "",
      dotClass: "green",
      active: false,
    },
    {
      id: 4,
      student: "student_2213_004",
      score: "88/100",
      time: "2025-11-14 18:00",
      status: "",
      dotClass: "green",
      active: false,
    },
    {
      id: 5,
      student: "student_2213_005",
      score: "45/100",
      time: "2025-11-14 19:45",
      status: "Failed 7/10 tests",
      dotClass: "red",
      active: false,
    },
    {
      id: 6,
      student: "student_2213_006",
      score: "92/100",
      time: "2025-11-14 16:15",
      status: "",
      dotClass: "green",
      active: false,
    },
    {
      id: 7,
      student: "student_2213_007",
      score: "",
      time: "2025-11-14 20:01",
      status: "In queue",
      dotClass: "purple",
      active: false,
    },
  ];

  return (
    <div className="review-page">
      <div className="review-body">
        <aside className="review-sidebar">
          <h2 className="sidebar-title">Submission Queue</h2>

          <select className="sidebar-select">
            <option>All Submissions</option>
          </select>

          <select className="sidebar-select">
            <option>Sort by: Status</option>
          </select>

          <div className="progress-block">
            <div className="progress-row">
              <span>Progress:</span>
              <span>3/7 Reviewed</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
          </div>

          <div className="submission-list">
            {submissions.map((item) => (
              <div
                key={item.id}
                className={`submission-item ${item.active ? "active" : ""}`}
              >
                <div className="submission-top">
                  <div className="submission-left">
                    <span className={`status-dot ${item.dotClass}`} />
                    <span className="student-id">{item.student}</span>
                  </div>
                  <div className="submission-score">{item.score}</div>
                </div>

                <div className="submission-time">{item.time}</div>

                {item.status && (
                  <div
                    className={`submission-tag ${
                      item.dotClass === "red"
                        ? "tag-red"
                        : item.dotClass === "yellow"
                        ? "tag-yellow"
                        : item.dotClass === "purple"
                        ? "tag-gray"
                        : "tag-green"
                    }`}
                  >
                    {item.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="review-main">
          <section className="panel student-summary-panel">
            <div className="student-summary-left">
              <h1>Student: student_2213_002</h1>
              <p>Submitted: 2025-11-14 19:12</p>
            </div>

            <div className="student-summary-right">
              <div className="large-score">78/100</div>
              <div className="confidence-text">AI Confidence: 72%</div>
            </div>
          </section>

          <section className="panel code-panel">
            <div className="panel-header dark-header">
              <span>quicksort.cpp</span>
              <button className="small-dark-btn">Expand</button>
            </div>

            <div className="code-box">
              <pre>{`#include <iostream>
using namespace std;

void quicksort(int arr[], int low, int high) {
    if (low < high) {
        int pivot = arr[high];
        int i = low - 1;

        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                swap(arr[i], arr[j]);
            }
        }

        swap(arr[i + 1], arr[high]);
        int pi = i + 1;

        quicksort(arr, low, pi - 1);
        quicksort(arr, pi + 1, high);
    }
}`}</pre>
            </div>
          </section>

          <section className="panel test-results-panel">
            <div className="panel-header light-header">
              <span>Test Results</span>
              <span className="passed-count">8/10 Passed</span>
            </div>

            <div className="test-results-content">
              <div className="test-row success">
                <div className="test-icon">✓</div>
                <div className="test-info">
                  <div className="test-title">Negative numbers</div>
                  <div className="test-detail">Input: [-5, 3, -1, 0]</div>
                  <div className="test-detail">
                    Expected: [-5, -1, 0, 3] <span className="green-text">Got: [-5, -1, 0, 3]</span>
                  </div>
                </div>
              </div>

              <div className="test-row fail">
                <div className="test-icon">✕</div>
                <div className="test-info">
                  <div className="test-title">Large array (10000 elements)</div>
                  <div className="test-detail">Input: [random...]</div>
                  <div className="test-detail">
                    Expected: [sorted...] <span className="red-text">Got: Timeout</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="feedback-box">
            <div className="feedback-title"> AI Feedback (Confidence: 78%)</div>
            <p>
              The implementation demonstrates correct QuickSort logic with proper
              partitioning. However, the algorithm exhibits O(n²) worst-case
              performance on large arrays. Consider implementing median-of-three
              pivot selection or switching to a hybrid approach for better
              performance on edge cases. Code style and documentation are
              excellent.
            </p>
          </section>

          <section className="panel rubric-panel">
            <div className="panel-header light-header">
              <span>Rubric Breakdown</span>
            </div>

            <div className="table-wrap">
              <table className="rubric-table">
                <thead>
                  <tr>
                    <th>Criterion</th>
                    <th>Points Earned</th>
                    <th>Max Points</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Correctness</td>
                    <td>25</td>
                    <td>30</td>
                    <td>Failed tests 3 and 10 for large array inputs</td>
                  </tr>
                  <tr>
                    <td>Efficiency</td>
                    <td>15</td>
                    <td>25</td>
                    <td>Timeout on large arrays - O(n²) worst case instead of O(n log n)</td>
                  </tr>
                  <tr>
                    <td>Code Style</td>
                    <td>20</td>
                    <td>20</td>
                    <td>Excellent formatting and naming conventions</td>
                  </tr>
                  <tr>
                    <td>Documentation</td>
                    <td>15</td>
                    <td>15</td>
                    <td>Clear comments explaining algorithm</td>
                  </tr>
                  <tr>
                    <td>Edge Cases</td>
                    <td>8</td>
                    <td>10</td>
                    <td>Handles most edge cases but not optimized for large inputs</td>
                  </tr>
                  <tr className="total-row">
                    <td>TOTAL</td>
                    <td>83</td>
                    <td>100</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel manual-override-panel">
            <h3 className="manual-title">Manual Override</h3>

            <div className="radio-row">
              <label>
                <input type="radio" name="gradeOption" defaultChecked />
                <span>Accept AI Grade (83/100)</span>
              </label>

              <label>
                <input type="radio" name="gradeOption" />
                <span>Manual Grade:</span>
              </label>

              <input
                className="manual-grade-input"
                type="text"
                placeholder="0-100"
              />
              <span>/ 100</span>
            </div>

            <div className="comments-block">
              <label className="comments-label">Instructor Comments:</label>
              <textarea
                className="comments-textarea"
                placeholder="Add your comments for the student..."
              />
            </div>

            <div className="button-row">
              <button className="primary-btn">Finalize Grade</button>
              <button className="warning-btn">Flag for Review</button>
              <button className="secondary-btn">Next Submission →</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default InstructorAssignment;