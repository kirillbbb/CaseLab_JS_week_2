const crypto = require("node:crypto");

const users = [
  { id: "50000000-0000-4000-8000-000000000001", email: "admin@example.com", role: "admin", password: "Admin123!" },
  { id: "50000000-0000-4000-8000-000000000002", email: "tech1@example.com", role: "technician", password: "Tech123!" },
  { id: "50000000-0000-4000-8000-000000000003", email: "tech2@example.com", role: "technician", password: "Tech123!" },
  { id: "50000000-0000-4000-8000-000000000004", email: "tech3@example.com", role: "technician", password: "Tech123!" },
  { id: "50000000-0000-4000-8000-000000000005", email: "tech4@example.com", role: "technician", password: "Tech123!" },
  { id: "50000000-0000-4000-8000-000000000006", email: "tech5@example.com", role: "technician", password: "Tech123!" },
  { id: "50000000-0000-4000-8000-000000000007", email: "viewer@example.com", role: "viewer", password: "Viewer123!" },
];

function hash(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

module.exports = {
  async up(q) {
    const now = new Date();

    for (const user of users) {
      const passwordHash = hash(user.password);
      await q.bulkInsert("users", [{
        id: user.id,
        email: user.email,
        password_hash: passwordHash,
        role: user.role,
        created_at: now,
        updated_at: now,
      }], { ignoreDuplicates: true });
    }

    for (let i = 0; i < 5; i += 1) {
      await q.sequelize.query(
        "UPDATE technicians SET user_id=:userId WHERE id=:techId",
        {
          replacements: {
            userId: users[i + 1].id,
            techId: `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
          },
        },
      );
    }
  },

  async down(q) {
    await q.bulkDelete("refresh_tokens", null, {});
    await q.bulkDelete("users", { id: users.map((u) => u.id) }, {});
  },
};
