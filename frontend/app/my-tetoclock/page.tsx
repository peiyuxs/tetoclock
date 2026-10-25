import SiteNav from "../../components/SiteNav";
import Dashboard from "../../components/Dashboard";

export default function DashboardPage() {
  return (
    <>
      <SiteNav />
      <main className="dashboard-page">
        <div className="dashboard-heading">
          <h1>My <em>TetoClocks</em></h1>
          <p className="dashboard-intro">
            Manage your TetoClock settings and alarm history.
          </p>
        </div>
        <Dashboard />
      </main>
      <footer className="dashboard-footer">
        <span>© 2026 TETO&apos;Clock</span>
        <span>Clock data is private to your signed-in account.</span>
      </footer>
    </>
  );
}
