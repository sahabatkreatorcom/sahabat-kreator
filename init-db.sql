-- Initialize Sahabat Kreator database
-- Create the database if it doesn't exist

SELECT 'CREATE DATABASE sahabatkreator' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sahabatkreator')\gexec

-- Create the migration SQL file
-- This will be replaced by the actual migration file
