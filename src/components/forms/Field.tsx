type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
};

export function Field({ label, name, type = "text", placeholder, required, defaultValue }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <input
        className="rounded-md border border-ink/15 bg-white px-3 py-2 outline-none ring-sage/30 transition focus:ring-4"
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export function TextAreaField({ label, name, placeholder, required }: Omit<FieldProps, "type">) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <textarea
        className="min-h-28 rounded-md border border-ink/15 bg-white px-3 py-2 outline-none ring-sage/30 transition focus:ring-4"
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
