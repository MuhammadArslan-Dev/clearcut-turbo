"use client";

import { useState, useCallback } from "react";
import { trackEvent } from "@/lib/analytics/browser";
import ProfileCard, { Profile } from "./ProfileCard";
import { getProfile, updateProfile } from "@/lib/api/profile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = ["profile"];

const ProfileWrap = () => {
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Profile, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  /* ------------------ QUERY ------------------ */
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<Profile>({
    queryKey: QUERY_KEY,
    queryFn: getProfile,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  /* ---------------- MUTATION ----------------- */
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (savedProfile) => {
      queryClient.setQueryData<Profile>(QUERY_KEY, () => ({ ...savedProfile }));
      setFieldErrors({});
      setServerError(null);
    },
  });

  /* ------------ CLEAR ERRORS ------------ */
  const clearErrors = useCallback((field?: keyof Profile) => {
    if (field) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } else {
      setFieldErrors({});
    }
    setServerError(null);
  }, []);

  /* ----------- HELPER: detect changes ----------- */
  function getUpdatedFields<T extends Record<string, unknown>>(prev: T, next: T): string[] {
    return Object.keys(next).filter(
      (key) => JSON.stringify(prev[key]) !== JSON.stringify(next[key]),
    );
  }

  /* ---------------- HANDLE EDIT ---------------- */
  const handleEdit = async (updated: Profile) => {
    if (!profile) return;

    const updatedFields = getUpdatedFields(profile as Record<string, unknown>, updated as Record<string, unknown>);
    if (updatedFields.length === 0) return;

    setFieldErrors({});
    setServerError(null);

    try {
      await updateMutation.mutateAsync(updated);

      trackEvent("Profile Updated", { updated_fields: updatedFields });
    } catch (err: unknown) {
      const apiErr = err as Record<string, unknown>;

      if (apiErr?.errors && typeof apiErr.errors === "object") {
        // 422 — map each field's first message
        const mapped: Partial<Record<keyof Profile, string>> = {};
        for (const [field, messages] of Object.entries(apiErr.errors as Record<string, string[]>)) {
          mapped[field as keyof Profile] = messages[0];
        }
        setFieldErrors(mapped);
      } else {
        setServerError(
          typeof apiErr?.message === "string"
            ? apiErr.message
            : "Something went wrong. Please try again.",
        );
      }

      // Re-throw so ProfileCard stays in edit mode
      throw err;
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="max-w-[500px]">
      <ProfileCard
        profile={profile}
        loading={isLoading}
        onEdit={handleEdit}
        errors={fieldErrors}
        clearErrors={clearErrors}
        serverError={serverError}
      />

      {isError && (
        <p className="text-red-500 text-sm mt-2">Failed to load profile</p>
      )}
    </div>
  );
};

export default ProfileWrap;
