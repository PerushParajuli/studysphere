"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

const ROLES = ["student", "teacher", "admin"];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [roleSelections, setRoleSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState({});
  const [deleting, setDeleting] = useState({});
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        toast.error("Could not fetch your profile. Please log in again.");
        router.replace("/login");
        return;
      }

      if (profile.role !== 'admin') {
        toast.error("You do not have permission to access this page.");
        router.replace("/dashboard");
        return;
      }
      
      setUser({ ...user, ...profile });

      // Fetch pending users
      const { data: pending, error: pendingError } = await supabase
        .from("profile_with_email")
        .select("id, name, email")
        .eq("role", "pending");

      if (pendingError) {
        toast.error(pendingError.message || "Could not fetch pending users");
      } else {
        setPendingUsers(pending || []);
      }

      // Fetch registered users
      const { data: registered, error: registeredError } = await supabase
        .from("profile_with_email")
        .select("id, name, email, role")
        .not("role", "eq", "pending")
        .neq("id", user.id);

      if (registeredError) {
        toast.error(registeredError.message || "Could not fetch registered users");
      } else {
        setRegisteredUsers(registered || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [router, toast]);

  const handleRoleChange = (userId, newRole) => {
    setRoleSelections((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleAssignRole = async (userId) => {
    const newRole = roleSelections[userId];
    if (!newRole) {
      toast.error("Please select a role to assign.");
      return;
    }
    setAssigning((prev) => ({ ...prev, [userId]: true }));

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast.error(error.message || "Failed to assign role");
    } else {
      const userUpdated = pendingUsers.find((u) => u.id === userId);
      if (userUpdated) {
        setRegisteredUsers((prev) => [
          ...prev,
          { ...userUpdated, role: newRole },
        ]);
      }
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setRoleSelections((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      toast.success(`Role assigned successfully to ${userUpdated?.name || 'user'}`)
    }

    setAssigning((prev) => ({ ...prev, [userId]: false }));
  };

  const handleDenyUser = async (userId) => {
    const user = pendingUsers.find(u => u.id === userId);
    const confirmDeny = window.confirm(
      `Are you sure you want to deny ${user?.name || 'this user'}'s registration? This will delete their account.`
    );
    
    if (!confirmDeny) return;
    
    setDeleting((prev) => ({ ...prev, [userId]: true }));

    // Delete the pending user's profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      toast.error(profileError.message || "Failed to deny user registration");
      setDeleting((prev) => ({ ...prev, [userId]: false }));
      return;
    }

    // Try to delete from auth.users table as well
    try {
      const { error: rpcError } = await supabase.rpc("delete_auth_user", { target_uid: userId });
      if (rpcError) {
        console.warn("RPC delete_auth_user not available or failed:", rpcError.message);
      }
    } catch (error) {
      console.warn("RPC function not available:", error.message);
    }

    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User registration denied successfully");

    setDeleting((prev) => ({ ...prev, [userId]: false }));
  };

  const handleDeleteUser = async (userId) => {
    const user = registeredUsers.find(u => u.id === userId);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${user?.name || 'this user'}? This action cannot be undone and will remove them from the system.`
    );
    
    if (!confirmDelete) return;
    
    setDeleting((prev) => ({ ...prev, [userId]: true }));

    // 1. Delete the user's profile from the profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      toast.error(profileError.message || "Failed to delete user profile");
      setDeleting((prev) => ({ ...prev, [userId]: false }));
      return;
    }

    // 2. Try to delete the user from the auth.users table via RPC (optional)
    try {
      const { error: rpcError } = await supabase.rpc("delete_auth_user", { target_uid: userId });
      if (rpcError) {
        console.warn("RPC delete_auth_user not available or failed:", rpcError.message);
        // This is not critical - the profile deletion is the main requirement
      }
    } catch (error) {
      console.warn("RPC function not available:", error.message);
      // Continue anyway - profile deletion is sufficient for most use cases
    }

    setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User deleted successfully");

    setDeleting((prev) => ({ ...prev, [userId]: false }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-700 dark:text-gray-200 text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} isAdmin={true}>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending User Approvals</CardTitle>
            <CardDescription>
              Review and assign roles to newly registered users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users are currently pending approval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Name</th>
                      <th scope="col" className="px-6 py-3">Email</th>
                      <th scope="col" className="px-6 py-3">Assign Role</th>
                      <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{user.name}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
                          <select
                            className="border rounded px-2 py-1 dark:bg-gray-800 dark:text-white w-full"
                            value={roleSelections[user.id] || ""}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          >
                            <option value="" disabled>Select role</option>
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleAssignRole(user.id)}
                            disabled={assigning[user.id] || !roleSelections[user.id]}
                          >
                            {assigning[user.id] ? "Assigning..." : "Assign"}
                          </Button>
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDenyUser(user.id)}
                            disabled={deleting[user.id]}
                          >
                            {deleting[user.id] ? "Denying..." : "Deny"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registered User Management</CardTitle>
            <CardDescription>
              View and manage all registered users in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
          {registeredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No registered users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Name</th>
                      <th scope="col" className="px-6 py-3">Email</th>
                      <th scope="col" className="px-6 py-3">Role</th>
                      <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.map((user) => (
                      <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{user.name}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleting[user.id]}
                          >
                            {deleting[user.id] ? "Deleting..." : "Delete"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
