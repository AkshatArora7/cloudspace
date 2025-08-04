-- Initialize the database with required tables
-- This script will be automatically executed when setting up the project

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    emailVerified BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create s3_configs table
CREATE TABLE IF NOT EXISTS s3_configs (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    accessKeyId TEXT NOT NULL,
    secretAccessKey TEXT NOT NULL, -- This will be encrypted
    region TEXT NOT NULL,
    bucketName TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_s3_configs_userId ON s3_configs(userId);
