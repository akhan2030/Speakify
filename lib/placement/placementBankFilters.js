/**
 * Supabase filters for placement_question_bank — only rows with all four MCQ options.
 */
export function applyPlacementBankFilters(query) {
  return query.not("options", "is", null).neq("options", "{}");
}
