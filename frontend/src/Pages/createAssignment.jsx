import "../CSS/Template.css";
import "../CSS/createAssignment.css";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

const defaultRubric = [
  { criterion: "Correctness", max: 30, description: "Algorithm produces correct output for all test cases" },
  { criterion: "Efficiency", max: 25, description: "Achieves expected time complexity" },
  { criterion: "Code Style", max: 20, description: "Proper formatting, naming conventions, and organization" },
  { criterion: "Documentation", max: 15, description: "Clear comments explaining algorithm and logic" },
  { criterion: "Edge Cases", max: 10, description: "Handles empty arrays, duplicates, and related cases" },
];

function CreateAssignment() {
  const navigate = useNavigate();
  const { courseSlug } = useParams();

  const courseId = useMemo(() => courseSlug.replace(/^[a-zA-Z]+/, ""), [courseSlug]);

  const [form, setForm] = useState({
    assignment_name: "",
    code_language: "cpp",
    max_files: 3,
    due_date: "",
    due_time: "23:59",
    assignment_description: "",
  });

  const [rubricItems, setRubricItems] = useState(defaultRubric);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalPoints = rubricItems.reduce((sum, item) => sum + (Number(item.max) || 0), 0);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateRubricItem(index, field, value) {
    setRubricItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === "max" ? Number(value) : value } : item
      )
    );
  }

  function addCriterion() {
    setRubricItems((prev) => [
      ...prev,
      { criterion: "", max: 0, description: "" },
    ]);
  }

  function removeCriterion(index) {
    setRubricItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.assignment_name.trim()) {
      setError("Assignment name is required.");
      return;
    }

    if (!form.due_date) {
      setError("Due date is required.");
      return;
    }

    if (rubricItems.length === 0) {
      setError("At least one rubric criterion is required.");
      return;
    }

    const cleanedRubric = rubricItems.map((item) => ({
      criterion: item.criterion.trim(),
      max: Number(item.max),
      description: item.description?.trim() || "",
    }));

    const invalidRubric = cleanedRubric.some(
      (item) => !item.criterion || !item.max || item.max <= 0
    );

    if (invalidRubric) {
      setError("Each rubric row needs a criterion name and positive points.");
      return;
    }

    const payload = {
      course_id: courseId,
      assignment_name: form.assignment_name.trim(),
      assignment_description: form.assignment_description.trim(),
      code_language: form.code_language,
      due_date: form.due_date,
      due_time: form.due_time,
      max_files: Number(form.max_files),
      rubric_items: cleanedRubric,
    };

    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Failed to create assignment";
        try {
          const err = await response.json();
          message = err?.detail || err?.message || message;
        } catch {}
        throw new Error(message);
      }

      const created = await response.json();
      navigate(`/faculty/course/${courseSlug}/assignment/${created.id}`);
    } catch (err) {
      setError(err?.message || "Something went wrong while creating the assignment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-assignment-page">
      <form className="create-assignment-shell" onSubmit={handleSubmit}>
        <div className="create-card">
          <div className="section-title-row">
            <div className="section-number">1</div>
            <div>
              <h2>Assignment Details</h2>
            </div>
          </div>

          <div className="field-group">
            <label>Assignment Name *</label>
            <input
              type="text"
              value={form.assignment_name}
              onChange={(e) => updateForm("assignment_name", e.target.value)}
              placeholder="QuickSort Implementation"
            />
          </div>

          <div className="details-grid">
            <div className="field-group">
              <label>Language *</label>
              <div className="radio-row">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="language"
                    checked={form.code_language === "cpp"}
                    onChange={() => updateForm("code_language", "cpp")}
                  />
                  C++
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="language"
                    checked={form.code_language === "python"}
                    onChange={() => updateForm("code_language", "python")}
                  />
                  Python
                </label>
              </div>
            </div>

            <div className="field-group">
              <label>Max Files *</label>
              <input
                type="number"
                min="1"
                value={form.max_files}
                onChange={(e) => updateForm("max_files", e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Due Date *</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => updateForm("due_date", e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Due Time *</label>
              <input
                type="time"
                value={form.due_time}
                onChange={(e) => updateForm("due_time", e.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Description *</label>
            <textarea
              rows="5"
              value={form.assignment_description}
              onChange={(e) => updateForm("assignment_description", e.target.value)}
              placeholder="Implement the QuickSort algorithm with median-of-three pivot selection..."
            />
            <div className="char-counter">
              {form.assignment_description.length}/1000 characters
            </div>
          </div>
        </div>

        <div className="create-card">
          <div className="section-title-row between">
            <div className="section-title-row">
              <div className="section-number">2</div>
              <div>
                <h2>Rubric Builder</h2>
              </div>
            </div>
            <div className="rubric-total">Total: {totalPoints} points</div>
          </div>

          <div className="rubric-list">
            {rubricItems.map((item, index) => (
              <div className="rubric-row" key={index}>
                <input
                  className="criterion-input"
                  type="text"
                  value={item.criterion}
                  onChange={(e) => updateRubricItem(index, "criterion", e.target.value)}
                  placeholder="Criterion"
                />
                <input
                  className="points-input"
                  type="number"
                  min="1"
                  value={item.max}
                  onChange={(e) => updateRubricItem(index, "max", e.target.value)}
                  placeholder="Points"
                />
                <input
                  className="description-input"
                  type="text"
                  value={item.description}
                  onChange={(e) => updateRubricItem(index, "description", e.target.value)}
                  placeholder="Description"
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeCriterion(index)}
                  aria-label={`Remove criterion ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="rubric-actions">
            <button type="button" className="secondary-btn" onClick={addCriterion}>
              + Add Criterion
            </button>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="bottom-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate(`/faculty/course/${courseSlug}`)}
          >
            Cancel
          </button>
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? "Publishing..." : "Publish Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAssignment;