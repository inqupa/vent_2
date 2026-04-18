-- Create the Solvers table (Known users)
CREATE TABLE IF NOT EXISTS solvers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create the Vents table (Completely anonymous)
CREATE TABLE IF NOT EXISTS vents (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    vent_month_year TEXT NOT NULL 
);