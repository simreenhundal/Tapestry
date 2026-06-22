import { useState } from "react";

// This represents one team member
type TeamMember = {
  id: number;
  name: string;
  city: string;
};

export default function Dashboard() {
  // useState stores a list of team members. It starts empty.
  const [members, setMembers] = useState<TeamMember[]>([]);

  // These store what the user is currently typing
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  // This runs when the manager clicks "Add Team Member"
  function addMember() {
    if (!name || !city) return; // do nothing if fields are empty

    const newMember: TeamMember = {
      id: Date.now(), // unique number based on current time
      name: name,
      city: city,
    };

    setMembers([...members, newMember]); // add to the list
    setName(""); // clear the name field
    setCity(""); // clear the city field
  }

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
        Team Context Dashboard
      </h1>
      <p style={{ color: "#666", marginBottom: "32px" }}>
        Add your team members to see their context.
      </p>

      {/* The form to add a new team member */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            flex: 1,
          }}
        />
        <input
          type="text"
          placeholder="City (e.g. Toronto)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            flex: 1,
          }}
        />
        <button
          onClick={addMember}
          style={{
            padding: "10px 20px",
            background: "#1a2b4a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Add Team Member
        </button>
      </div>

      {/* Show a message if no members added yet */}
      {members.length === 0 && (
        <p style={{ color: "#999", textAlign: "center", marginTop: "60px" }}>
          No team members yet. Add someone above.
        </p>
      )}

      {/* Loop through members and show a card for each one */}
      <div style={{ display: "grid", gap: "16px" }}>
        {members.map((member) => (
          <div
            key={member.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "24px",
              background: "white",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px" }}>{member.name}</h2>
            <p style={{ margin: "4px 0 0", color: "#666" }}>{member.city}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
