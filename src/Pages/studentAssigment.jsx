import "../CSS/studentAssignment.css";

function StudentAssignment() {
  return (
    <div className="assignment-page">
      <main className="page-content">
        <section className="card assignment-card">
          <div className="assignment-header">
            <div className="assignment-header-left">
              <h1>Assignment 3: QuickSort Implementation</h1>

              <div className="assignment-meta">
                <span className="due-label">Due:</span>
                <span className="due-date">December 1, 2025 at 11:59 PM</span>
                <span className="meta-divider">|</span>
                <span>Language: C++</span>
                <span className="meta-divider">|</span>
                <span>Max Files: 3</span>
              </div>
            </div>

            <div className="points-box">
              <div className="points-number">100</div>
              <div className="points-text">points</div>
            </div>
          </div>

          <div className="description-box">
            <h3>Assignment Description:</h3>
            <p>
              Implement the QuickSort algorithm with the following
              requirements:
            </p>

            <ul>
              <li>Pivot selection using median-of-three method</li>
              <li>In-place sorting (no extra arrays)</li>
              <li>Handle arrays of size 0 to 10,000</li>
              <li>Efficient time complexity: O(n log n) average case</li>
            </ul>

            <hr />

            <p className="required-files-title">Required Files:</p>
            <p className="required-files-text">
              quicksort.cpp, quicksort.h (or single .cpp file)
            </p>
          </div>
        </section>

        <section className="card upload-card">
          <h2>Upload Your Solution</h2>

          <div className="upload-box">
            <div className="upload-icon">⇪</div>
            <p className="upload-main-text">
              <span className="browse-text">Click to browse</span> or drag and
              drop your files here
            </p>
            <p className="upload-subtext">Accepted file types: .cpp, .h, .py</p>
            <p className="upload-subtext">Maximum file size: 5 MB per file</p>
          </div>
        </section>

        <section className="notice-box">
          <div className="notice-title">Important Notice:</div>
          <div className="notice-text">
            You cannot modify your submission after clicking Submit. Please
            ensure all files are correct before submitting.
          </div>
        </section>

        <div className="action-row">
          <button className="cancel-btn">Cancel</button>
          <button className="submit-btn" disabled>
            Submit Assignment
          </button>
        </div>
      </main>
    </div>
  );
}

export default StudentAssignment;