import React, { memo, useEffect, useMemo, useState } from "react";
import { Button, Input, Skeleton, Select, Option } from "@mui/joy";
import { PencilLineIcon, Check, X, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import { useModalStore } from "@/store/modal/useModalStore";

/* =======================
   Types
======================= */

export type Profile = {
  name: string;
  gender: string;
  dob: string;
  email: string;
  phone?: string | number;
};

type ProfileCardProps = {
  profile?: Profile;
  loading?: boolean;
  onEdit?: (updatedProfile: Profile) => Promise<void> | void;
  errors?: Partial<Record<keyof Profile, string>>;
  clearErrors?: (field?: keyof Profile) => void;
  serverError?: string | null;
};

/* =======================
   Config
======================= */

const FIELD_CONFIG = [
  { key: "name",   label: "Name",          required: true,  placeholder: "John Doe"         },
  { key: "gender", label: "Gender",         required: true,  placeholder: "Select gender"    },
  { key: "dob",    label: "Date of birth",  required: true,  placeholder: "YYYY-MM-DD"       },
  { key: "email",  label: "Email",          required: true,  placeholder: "john@example.com" },
  { key: "phone",  label: "Phone",          required: false, placeholder: "1234567890"       },
] as const satisfies readonly {
  key: keyof Profile;
  label: string;
  required: boolean;
  placeholder: string;
}[];

/* =======================
   Helpers
======================= */

function formatDOBInput(value: string) {
  const digits = value.replace(/\D/g, "");
  let year  = digits.slice(0, 4);
  let month = digits.slice(4, 6);
  let day   = digits.slice(6, 8);

  if (month.length === 1 && Number(month) > 1) month = "0" + month;
  if (day.length === 1   && Number(day)   > 3) day   = "0" + day;

  let result = year;
  if (month) result += `-${month}`;
  if (day)   result += `-${day}`;

  return result.slice(0, 10);
}

function isEqual(a: Profile, b: Profile) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function validate(draft: Profile): Partial<Record<keyof Profile, string>> {
  const errs: Partial<Record<keyof Profile, string>> = {};

  if (!draft.name?.trim()) {
    errs.name = "Name is required.";
  }

  if (!draft.email?.trim()) {
    errs.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    errs.email = "Please enter a valid email address.";
  }

  if (draft.dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dob)) {
      errs.dob = "Date must be in YYYY-MM-DD format.";
    } else {
      const parsed = new Date(draft.dob);
      const today  = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(parsed.getTime())) {
        errs.dob = "Please enter a valid date.";
      } else if (parsed >= today) {
        errs.dob = "Date of birth must be in the past.";
      }
    }
  }

  return errs;
}

/* =======================
   Component
======================= */

const GENDER_OPTIONS = ["male", "female", "other"] as const;

