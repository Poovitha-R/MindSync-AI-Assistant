import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/db.ts";
import { analyzeMoodJournal } from "./src/logic/mood.ts";
import { detectFatigue } from "./src/logic/fatigue.ts";
import { detectDistraction } from "./src/logic/distraction.ts";
import { generateRecommendation, getNudge } from "./src/logic/scheduler.ts";
import { sendChildReport } from "./src/logic/email.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // User Role and Mindset
  app.post("/api/user/init", (req, res) => {
    const { role, mindset } = req.body;
    const stmt = db.prepare('INSERT INTO users (role, mindset) VALUES (?, ?)');
    const result = stmt.run(role, mindset);
    res.json({ success: true, userId: result.lastInsertRowid });
  });

  // Task Saving
  app.post("/api/tasks/classify", async (req, res) => {
    const { tasks } = req.body; 
    
    try {
      // Save to DB
      if (Array.isArray(tasks)) {
        const stmt = db.prepare('INSERT INTO tasks (title, difficulty) VALUES (?, ?)');
        tasks.forEach((t: any) => stmt.run(t.title, t.difficulty));
      }
      
      res.json({ success: true, tasks: tasks || [] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save tasks" });
    }
  });

  // Mood Log
  app.post("/api/mood", (req, res) => {
    const { mood, intensity, journal, stress, happiness, focus, distraction_count } = req.body;
    const { sentiment, score } = analyzeMoodJournal(journal);
    
    const stmt = db.prepare('INSERT INTO mood_logs (mood, intensity, journal, stress, happiness, focus, distraction_count) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(mood, intensity, journal, stress || 0, happiness || 0, focus || 0, distraction_count || 0);
    
    res.json({ success: true, sentiment, score });
  });

  // Log Fatigue (Work Session)
  app.post("/api/fatigue", (req, res) => {
    const { work_duration } = req.body;
    const fatigue_level = detectFatigue(work_duration);
    
    const stmt = db.prepare('INSERT INTO fatigue_logs (work_duration, fatigue_level) VALUES (?, ?)');
    stmt.run(work_duration, fatigue_level);
    
    res.json({ success: true, fatigue_level });
  });

  // Log Distraction
  app.post("/api/distraction", (req, res) => {
    const { app_name, time_spent } = req.body;
    const distraction_level = detectDistraction(time_spent);
    
    const stmt = db.prepare('INSERT INTO distraction_logs (app_name, time_spent, distraction_level) VALUES (?, ?, ?)');
    stmt.run(app_name, time_spent, distraction_level);
    
    res.json({ success: true, distraction_level });
  });

  // Get Recommendations
  app.get("/api/recommendations", (req, res) => {
    // Get latest logs
    const mood = db.prepare('SELECT * FROM mood_logs ORDER BY timestamp DESC LIMIT 1').get() as any;
    const fatigue = db.prepare('SELECT * FROM fatigue_logs ORDER BY timestamp DESC LIMIT 1').get() as any;
    const distraction = db.prepare('SELECT * FROM distraction_logs ORDER BY timestamp DESC LIMIT 1').get() as any;
    
    const moodVal = mood?.mood || 'Neutral';
    const fatigueVal = fatigue?.fatigue_level || 'LOW';
    const distractionVal = distraction?.distraction_level || 'LOW';
    const socialTime = distraction?.time_spent || 0;
    
    const recommendation = generateRecommendation(moodVal, fatigueVal, distractionVal);
    const nudge = getNudge(moodVal, fatigueVal, distractionVal, socialTime);
    
    // Log recommendation
    const stmt = db.prepare('INSERT INTO task_recommendations (recommended_task, reason) VALUES (?, ?)');
    stmt.run(recommendation.task, recommendation.reason);
    
    res.json({ recommendation, nudge });
  });

  // Child Mode Report
  app.post("/api/child-report", async (req, res) => {
    const mood = db.prepare('SELECT * FROM mood_logs ORDER BY timestamp DESC LIMIT 1').get() as any;
    const fatigue = db.prepare('SELECT * FROM fatigue_logs ORDER BY timestamp DESC LIMIT 1').get() as any;
    const distraction = db.prepare('SELECT * FROM distraction_logs ORDER BY timestamp DESC LIMIT 1').get() as any;
    
    const report = {
      mood: mood?.mood || 'Unknown',
      intensity: mood?.intensity || 0,
      screenTime: distraction?.time_spent || 0,
      distraction: distraction?.distraction_level || 'LOW',
      fatigue: fatigue?.fatigue_level || 'LOW',
      timestamp: new Date().toISOString()
    };
    
    const result = await sendChildReport(report);
    res.json(result);
  });

  // Analytics Data
  app.get("/api/analytics", (req, res) => {
    const moodHistory = db.prepare('SELECT timestamp, intensity, stress, happiness, focus, distraction_count FROM mood_logs ORDER BY timestamp ASC LIMIT 20').all();
    const fatigueStats = db.prepare('SELECT fatigue_level, COUNT(*) as count FROM fatigue_logs GROUP BY fatigue_level').all();
    const distractionStats = db.prepare('SELECT distraction_level, COUNT(*) as count FROM distraction_logs GROUP BY distraction_level').all();
    const taskStats = db.prepare('SELECT difficulty, COUNT(*) as count FROM tasks GROUP BY difficulty').all();
    
    res.json({ moodHistory, fatigueStats, distractionStats, taskStats });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindSync Server running on http://localhost:${PORT}`);
  });
}

startServer();
