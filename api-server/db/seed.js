import bcrypt from "bcryptjs";
import { pool } from "./connection.js";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing data
    await client.query("TRUNCATE notifications, votes, hazards, users RESTART IDENTITY CASCADE");

    const passwordHash = await bcrypt.hash("password123", 10);
    const adminHash = await bcrypt.hash("admin123", 10);

    const usersRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role) VALUES
        ('Alice Rahman', 'alice@example.com', $1, 'citizen'),
        ('Bob Islam', 'bob@example.com', $1, 'citizen'),
        ('City Admin', 'admin@safestreet.gov', $2, 'admin')
       RETURNING id, email`,
      [passwordHash, adminHash]
    );

    const alice = usersRes.rows.find((u) => u.email === "alice@example.com").id;
    const bob = usersRes.rows.find((u) => u.email === "bob@example.com").id;

    const hazards = [
      ["Large pothole on Main St", "Deep pothole causing traffic to swerve dangerously.", "pothole", "reported", 23.8103, 90.4125, "Main Street, Dhaka", alice],
      ["Streetlight out near park", "Streetlight has been dark for two weeks, unsafe at night.", "broken_streetlight", "in_progress", 23.8143, 90.4183, "Park Road, Dhaka", bob],
      ["Waterlogging after rain", "Road floods heavily after even light rain, blocking traffic.", "waterlogging", "reported", 23.8046, 90.4189, "Green Road, Dhaka", alice],
      ["Open manhole - urgent", "Uncovered manhole poses serious fall risk to pedestrians.", "open_manhole", "reported", 23.7925, 90.4078, "Mirpur Road, Dhaka", bob],
      ["Damaged road surface", "Large cracks and loose gravel across the lane.", "damaged_road", "resolved", 23.8223, 90.3654, "Uttara Sector 4, Dhaka", alice],
      ["Traffic signal not working", "Intersection signal stuck on red for all directions.", "traffic_signal_failure", "in_progress", 23.7806, 90.4193, "Dhanmondi 27, Dhaka", bob],
      ["Sinkhole forming near bus stop", "Ground sinking near the bus stop, could collapse further.", "other", "reported", 23.7461, 90.3742, "Jatrabari, Dhaka", alice],
      ["Multiple potholes on bridge approach", "Cluster of potholes making bridge approach hazardous for bikes.", "pothole", "resolved", 23.8759, 90.3795, "Uttara Bridge, Dhaka", bob]
    ];

    const hazardIds = [];
    for (const h of hazards) {
      const res = await client.query(
        `INSERT INTO hazards (title, description, category, status, latitude, longitude, address, reported_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        h
      );
      hazardIds.push(res.rows[0].id);
    }

    // Sample votes
    await client.query(
      `INSERT INTO votes (user_id, hazard_id) VALUES ($1,$2), ($3,$4), ($1,$4)`,
      [alice, hazardIds[1], bob, hazardIds[0]]
    );
    await client.query(
      `UPDATE hazards SET upvotes = (SELECT COUNT(*) FROM votes WHERE votes.hazard_id = hazards.id)`
    );

    // Sample notifications
    await client.query(
      `INSERT INTO notifications (user_id, message, is_read) VALUES
        ($1, 'Your report "Streetlight out near park" status changed to In Progress.', false),
        ($2, 'Your report "Damaged road surface" was marked Resolved.', true),
        ($1, 'Welcome to SafeStreet! Thanks for helping make our streets safer.', true)`,
      [bob, alice]
    );

    await client.query("COMMIT");
    console.log("✅ Seed data inserted successfully.");
    console.log("Demo accounts:");
    console.log("  Citizen: alice@example.com / password123");
    console.log("  Citizen: bob@example.com / password123");
    console.log("  Admin:   admin@safestreet.gov / admin123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
