"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Shield,
  UserCheck,
  Eye,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  Crown,
  Sparkles,
  Heart,
  Mic2,
  ClipboardList,
  Calendar,
  AlertCircle,
} from "lucide-react";

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER" | "VISITOR";
  createdAt: string;
  updatedAt: string;
  _count: {
    contributions: number;
    oralHistories: number;
    favorites: number;
    quizResults: number;
    heritageVisits: number;
  };
};

type UserCounts = {
  total: number;
  admin: number;
  user: number;
  visitor: number;
  activeContributors: number;
};

const roleTabs = [
  { key: "ALL", label: "All Users" },
  { key: "ADMIN", label: "Administrators" },
  { key: "USER", label: "Community Members" },
  { key: "VISITOR", label: "Visitors" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [counts, setCounts] = useState<UserCounts>({
    total: 0,
    admin: 0,
    user: 0,
    visitor: 0,
    activeContributors: 0,
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const url =
        roleFilter === "ALL"
          ? `/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`
          : `/api/admin/users?role=${roleFilter}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load users.");
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      if (data.counts) {
        setCounts(data.counts);
      }
      if (data.currentUserId) {
        setCurrentUserId(data.currentUserId);
      }
    } catch (error) {
      console.error("Load users error:", error);
      alert(error instanceof Error ? error.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleRoleChange(userId: string, newRole: "ADMIN" | "USER" | "VISITOR") {
    if (userId === currentUserId && newRole !== "ADMIN") {
      const confirmed = window.confirm(
        "Warning: You are about to change your own role away from ADMIN. You may lose access to this admin panel. Are you sure?"
      );
      if (!confirmed) return;
    }

    setActionLoadingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user role.");
      }

      // Optimistically update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      loadUsers();
    } catch (error) {
      console.error("Role update error:", error);
      alert(error instanceof Error ? error.message : "Failed to update role.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (userId === currentUserId) {
      alert("You cannot delete your own admin account while signed in.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the account for ${email}? All associated data will be removed.`
    );
    if (!confirmed) return;

    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user.");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      loadUsers();
    } catch (error) {
      console.error("Delete user error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function getInitials(name: string | null, email: string) {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Platform Administration
          </div>
          <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">
            User Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            View registered user profiles, contributor records, assign administrator
            privileges, and manage platform membership.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Users
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider">Total Users</span>
            <Users size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold">{counts.total}</div>
          <div className="mt-1 text-xs text-white/40">All registered accounts</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.05] p-5">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs uppercase tracking-wider">Admins</span>
            <Crown size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-purple-300">
            {counts.admin}
          </div>
          <div className="mt-1 text-xs text-purple-200/50">Full CMS control</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs uppercase tracking-wider">Members</span>
            <UserCheck size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-emerald-300">
            {counts.user}
          </div>
          <div className="mt-1 text-xs text-emerald-200/50">Community members</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider">Visitors</span>
            <Eye size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold">{counts.visitor}</div>
          <div className="mt-1 text-xs text-white/40">Read-only users</div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs uppercase tracking-wider">Contributors</span>
            <Sparkles size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-amber-300">
            {counts.activeContributors}
          </div>
          <div className="mt-1 text-xs text-amber-200/50">Submitted heritage</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Role Pills */}
        <div className="flex flex-wrap gap-2">
          {roleTabs.map((tab) => {
            const active = roleFilter === tab.key;
            let count = counts.total;
            if (tab.key === "ADMIN") count = counts.admin;
            if (tab.key === "USER") count = counts.user;
            if (tab.key === "VISITOR") count = counts.visitor;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? "bg-black/15 text-black" : "bg-white/10 text-white/70"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadUsers()}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-xs text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-white/50">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading user accounts...</span>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/40">
            <Users size={24} />
          </div>
          <h3 className="mt-4 font-medium text-white">No users found</h3>
          <p className="mt-1 max-w-sm text-xs text-white/40">
            {search
              ? "No accounts matched your search query."
              : "No users currently in this role category."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isSelf = user.id === currentUserId;
            const isBusy = actionLoadingId === user.id;

            return (
              <div
                key={user.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 md:flex-row md:items-center"
              >
                {/* User Info */}
                <div className="flex items-center gap-4">
                  {/* Initials Avatar */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-serif text-sm font-bold ${
                      user.role === "ADMIN"
                        ? "border border-purple-400/40 bg-purple-500/20 text-purple-300"
                        : user.role === "USER"
                        ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                        : "border border-white/20 bg-white/10 text-white/80"
                    }`}
                  >
                    {getInitials(user.name, user.email)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">
                        {user.name || "Unnamed User"}
                      </span>

                      {isSelf && (
                        <span className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
                          You
                        </span>
                      )}

                      {/* Role Pill */}
                      {user.role === "ADMIN" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-300">
                          <Crown size={10} />
                          Admin
                        </span>
                      )}

                      {user.role === "USER" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                          <UserCheck size={10} />
                          Member
                        </span>
                      )}

                      {user.role === "VISITOR" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/50">
                          <Eye size={10} />
                          Visitor
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
                      <span>{user.email}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} />
                        Joined{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Activity Counters */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-white/50">
                      <span className="inline-flex items-center gap-1">
                        <ClipboardList size={11} className="text-amber-400" />
                        {user._count.contributions} contributions
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Mic2 size={11} className="text-purple-400" />
                        {user._count.oralHistories} oral histories
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Heart size={11} className="text-rose-400" />
                        {user._count.favorites} favorites
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Change Role & Delete */}
                <div className="flex shrink-0 items-center gap-3">
                  {/* Role Selector */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-1 text-xs">
                    <span className="px-2 text-[11px] text-white/40">Role:</span>
                    {(["ADMIN", "USER", "VISITOR"] as const).map((r) => {
                      const selected = user.role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          disabled={isBusy || selected}
                          onClick={() => handleRoleChange(user.id, r)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                            selected
                              ? "bg-white text-black font-semibold"
                              : "text-white/60 hover:text-white"
                          }`}
                        >
                          {r === "ADMIN" ? "Admin" : r === "USER" ? "Member" : "Visitor"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={isBusy || isSelf}
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    title={
                      isSelf
                        ? "You cannot delete your own account"
                        : "Delete this user"
                    }
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                      isSelf
                        ? "cursor-not-allowed border-white/5 text-white/20"
                        : "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/15"
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
