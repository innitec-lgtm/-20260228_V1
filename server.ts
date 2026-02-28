import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Ticket, Engineer, Contact } from "./types";
import { DEFAULT_CONTACTS, DEFAULT_ENGINEERS } from "./constants";

const DATA_DIR = path.join(process.cwd(), "data");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");
const ENGINEERS_FILE = path.join(DATA_DIR, "engineers.json");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

function loadData<T>(filePath: string, defaultValue: T): T {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.error(`Failed to load ${filePath}`, e);
    }
  }
  return defaultValue;
}

function saveData(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Force no-cache for all requests to prevent "old version" issues in Shared URL
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Load initial state
  let tickets: Ticket[] = loadData(TICKETS_FILE, []);
  let engineers: Engineer[] = loadData(ENGINEERS_FILE, [...DEFAULT_ENGINEERS]);
  let contacts: Contact[] = loadData(CONTACTS_FILE, [...DEFAULT_CONTACTS]);

  // API Routes
  app.get("/api/tickets", (req, res) => {
    console.log("GET /api/tickets - Count:", tickets.length);
    res.json(tickets);
  });

  app.post("/api/tickets", (req, res) => {
    const ticket = req.body;
    console.log("POST /api/tickets - New ticket ID:", ticket.id);
    tickets.push(ticket);
    saveData(TICKETS_FILE, tickets);
    io.emit("tickets:updated", tickets);
    res.status(201).json(ticket);
  });

  app.put("/api/tickets/:id", (req, res) => {
    const { id } = req.params;
    const updatedTicket = req.body;
    console.log("PUT /api/tickets - Updating ID:", id);
    tickets = tickets.map(t => t.id === id ? updatedTicket : t);
    saveData(TICKETS_FILE, tickets);
    io.emit("tickets:updated", tickets);
    res.json(updatedTicket);
  });

  app.delete("/api/tickets/:id", (req, res) => {
    const { id } = req.params;
    console.log("DELETE /api/tickets - Deleting ID:", id);
    tickets = tickets.filter(t => t.id !== id);
    saveData(TICKETS_FILE, tickets);
    io.emit("tickets:updated", tickets);
    res.status(204).send();
  });

  app.get("/api/engineers", (req, res) => {
    res.json(engineers);
  });

  app.post("/api/engineers", (req, res) => {
    engineers = req.body;
    saveData(ENGINEERS_FILE, engineers);
    io.emit("engineers:updated", engineers);
    res.json(engineers);
  });

  app.get("/api/contacts", (req, res) => {
    res.json(contacts);
  });

  app.post("/api/contacts", (req, res) => {
    contacts = req.body;
    saveData(CONTACTS_FILE, contacts);
    io.emit("contacts:updated", contacts);
    res.json(contacts);
  });

  app.get("/api/config", (req, res) => {
    console.log("API Config requested - Version 2.5.0");
    res.json({
      appUrl: process.env.APP_URL || "",
      sharedAppUrl: process.env.SHARED_APP_URL || "",
      version: "2.5.0",
      env: process.env.NODE_ENV || "development",
      timestamp: new Date().getTime()
    });
  });

  app.get("/status", (req, res) => {
    res.json({
      status: "online",
      version: "2.5.0",
      time: new Date().toISOString()
    });
  });

  // Always use Vite middleware in this environment to ensure latest code
  console.log("Starting Vite middleware for latest code (Version 2.5.0)");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  // Socket.io connection
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Send initial state
    socket.emit("tickets:updated", tickets);
    socket.emit("engineers:updated", engineers);
    socket.emit("contacts:updated", contacts);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
