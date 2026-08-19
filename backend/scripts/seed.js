import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Doctor from "./models/Doctor.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
];

const doctorSeeds = [
  {
    name: "Dr. Sarah Johnson",
    email: "sarah@example.com",
    password: "doctor123",
    phone: "+1 555 101 0001",
    gender: "Female",
    specialization: "General Physician",
    education: "MD, Internal Medicine - Harvard Medical School",
    experience: 15,
    fees: 1500,
    location: "New York",
    hospital: "City General Hospital",
    address: "100 Health Street, New York, NY",
    about:
      "Experienced general physician focused on preventive care and chronic disease management for patients of all ages.",
    languages: ["English", "Spanish"],
    availableDays: DAYS.slice(0, 5),
    availableSlots: SLOTS,
    workingHours: { start: "09:00", end: "17:00" },
    appointmentDuration: 30,
    rating: 4.8,
    reviews: 127,
    isAvailable: true,
    isOnline: true,
  },
  {
    name: "Dr. Michael Chen",
    email: "michael@example.com",
    password: "doctor123",
    phone: "+1 555 101 0002",
    gender: "Male",
    specialization: "Cardiologist",
    education: "MD, Cardiology - Johns Hopkins University",
    experience: 20,
    fees: 2000,
    location: "Boston",
    hospital: "HeartCare Medical Center",
    address: "220 Heart Ave, Boston, MA",
    about:
      "Board-certified cardiologist specializing in heart disease prevention, arrhythmia management, and cardiac rehabilitation.",
    languages: ["English", "Mandarin"],
    availableDays: DAYS.slice(1, 6),
    availableSlots: SLOTS.slice(0, 6),
    workingHours: { start: "09:00", end: "17:00" },
    appointmentDuration: 30,
    rating: 4.9,
    reviews: 210,
    isAvailable: true,
    isOnline: true,
  },
  {
    name: "Dr. Priya Patel",
    email: "priya@example.com",
    password: "doctor123",
    phone: "+1 555 101 0003",
    gender: "Female",
    specialization: "Pediatrician",
    education: "MD, Pediatrics - Stanford University",
    experience: 12,
    fees: 1600,
    location: "San Francisco",
    hospital: "Children's Wellness Clinic",
    address: "55 Kid Care Lane, San Francisco, CA",
    about:
      "Caring pediatrician dedicated to child health, vaccinations, growth monitoring, and developmental assessments.",
    languages: ["English", "Hindi"],
    availableDays: DAYS.slice(0, 6),
    availableSlots: SLOTS,
    workingHours: { start: "09:00", end: "17:00" },
    appointmentDuration: 30,
    rating: 4.7,
    reviews: 98,
    isAvailable: true,
    isOnline: false,
  },
  {
    name: "Dr. James Wilson",
    email: "james@example.com",
    password: "doctor123",
    phone: "+1 555 101 0004",
    gender: "Male",
    specialization: "Orthopedic Surgeon",
    education: "MS, Orthopedic Surgery - Mayo Clinic",
    experience: 18,
    fees: 1800,
    location: "Chicago",
    hospital: "OrthoPlus Institute",
    address: "310 Bone Way, Chicago, IL",
    about:
      "Orthopedic surgeon with expertise in sports injuries, joint replacement, and minimally invasive procedures.",
    languages: ["English"],
    availableDays: DAYS.slice(2, 7),
    availableSlots: SLOTS.slice(1, 7),
    workingHours: { start: "09:00", end: "17:00" },
    appointmentDuration: 30,
    rating: 4.6,
    reviews: 150,
    isAvailable: true,
    isOnline: false,
  },
];

const seed = async () => {
  try {
    await connectDB();

    let patient = await User.findOne({ email: "patient@example.com" });
    if (!patient) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash("patient123", salt);
      patient = await User.create({
        name: "John Demo",
        email: "patient@example.com",
        password: hashed,
        phone: "+1 555 000 1234",
        dob: "1990-06-15",
        gender: "Male",
        address: "77 Demo Street, Austin, TX",
        role: "user",
      });
      console.log("Created demo patient:", patient.email, "/ patient123");
    } else {
      console.log("Demo patient already exists:", patient.email);
    }

    let created = 0;
    for (const doc of doctorSeeds) {
      const exists = await Doctor.findOne({ email: doc.email });
      if (!exists) {
        const salt = await bcrypt.genSalt(10);
        doc.password = await bcrypt.hash(doc.password, salt);
        await Doctor.create(doc);
        created++;
        console.log(`Created doctor: ${doc.name} (${doc.email} / doctor123)`);
      } else {
        console.log(`Doctor already exists: ${doc.name}`);
      }
    }

    const doctorCount = await Doctor.countDocuments();
    console.log(`\nDone. Total doctors in DB: ${doctorCount}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
