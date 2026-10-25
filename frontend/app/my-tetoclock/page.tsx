import SiteNav from "../../components/SiteNav";
import Dashboard from "../../components/Dashboard";

export default function DashboardPage() {
  return (
    <>
      <SiteNav />
      <main className="dashboard-page">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Your morning, your rules</p>
            <h1>My <em>TetoClock</em></h1>
            <p className="dashboard-intro">
              Manage each connected clock, its wake-up settings, and your alarm history.
            </p>
          </div>
          <div className="device-status">
            <span className="status-dot" />
            <span>Dashboard preview</span>
          </div>
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
