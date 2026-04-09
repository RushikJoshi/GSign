import Select from "../common/Select";

const DashboardFilters = ({ query, onQueryChange, status, onStatusChange }) => {
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Signed", label: "Signed" },
    { value: "Pending", label: "Pending" },
    { value: "Viewed", label: "Viewed" },
    { value: "Rejected", label: "Rejected" }
  ];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search documents by title..."
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <Select
        value={status}
        onChange={onStatusChange}
        options={statusOptions}
        className="sm:w-48"
      />
    </div>
  );
};

export default DashboardFilters;
