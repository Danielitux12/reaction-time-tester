type ProfileEditorProps = {
  name: string;
  error: string | null;
  onChange: (value: string) => void;
};

export default function ProfileEditor({ name, error, onChange }: ProfileEditorProps) {
  return (
    <label className="profile-control">
      <span>PERFIL</span>
      <input
        value={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tu nombre"
        maxLength={20}
        aria-invalid={error !== null}
        aria-describedby="profile-error"
      />
      {error !== null && <small id="profile-error">{error}</small>}
    </label>
  );
}
