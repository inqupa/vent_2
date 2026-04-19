CREATE TABLE vents (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    vent_month_year TEXT NOT NULL,
    solver_id TEXT,
    is_test INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);