-- Seed mini mock + full mock data for progress page testing
-- Replace email as needed

INSERT INTO step_mini_mock_results (
  student_id, mock_number, reading_score, structure_score, listening_score,
  compositional_score, total_score, estimated_step_score, phase, completed_at
)
SELECT id, 1, 3, 4, 3, 4, 14, 70, 1, NOW() - INTERVAL '5 days'
FROM users WHERE email = 'student@speakify.com'
ON CONFLICT DO NOTHING;

INSERT INTO step_mini_mock_results (
  student_id, mock_number, reading_score, structure_score, listening_score,
  compositional_score, total_score, estimated_step_score, phase, completed_at
)
SELECT id, 2, 4, 4, 4, 3, 15, 75, 2, NOW() - INTERVAL '2 days'
FROM users WHERE email = 'student@speakify.com'
ON CONFLICT DO NOTHING;

-- Ensure full mocks exist for trend chart (skip if already inserted)
INSERT INTO step_mock_results (
  student_id, mock_number, reading_score, structure_score, listening_score,
  compositional_score, total_score, phase, completed_at
)
SELECT id, 1, 28, 19, 13, 6, 66, 2, NOW() - INTERVAL '5 weeks'
FROM users WHERE email = 'student@speakify.com'
WHERE NOT EXISTS (
  SELECT 1 FROM step_mock_results m
  JOIN users u ON m.student_id = u.id
  WHERE u.email = 'student@speakify.com' AND m.mock_number = 1
);

INSERT INTO step_mock_results (
  student_id, mock_number, reading_score, structure_score, listening_score,
  compositional_score, total_score, phase, completed_at
)
SELECT id, 2, 31, 22, 15, 7, 75, 3, NOW() - INTERVAL '2 weeks'
FROM users WHERE email = 'student@speakify.com'
WHERE NOT EXISTS (
  SELECT 1 FROM step_mock_results m
  JOIN users u ON m.student_id = u.id
  WHERE u.email = 'student@speakify.com' AND m.mock_number = 2
);

UPDATE step_enrollments
SET estimated_score = 75, current_phase = 3, current_week = 2
WHERE student_id = (SELECT id FROM users WHERE email = 'student@speakify.com');
