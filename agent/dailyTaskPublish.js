/** Daily AI tasks go live immediately — teacher QA can still reject via dashboard. */
function dailyTaskPublishFields() {
  const now = new Date().toISOString();
  return {
    status: "published",
    published_at: now,
  };
}

module.exports = {
  dailyTaskPublishFields,
};
