export default function SearchBar({ value, onChange, onSubmit }) {
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        type="text"
        placeholder="Search for a title… (searches as you type)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}
