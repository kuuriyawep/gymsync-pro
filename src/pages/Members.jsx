import React from "react";
import Layout from "@/components/Layout";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";

const members = [
  { name: "Sarah Chen", email: "sarah.c@mail.com", gym: "Downtown Iron", plan: "Premium", status: "Active", joined: "Aug 2026" },
  { name: "Marcus Reed", email: "m.reed@mail.com", gym: "Westside Fitness", plan: "Basic", status: "Active", joined: "Aug 2026" },
  { name: "Lena Park", email: "lena.p@mail.com", gym: "Riverside Gym", plan: "Premium", status: "Active", joined: "Aug 2026" },
  { name: "Diego Santos", email: "d.santos@mail.com", gym: "Downtown Iron", plan: "Standard", status: "Frozen", joined: "Jul 2026" },
  { name: "Aisha Khan", email: "a.khan@mail.com", gym: "Northgate Athletic", plan: "Premium", status: "Active", joined: "Jul 2026" },
  { name: "Tom Walsh", email: "tom.w@mail.com", gym: "Westside Fitness", plan: "Basic", status: "Inactive", joined: "Jun 2026" },
  { name: "Nina Costa", email: "nina.c@mail.com", gym: "Riverside Gym", plan: "Standard", status: "Active", joined: "Jun 2026" },
];

export default function Members() {
  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">Members</h1>
            <p className="text-sm text-black/50 mt-0.5">4,829 members across 12 gyms</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4" /> Add member
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/5 flex-1">
            <Search className="w-4 h-4 text-black/40" />
            <input
              placeholder="Search members…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-black/40"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-black/15 text-sm font-medium hover:bg-black/5">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Table (desktop) */}
        <div className="hidden md:block bg-white border border-black/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs text-black/40">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Gym</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">
                        {m.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-black/50">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-black/70">{m.gym}</td>
                  <td className="px-5 py-3">{m.plan}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.status === "Active" ? "bg-black text-white" : "bg-black/10 text-black/60"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-black/50">{m.joined}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="p-1.5 rounded-lg hover:bg-black/5">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden space-y-3">
          {members.map((m) => (
            <div key={m.email} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <p className="text-xs text-black/50 truncate">{m.email}</p>
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.status === "Active" ? "bg-black text-white" : "bg-black/10 text-black/60"
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 text-xs">
                <span className="text-black/50">{m.gym}</span>
                <span className="font-medium">{m.plan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}