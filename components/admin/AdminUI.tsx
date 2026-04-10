interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-[#B6FF00]/20 bg-[#B6FF00]/5" : "border-white/8 bg-white/3"}`}>
      <p className="text-xs font-medium text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)] mb-2">
        {label}
      </p>
      <p className={`text-3xl font-black font-[family-name:var(--font-barlow-condensed)] ${accent ? "text-[#B6FF00]" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/30 mt-1 font-[family-name:var(--font-dm-sans)]">{sub}</p>}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, desc, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-black font-[family-name:var(--font-barlow-condensed)] uppercase tracking-wide text-white">
          {title}
        </h1>
        {desc && (
          <p className="text-white/40 text-sm mt-1 font-[family-name:var(--font-dm-sans)]">{desc}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  empty?: string;
  isEmpty?: boolean;
}

export function AdminTable({ headers, children, empty = "No data", isEmpty }: TableProps) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden">
      <table className="w-full text-sm font-[family-name:var(--font-dm-sans)]">
        <thead>
          <tr className="border-b border-white/8 bg-white/3">
            {headers.map((h) => (
              <th key={h} className="text-left px-5 py-3.5 text-white/40 font-medium text-xs uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {isEmpty ? (
          <tbody>
            <tr>
              <td colSpan={headers.length} className="px-5 py-16 text-center text-white/30">
                {empty}
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>{children}</tbody>
        )}
      </table>
    </div>
  );
}

export function Tr({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <tr className={`hover:bg-white/3 transition-colors ${last ? "" : "border-b border-white/5"}`}>
      {children}
    </tr>
  );
}

export function Td({ children, mono, dim }: { children: React.ReactNode; mono?: boolean; dim?: boolean }) {
  return (
    <td className={`px-5 py-3.5 ${mono ? "font-mono text-xs" : ""} ${dim ? "text-white/40" : "text-white/80"}`}>
      {children}
    </td>
  );
}

export function Badge({ label, color }: { label: string; color: "green" | "red" | "yellow" | "blue" | "gray" }) {
  const cls = {
    green: "bg-[#B6FF00]/10 text-[#B6FF00]",
    red: "bg-red-500/10 text-red-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    blue: "bg-blue-500/10 text-blue-400",
    gray: "bg-white/8 text-white/50",
  }[color];
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {children}
    </div>
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 font-[family-name:var(--font-dm-sans)] focus:outline-none focus:border-[#B6FF00]/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
      ))}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search…"}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 font-[family-name:var(--font-dm-sans)] focus:outline-none focus:border-[#B6FF00]/40 min-w-[200px]"
    />
  );
}

export function ActionButton({ onClick, label, variant = "ghost" }: { onClick: () => void; label: string; variant?: "ghost" | "danger" | "primary" }) {
  const cls = {
    ghost: "text-white/50 hover:text-white",
    danger: "text-red-400/60 hover:text-red-400",
    primary: "text-[#B6FF00]/80 hover:text-[#B6FF00]",
  }[variant];
  return (
    <button onClick={onClick} className={`text-xs transition-colors ${cls}`}>
      {label}
    </button>
  );
}

export function SectionNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)] bg-white/3 border border-white/8 rounded-xl p-4 mb-6">
      {children}
    </div>
  );
}
