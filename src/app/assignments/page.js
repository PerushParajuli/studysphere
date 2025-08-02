"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/toast";

const AssignmentsPage = () => {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserAndAssignments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();

      setUser({ ...user, ...profile });

      // Fetch assignments based on user role
      let listPath = "";
      if (profile.role === "student") {
        listPath = user.id; // Students see only their own folder
      }
      // Teachers and admins see all assignments (empty path lists all)

      const { data, error } = await supabase.storage
        .from("assignments")
        .list(listPath);
      if (error) {
        console.error("Error fetching assignments:", error);
        toast.error("Could not fetch assignments.");
      } else {
        setAssignments(data || []);
      }
      setLoading(false);
    };

    fetchUserAndAssignments();
  }, [router, toast]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    // Upload to user's folder: user_id/filename
    const filePath = `${user.id}/${file.name}`;
    const { error } = await supabase.storage
      .from("assignments")
      .upload(filePath, file);
    setUploading(false);

    if (error) {
      toast.error(`Failed to upload assignment: ${error.message}`);
    } else {
      // Refresh the assignments list
      const { data } = await supabase.storage
        .from("assignments")
        .list(user.role === "student" ? user.id : "");
      setAssignments(data || []);
      toast.success("Assignment uploaded successfully!");
    }
  };

  const handleDeleteFile = async (fileName) => {
    const filePath =
      user.role === "student" ? `${user.id}/${fileName}` : fileName;
    const { error } = await supabase.storage
      .from("assignments")
      .remove([filePath]);

    if (error) {
      toast.error(`Failed to delete assignment: ${error.message}`);
    } else {
      setAssignments((prev) => prev.filter((file) => file.name !== fileName));
      toast.success("Assignment deleted successfully!");
    }
  };

  const getFileUrl = (fileName) => {
    const filePath =
      user.role === "student" ? `${user.id}/${fileName}` : fileName;
    return supabase.storage.from("assignments").getPublicUrl(filePath).data
      .publicUrl;
  };

  return (
    <DashboardLayout user={user} isAdmin={user?.role === "admin"}>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>
            {user?.role === "student"
              ? "My Assignments"
              : "All Student Assignments"}
          </CardTitle>
          {user?.role === "student" && (
            <div>
              <Button
                onClick={() =>
                  document.getElementById("assignment-upload").click()
                }
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Assignment"}
              </Button>
              <Input
                id="assignment-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="text-gray-500">
              {user?.role === "student"
                ? "No assignments uploaded yet."
                : "No student assignments found."}
            </p>
          ) : (
            <div className="space-y-4">
              {user?.role !== "student" && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Showing assignments from all students. Files are organized by
                  student folders.
                </p>
              )}
              <ul className="space-y-2">
                {assignments.map((file) => (
                  <li
                    key={file.name}
                    className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex flex-col">
                      <a
                        href={getFileUrl(file.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {file.name}
                      </a>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded:{" "}
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(getFileUrl(file.name), "_blank")
                        }
                      >
                        View
                      </Button>
                      {(user?.role === "student" ||
                        user?.role === "admin" ||
                        user?.role === "teacher") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFile(file.name)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AssignmentsPage;
