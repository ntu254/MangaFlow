const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

const workflowSteps = [
  "Series",
  "Manuscript",
  "Pages",
  "Tasks",
  "Review",
  "Board",
  "Payroll"
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Manga production workspace</p>
          <h1 id="page-title">MangaFlow</h1>
          <p className="summary">
            A buildable Phase 0 shell for the manga workflow product contract.
          </p>
        </div>

        <div className="status-card" aria-label="Service status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <p className="status-label">API health</p>
            <a href={`${apiBaseUrl}/health`}>{apiBaseUrl}/health</a>
          </div>
        </div>
      </section>

      <section className="workflow-strip" aria-label="MVP workflow">
        {workflowSteps.map((step, index) => (
          <div className="workflow-step" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}

export default App;
