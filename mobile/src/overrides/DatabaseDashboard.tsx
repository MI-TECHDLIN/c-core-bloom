import React from "react";

export const DatabaseDashboard = () => {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Database Dashboard</h2>
      <p className="text-sm text-muted-foreground">
        Admin database metrics are available in the web app and will sync when the mobile shell is online.
      </p>
    </div>
  );
};

export default DatabaseDashboard;
