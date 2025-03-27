// app/api/last-access/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
	throw new Error("MONGODB_URI not defined");
}

let cached = (global as any).mongoose;
if (!cached) {
	cached = (global as any).mongoose = { conn: null, promise: null };
}

const RecordSchema = new mongoose.Schema({
	subjectId: { type: String, required: true },
	heartRate: { bpm: Number, confidence: Number },
	hrv: { sdnn: Number, confidence: Number },
	timestamp: { type: Date, default: Date.now },
});

const Record = mongoose.models.Record || mongoose.model("Record", RecordSchema);

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const subjectId = searchParams.get("subjectId");

	if (!subjectId) {
		return NextResponse.json({ success: false, error: "Missing subjectId" });
	}

	try {
		const lastRecord = await Record.findOne({ subjectId }).sort({
			timestamp: -1,
		});
		if (!lastRecord) {
			return NextResponse.json({ success: false, error: "No records found" });
		}

		return NextResponse.json({
			success: true,
			lastAccess: lastRecord.timestamp,
		});
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
