-- One active orientation booking per student.
-- Run after cancelling extras (scripts/repair-double-orientation.ts).

CREATE UNIQUE INDEX IF NOT EXISTS live_class_one_active_orientation_per_student
  ON live_class_bookings (student_id)
  WHERE session_type = 'orientation'
    AND status IN ('reserved', 'confirmed', 'completed');
