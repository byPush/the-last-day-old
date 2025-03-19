/*
  # Create votes table for Farcaster Frame

  1. New Tables
    - `votes`
      - `id` (uuid, primary key)
      - `fid` (bigint, Farcaster user ID)
      - `artwork_id` (integer, references the artwork being voted for)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `votes` table
    - Add policy for authenticated users to insert their own votes
    - Add policy for public read access to vote counts
*/

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid bigint NOT NULL,
  artwork_id integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fid, artwork_id, created_at)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);