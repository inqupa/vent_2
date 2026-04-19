CREATE TABLE anonymous_visitors (
    id TEXT PRIMARY KEY,
    problem_views INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);