function ProfileCard({
  profile,
  loading = false,
  onEdit,
  errors,
  clearErrors,
  serverError,
}: ProfileCardProps) {
  const [isEditing,   setIsEditing]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [draft,       setDraft]       = useState<Profile | null>(profile ?? null);
  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof Profile, string>>>({});
  const { open } = useModalStore();
  const profileT = useTranslations("profile");
  const t        = useTranslations();

  /* Sync profile → draft only when NOT editing */
  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const isDirty = useMemo(() => {
    if (!profile || !draft) return false;
    return !isEqual(profile, draft);
  }, [profile, draft]);

  if (loading) return <ProfileCardSkeleton />;
  if (!draft)  return null;

  /* Merged errors: server-side field errors take precedence over local ones */
  const mergedErrors: Partial<Record<keyof Profile, string>> = {
    ...localErrors,
    ...errors,
  };

  const handleChange = (key: keyof Profile, value: string) => {
    let formattedValue = value;
    if (key === "dob") formattedValue = formatDOBInput(value);

    setDraft((prev) => (prev ? { ...prev, [key]: formattedValue } : prev));

    // clear both local and server errors for this field
    setLocalErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    clearErrors?.(key);
  };

  const handleGenderChange = (_: React.SyntheticEvent | null, value: string | null) => {
    if (value === null) return;
    setDraft((prev) => (prev ? { ...prev, gender: value } : prev));
    setLocalErrors((prev) => { const n = { ...prev }; delete n.gender; return n; });
    clearErrors?.("gender");
  };

  const handleSave = async () => {
    if (!draft || !profile || !onEdit) return;
    if (!isDirty) {
      setIsEditing(false);
      return;
    }

    // Client-side validation first
    const validationErrors = validate(draft);
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    try {
      setIsSaving(true);
      await onEdit(draft);
      setIsEditing(false);
      setLocalErrors({});
      await trackEvent("Profile Updated", {
        updated_fields: Object.keys(draft).filter(
          (k) => (draft as Record<string, unknown>)[k] !== (profile as Record<string, unknown>)[k],
        ),
      });
    } catch {
      // Errors are surfaced via `errors` / `serverError` props from ProfileWrap.
      // Stay in edit mode so the user can fix and retry.
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(profile ?? null);
    setLocalErrors({});
    clearErrors?.();
    setIsEditing(false);
  };

  return (
    <div className="w-full h-full md:bg-white p-1 md:p-5 rounded-lg">
      {/* Server / general error banner */}
      {serverError && isEditing && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex md:flex-row flex-col gap-6 md:gap-3">
        {/* Fields */}
        <div className="flex-1 flex flex-col gap-4">
          {FIELD_CONFIG.map(({ key, placeholder }) => {
            const value = String(draft[key] ?? "");
            const error = mergedErrors[key];

            return (
              <div key={key}>
                <p className="body-medium !font-normal text-surface-gray-muted mb-1">
                  {profileT(`personalDetails.${key}`)}
                </p>

                {isEditing ? (
                  <>
                    {key === "gender" ? (
                      <Select
                        size="md"
                        value={draft.gender || ""}
                        placeholder={placeholder}
                        color={error ? "danger" : "neutral"}
                        onChange={handleGenderChange}
                      >
                        {GENDER_OPTIONS.map((opt) => (
                          <Option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        readOnly={key === "phone"}
                        size="md"
                        value={value}
                        placeholder={placeholder}
                        error={Boolean(error)}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    )}

                    {error && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle size={12} className="shrink-0" />
                        {error}
                      </p>
                    )}
                  </>
                ) : (
                  <h5 className="body-large !font-semibold text-surface-gray-subtle">
                    {value ? (
                      key === "gender" ? (
                        value.charAt(0).toUpperCase() + value.slice(1)
                      ) : (
                        value
                      )
                    ) : (
                      <Button
                        sx={{ borderRadius: "50px" }}
                        size="sm"
                        variant="outlined"
                        startDecorator={<PencilLineIcon size={16} />}
                        onClick={() => setIsEditing(true)}
                      >
                        {t("actions.add")}
                      </Button>
                    )}
                  </h5>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-start justify-end">
          {!isEditing ? (
            <div className="flex gap-2 items-center">
              <Button
                sx={{ borderRadius: "50px" }}
                size="sm"
                color="danger"
                variant="outlined"
                startDecorator={<PencilLineIcon size={16} />}
                onClick={() => open("account-delete")}
              >
                {t("actions.delete")}
              </Button>
              <Button
                sx={{ borderRadius: "50px" }}
                size="sm"
                variant="outlined"
                startDecorator={<PencilLineIcon size={16} />}
                onClick={async () => {
                  await trackEvent("Profile Edit Started", { section_edited: "personal_details" });
                  setIsEditing(true);
                }}
              >
                {t("actions.edit")}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                sx={{ borderRadius: "50px" }}
                startDecorator={<Check size={16} />}
                loading={isSaving}
                disabled={!isDirty || isSaving}
                onClick={handleSave}
              >
                {t("actions.save")}
              </Button>
              <Button
                size="sm"
                sx={{ borderRadius: "50px" }}
                color="neutral"
                startDecorator={<X size={16} />}
                disabled={isSaving}
                onClick={handleCancel}
              >
                {t("actions.cancel")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================
   Skeleton
======================= */

function ProfileCardSkeleton() {
  return (
    <div className="w-full h-full bg-white p-4 rounded-lg space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton variant="circular" width={44} height={44} />
        <Skeleton variant="rectangular" width={70} height={32} />
      </div>

      <div className="flex gap-2 flex-col">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="rectangular" width={"15%"} height={18} />
            <Skeleton variant="rectangular" width={"50%"} height={32} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ProfileCard);
