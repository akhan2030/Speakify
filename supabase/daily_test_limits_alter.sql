-- Separate daily limits per test mode (run after daily_test_limits exists)

alter table public.daily_test_limits
  add column if not exists mock_tests_taken int default 0,
  add column if not exists passage_tests_taken int default 0,
  add column if not exists practice_tests_taken int default 0;
