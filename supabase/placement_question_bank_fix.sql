-- Remove broken placement questions (missing or empty A/B/C/D options)
DELETE FROM placement_question_bank
WHERE options IS NULL
   OR options = '{}'
   OR options::text = 'null'
   OR options->>'A' IS NULL
   OR options->>'B' IS NULL
   OR options->>'C' IS NULL
   OR options->>'D' IS NULL
   OR options->>'A' = ''
   OR options->>'B' = ''
   OR options->>'C' = ''
   OR options->>'D' = '';

-- Reseed 15 complete valid MCQs (vocabulary + grammar, bands 4.5–7.0)
INSERT INTO placement_question_bank
(id, section, band, type, question, options, correct, explanation, topic)
VALUES
('vocab-env-policy', 'vocabulary', 5.0, 'mcq',
 'The government announced a new _______ to reduce pollution in major cities.',
 '{"A": "policy", "B": "polite", "C": "police", "D": "polish"}',
 'A', 'Policy means a course of action adopted by a government or organization.', 'environment'),

('vocab-edu-submit', 'vocabulary', 5.0, 'mcq',
 'Students must _______ their assignments before the deadline.',
 '{"A": "submit", "B": "summit", "C": "support", "D": "suggest"}',
 'A', 'Submit means to hand in or present something for consideration.', 'education'),

('gram-past-went', 'grammar', 5.0, 'mcq',
 'She _______ to the library every day last semester.',
 '{"A": "goes", "B": "went", "C": "has gone", "D": "is going"}',
 'B', 'Past simple (went) is used for completed actions in the past.', 'daily life'),

('gram-plural-were', 'grammar', 5.0, 'mcq',
 'The results of the experiment _______ very surprising.',
 '{"A": "was", "B": "is", "C": "were", "D": "are being"}',
 'C', 'Results is plural so requires the plural verb form were.', 'science'),

('vocab-health-indicates', 'vocabulary', 5.5, 'mcq',
 'The report _______ that more funding is needed for healthcare.',
 '{"A": "indicates", "B": "indicated", "C": "indication", "D": "indicative"}',
 'A', 'Indicates is the correct verb form in present simple for a report stating a finding.', 'health'),

('gram-past-perfect', 'grammar', 5.5, 'mcq',
 'By the time the ambulance arrived, the patient _______ consciousness.',
 '{"A": "loses", "B": "lost", "C": "had lost", "D": "was losing"}',
 'C', 'Past perfect (had lost) is used for an action completed before another past action.', 'health'),

('vocab-law-require', 'vocabulary', 6.0, 'mcq',
 'The new law will _______ all citizens to register their vehicles annually.',
 '{"A": "request", "B": "require", "C": "recommend", "D": "remind"}',
 'B', 'Require means to make something compulsory or necessary.', 'law'),

('gram-despite-studying', 'grammar', 6.0, 'mcq',
 'Despite _______ hard, she failed to pass the examination.',
 '{"A": "study", "B": "studied", "C": "studying", "D": "to study"}',
 'C', 'Despite is followed by a gerund (-ing form).', 'education'),

('vocab-science-confirmed', 'vocabulary', 6.5, 'mcq',
 'The scientist''s findings were _______ by three independent research teams.',
 '{"A": "confirmed", "B": "conformed", "C": "confronted", "D": "confused"}',
 'A', 'Confirmed means verified or established the truth of something.', 'science'),

('gram-not-only', 'grammar', 6.5, 'mcq',
 'Not only _______ the deadline, but he also exceeded expectations.',
 '{"A": "he met", "B": "met he", "C": "did he meet", "D": "he did meet"}',
 'C', 'Inversion is required after negative adverbials like Not only.', 'work'),

('vocab-edu-skepticism', 'vocabulary', 7.0, 'mcq',
 'The committee''s decision was met with widespread _______ from the academic community.',
 '{"A": "skepticism", "B": "skeleton", "C": "spectrum", "D": "speculation"}',
 'A', 'Skepticism means doubt or questioning attitude toward something.', 'education'),

('gram-extent-which', 'grammar', 7.0, 'mcq',
 'The extent to _______ climate change affects biodiversity is still being studied.',
 '{"A": "that", "B": "which", "C": "what", "D": "where"}',
 'B', 'Which is used in relative clauses after prepositions such as to.', 'environment'),

('vocab-daily-write', 'vocabulary', 4.5, 'mcq',
 'Please _______ your name and phone number on the form.',
 '{"A": "write", "B": "right", "C": "wrote", "D": "written"}',
 'A', 'Write is the base form of the verb meaning to put words on paper.', 'daily life'),

('gram-there-were', 'grammar', 4.5, 'mcq',
 'There _______ many students in the classroom this morning.',
 '{"A": "is", "B": "are", "C": "was", "D": "were"}',
 'D', 'Were is past tense plural used with there to describe past situations.', 'education'),

('vocab-health-medicine', 'vocabulary', 5.0, 'mcq',
 'The doctor gave the patient some _______ for the pain.',
 '{"A": "medicine", "B": "median", "C": "medium", "D": "media"}',
 'A', 'Medicine refers to drugs or treatment given to relieve illness or pain.', 'health')
ON CONFLICT (id) DO UPDATE SET
  section = EXCLUDED.section,
  band = EXCLUDED.band,
  type = EXCLUDED.type,
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct = EXCLUDED.correct,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic;

-- Verify: should return 0
-- SELECT COUNT(*) FROM placement_question_bank
-- WHERE options IS NULL OR options->>'A' IS NULL OR options->>'A' = ''
--    OR options->>'B' IS NULL OR options->>'B' = '';

NOTIFY pgrst, 'reload schema';
