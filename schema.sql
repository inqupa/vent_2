DROP TABLE IF EXISTS vents;
DROP TABLE IF EXISTS solvers;
DROP TABLE IF EXISTS magic_links;
DROP TABLE IF EXISTS anonymous_visitors;

CREATE TABLE solvers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'solver',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE magic_links (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

CREATE TABLE vents (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    vent_month_year TEXT NOT NULL,
    solver_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anonymous_visitors (
    id TEXT PRIMARY KEY,
    problem_views INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);