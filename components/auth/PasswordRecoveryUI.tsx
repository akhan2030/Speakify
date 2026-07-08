import Link from "next/link";

export function AuthCardShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-xl sm:px-10">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-[#c9972c]" />
          <div className="mt-3 text-xl font-extrabold text-[#0d1b35]">Speakify</div>
          <div className="text-xs text-slate-500">Global Language Center</div>
        </div>

        {title ? (
          <h1 className="mt-6 text-center text-xl font-bold text-[#0d1b35]">{title}</h1>
        ) : null}
        {subtitle ? (
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">{subtitle}</p>
        ) : null}

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function AuthBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 text-sm text-slate-500 hover:text-[#0d1b35]"
    >
      ← Back
    </button>
  );
}

export function AuthPrimaryButton({
  children,
  disabled,
  loading,
  onClick,
  className = "bg-[#0d1b35] text-white",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function AuthSignInLink() {
  return (
    <p className="mt-6 text-center text-sm text-slate-500">
      Remember your password?{" "}
      <Link href="/login" className="font-semibold text-[#0d9488] hover:underline">
        Sign in
      </Link>
    </p>
  );
}

function passwordStrengthLabel(password: string): string {
  if (!password) return "";
  if (password.length < 6) return "Too short";
  if (password.length < 8) return "Weak";
  if (password.length < 12) return "Good";
  return "Strong";
}

export function SetNewPasswordForm({
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  error,
  loading,
  onSubmit,
  submitLabel = "Set new password →",
}: {
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  error?: string;
  loading?: boolean;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const canSubmit =
    newPassword.length >= 8 && confirmPassword.length >= 8 && newPassword === confirmPassword;
  const strength = passwordStrengthLabel(newPassword);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">New password</label>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => onNewPasswordChange(e.target.value)}
        placeholder="Minimum 8 characters"
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
      />

      <label className="mt-4 block text-sm font-medium text-slate-700">Confirm new password</label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        placeholder="Re-enter your password"
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
      />

      <div className="mt-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded ${
                newPassword.length >= level * 2
                  ? level <= 1
                    ? "bg-red-400"
                    : level <= 2
                      ? "bg-[#c9972c]"
                      : "bg-[#0d9488]"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        {strength ? <p className="mt-1 text-xs text-slate-500">{strength}</p> : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4">
        <AuthPrimaryButton
          disabled={!canSubmit}
          loading={loading}
          onClick={onSubmit}
          className={canSubmit ? "bg-[#c9972c] text-[#0d1b35]" : "bg-slate-200 text-slate-500"}
        >
          {submitLabel}
        </AuthPrimaryButton>
      </div>
    </div>
  );
}

export function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(-1);
            const next = value.split("");
            next[index] = val;
            onChange(next.join("").slice(0, 6));
            if (val && index < 5) {
              document.getElementById(`otp-${index + 1}`)?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digit.trim() && index > 0) {
              document.getElementById(`otp-${index - 1}`)?.focus();
            }
          }}
          className="h-14 w-12 rounded-lg border-2 border-slate-200 text-center text-2xl font-bold text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
        />
      ))}
    </div>
  );
}
