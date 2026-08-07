export interface UserMetadata {
    tours?: {
        preparation_tour?: boolean;
        [key: string]: any; // in case you add more metadata later
    };
    [key: string]: any;
}

export interface User {
    id: number;                // API returns numeric ID
    uuid: string;
    user_id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    avatar: string | null;
    status: "active" | "inactive" | string; // can be extended
    gender: "male" | "female" | "other" | null;
    birthday: string | null; // ISO string
    email_verified_at: string | null; // ISO string
    metadata: UserMetadata;   // parsed object from JSON
    referral_code: string | null;
    referred_by: string | null;
    deleted_at: string | null;
    created_at: string;       // ISO string
    updated_at: string;       // ISO string
    roles?: string[];         // Spatie roles
    permissions?: string[];   // Spatie permissions
}

// Remove sensitive or unnecessary fields for frontend usage
export type SafeUser = Omit<User, "email_verified_at" | "deleted_at" | "password">;

// Pick only minimal info (useful for lists, previews, dropdowns, etc.)
export type UserPreview = Pick<User, "id" | "uuid" | "full_name" | "user_id" | "email" | "avatar" | "phone" | "gender" | "birthday" | "metadata" | "referral_code" | "referred_by" | "deleted_at" | "created_at" | "updated_at">;

// Data allowed for update (PATCH requests)
export type UpdateUserDto = Partial<Omit<User, "id" | "uuid" | "user_id" | "created_at" | "updated_at">>;

// Full user type (all fields required, mostly for backend)
export type FullUser = Required<User>;
