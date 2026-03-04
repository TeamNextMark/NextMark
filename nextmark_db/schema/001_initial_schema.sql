CREATE TABLE users_account (
    id_users TEXT PRIMARY KEY,
    position_users TEXT NOT NULL CHECK (position_users IN ('student', 'faculty', 'admin', 'ta')),
    email_users TEXT NOT NULL UNIQUE,
    encryptedpassword_users TEXT NOT NULL,
    ferpa_consent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE course (
    course_id TEXT PRIMARY KEY,
    faculty_id TEXT NOT NULL,
    course_code TEXT NOT NULL,
    semester TEXT NOT NULL,
    CONSTRAINT fk_course_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES users_account(id_users)
);

CREATE TABLE rubric_template (
    template_id TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    line_items JSONB NOT NULL,
    total_points INTEGER NOT NULL
);

CREATE TABLE assignment_rubric (
    rubric_version_id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_assignment_rubric_template
        FOREIGN KEY (template_id)
        REFERENCES rubric_template(template_id)
);

CREATE TABLE assignment (
    assignment_id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    rubric_version_id TEXT NOT NULL,
    code_language TEXT NOT NULL,
    due_date DATE NOT NULL,
    CONSTRAINT fk_assignment_course
        FOREIGN KEY (course_id)
        REFERENCES course(course_id),
    CONSTRAINT fk_assignment_rubric
        FOREIGN KEY (rubric_version_id)
        REFERENCES assignment_rubric(rubric_version_id)
);

CREATE TABLE test_case (
    test_case_id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    timeout_seconds INTEGER NOT NULL DEFAULT 5,
    CONSTRAINT fk_test_case_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignment(assignment_id)
);

CREATE TABLE submission (
    submission_id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    encrypted_file_paths JSONB NOT NULL,
    CONSTRAINT fk_submission_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignment(assignment_id),
    CONSTRAINT fk_submission_student
        FOREIGN KEY (student_id)
        REFERENCES users_account(id_users)
);

CREATE TABLE grading_result (
    result_id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    total_points_earned NUMERIC(10,2) NOT NULL,
    rubric_scores JSONB NOT NULL,
    faculty_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_grading_result_submission
        FOREIGN KEY (submission_id)
        REFERENCES submission(submission_id)
);

CREATE TABLE flag (
    flag_id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    test_case_id TEXT NULL,
    resolved_by TEXT NULL,
    source_type TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL,
    response_text TEXT NULL,
    CONSTRAINT fk_flag_submission
        FOREIGN KEY (submission_id)
        REFERENCES submission(submission_id),
    CONSTRAINT fk_flag_test_case
        FOREIGN KEY (test_case_id)
        REFERENCES test_case(test_case_id),
    CONSTRAINT fk_flag_resolved_by
        FOREIGN KEY (resolved_by)
        REFERENCES users_account(id_users)
);

CREATE TABLE feedback (
    feedback_id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('auto', 'manual')),
    rubric_item_id TEXT NULL,
    message_text TEXT NOT NULL,
    severity TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_feedback_submission
        FOREIGN KEY (submission_id)
        REFERENCES submission(submission_id),
    CONSTRAINT fk_feedback_author
        FOREIGN KEY (author_id)
        REFERENCES users_account(id_users)
);

CREATE TABLE notification (
    notification_id TEXT PRIMARY KEY,
    id_users TEXT NOT NULL,
    flag_id TEXT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notification_user
        FOREIGN KEY (id_users)
        REFERENCES users_account(id_users),
    CONSTRAINT fk_notification_flag
        FOREIGN KEY (flag_id)
        REFERENCES flag(flag_id)
);

CREATE TABLE system_log (
    log_id TEXT PRIMARY KEY,
    submission_id TEXT NULL,
    id_users TEXT NULL,
    test_case_id TEXT NULL,
    log_type TEXT NOT NULL,
    details JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_system_log_submission
        FOREIGN KEY (submission_id)
        REFERENCES submission(submission_id),
    CONSTRAINT fk_system_log_user
        FOREIGN KEY (id_users)
        REFERENCES users_account(id_users),
    CONSTRAINT fk_system_log_test_case
        FOREIGN KEY (test_case_id)
        REFERENCES test_case(test_case_id)
);

CREATE TABLE audit_history (
    history_id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    state_snapshot JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_history_actor
        FOREIGN KEY (actor_id)
        REFERENCES users_account(id_users)
);

