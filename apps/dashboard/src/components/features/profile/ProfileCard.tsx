import React, { ComponentType, memo, useEffect, useMemo, useState } from "react";
import { Button } from "@clearcut/ui/button";
import { Input } from "@clearcut/ui/input";
import { Select, SelectOption } from "@clearcut/ui/select";
import Skeleton from "@clearcut/ui/skeleton";
import { PencilLineIcon, Check, X, AlertCircle, UsersRound, Plus, Trash2 } from "lucide-react";
import { CalendarIcon, EmailIcon, PhoneIcon, ProfileIcon } from "@/components/ui/icons";
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

/**
 * `icon` and `wide` drive the read-only tile grid the design shows; the edit
 * form ignores both. Icons are the closest existing ones — Calendar/Email/Phone
 * are exact, Name reuses ProfileIcon, and Gender falls back to lucide (the
 * icon ladder's last step) since no gender glyph exists in either icon set.
 */
const FIELD_CONFIG = [
  { key: "name",   label: "Name",          required: true,  placeholder: "John Doe",         icon: ProfileIcon,  wide: false },
  { key: "gender", label: "Gender",         required: true,  placeholder: "Select gender",    icon: UsersRound,   wide: false },
  { key: "dob",    label: "Date of birth",  required: true,  placeholder: "YYYY-MM-DD",       icon: CalendarIcon, wide: false },
  { key: "email",  label: "Email",          required: true,  placeholder: "john@example.com", icon: EmailIcon,    wide: false },
  { key: "phone",  label: "Phone",          required: false, placeholder: "1234567890",       icon: PhoneIcon,    wide: true  },
] as const satisfies readonly {
  key: keyof Profile;
  label: string;
  required: boolean;
  placeholder: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Spans both grid columns in the read-only view. */
  wide: boolean;
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

  // Joy's Select passed (event, value); the shared Select passes the value only.
  // The null guard is kept because the shared Select's contract still allows an
  // empty string for "no selection", and clearing must not write `null` into the
  // draft. Behaviour is otherwise unchanged.
  const handleGenderChange = (value: string | null) => {
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

  // Same two actions and the same handlers as before — only the labels changed
  // to the design's "Delete Account" / "Edit Details", and they moved into the
  // pane heading.
  const actionButtons = (
    <div className="flex gap-2 items-center">
      <Button
        sx={{ borderRadius: "50px" }}
        size="sm"
        color="danger"
        variant="outlined"
        startDecorator={<Trash2 size={16} />}
        onClick={() => open("account-delete")}
      >
        {t("actions.deleteAccount")}
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
        {t("actions.editDetails")}
      </Button>
    </div>
  );

  return (
    <div className="w-full h-full md:bg-white p-1 md:p-5 rounded-lg">
      {/* Server / general error banner */}
      {serverError && isEditing && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Pane heading + actions. Read-only only: in edit mode the form is the
          whole subject of the pane and the Save/Cancel pair sits with it. */}
      {!isEditing && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="heading-large !font-semibold text-surface-gray-normal">
                {profileT("personalDetails.paneTitle")}
              </p>
              <p className="body-small !font-normal text-surface-gray-muted">
                {profileT("personalDetails.paneSubtitle")}
              </p>
            </div>
            {actionButtons}
          </div>

          {/* Identity summary */}
          <div className="mt-5 flex flex-col items-center gap-4 rounded-xl bg-[var(--color-background-gray-subtle)] p-5 text-center sm:flex-row sm:text-left sm:gap-6">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <ProfileIcon size={44} variant="person" color="white" />
            </span>
            <span className="min-w-0">
              <span className="heading-large !font-semibold block truncate text-surface-gray-normal">
                {draft.name || profileT("personalDetails.notAdded")}
              </span>
              {draft.phone ? (
                <span className="body-medium !font-normal block truncate text-surface-gray-muted">
                  {draft.phone}
                </span>
              ) : null}
              {draft.email ? (
                <span className="body-medium !font-normal block truncate text-surface-gray-muted">
                  {draft.email}
                </span>
              ) : null}
            </span>
          </div>

          <div className="mt-6">
            <p className="heading-medium !font-semibold text-surface-gray-normal">
              {profileT("personalDetails.basicInfo")}
            </p>
            <p className="body-small !font-normal text-surface-gray-muted">
              {profileT("personalDetails.basicInfoSubtitle")}
            </p>
          </div>
        </>
      )}

      <div className="flex md:flex-row flex-col gap-6 md:gap-3">
        {/* Fields — a tile grid when reading, the original stacked form when editing. */}
        <div
          className={
            isEditing
              ? "flex-1 flex flex-col gap-4"
              : "mt-4 flex-1 grid gap-3 md:grid-cols-2"
          }
        >
          {FIELD_CONFIG.map(({ key, placeholder, icon: Icon, wide }) => {
            const value = String(draft[key] ?? "");
            const error = mergedErrors[key];

            if (!isEditing) {
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 rounded-xl bg-[var(--color-background-gray-subtle)] p-4 ${
                    wide ? "md:col-span-2" : ""
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                    <Icon size={20} color="var(--color-brand)" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="body-small !font-normal block text-surface-gray-muted">
                      {profileT(`personalDetails.${key}`)}
                    </span>
                    <span className="body-large !font-semibold block truncate text-surface-gray-normal">
                      {value
                        ? key === "gender"
                          ? value.charAt(0).toUpperCase() + value.slice(1)
                          : value
                        : profileT("personalDetails.notAdded")}
                    </span>
                  </span>

                  {!value && (
                    <Button
                      sx={{ borderRadius: "50px" }}
                      size="sm"
                      variant="outlined"
                      startDecorator={<Plus size={16} />}
                      onClick={() => setIsEditing(true)}
                    >
                      {t("actions.add")}
                    </Button>
                  )}
                </div>
              );
            }

            return (
              <div key={key}>
                <p className="body-medium !font-normal text-surface-gray-muted mb-1">
                  {profileT(`personalDetails.${key}`)}
                </p>

                {isEditing ? (
                  <>
                    {key === "gender" ? (
                      // `size="md"` is dropped because md is the only size the
                      // repository used and the shared Select bakes those exact
                      // measured metrics in (36px / 3px 12px / radius 6px) rather
                      // than exposing an unused size axis. `color` becomes the
                      // boolean `error`, which maps to the same measured danger
                      // border rgb(217,45,32) and text rgb(145,32,24).
                      <Select
                        value={draft.gender || ""}
                        placeholder={placeholder}
                        error={Boolean(error)}
                        onValueChange={handleGenderChange}
                      >
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectOption key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </SelectOption>
                        ))}
                      </Select>
                    ) : (
                      // `size="md"` is dropped: the shared Input has a single
                      // geometry, and on a native <input> `size` is a *character
                      // count* attribute, so forwarding "md" would be both a type
                      // error and wrong semantics. Joy's `error` prop becomes
                      // `aria-invalid`, which the shared Input already styles
                      // (aria-invalid:border-destructive + ring) — so the error
                      // state is now announced to assistive tech as well as shown,
                      // rather than being colour-only.
                      <Input
                        readOnly={key === "phone"}
                        value={value}
                        placeholder={placeholder}
                        aria-invalid={Boolean(error) || undefined}
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
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Save / Cancel. The read-only Delete Account + Edit Details pair now
            sits in the pane heading above, where the design puts it. */}
        <div className="flex items-start justify-end">
          {isEditing && (
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
