// app/api/handle-record/route.ts
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

async function dbConnect() {
	if (cached.conn) return cached.conn;
	if (!cached.promise) {
		cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
	}
	cached.conn = await cached.promise;
	return cached.conn;
}

const RecordSchema = new mongoose.Schema({
	subjectId: { type: String, required: true },
	heartRate: { bpm: Number, confidence: Number },
	hrv: { sdnn: Number, confidence: Number },
	timestamp: { type: Date, default: Date.now },
});

const Record = mongoose.models.Record || mongoose.model("Record", RecordSchema);

// POST Handler
export async function POST(request: Request) {
	try {
		await dbConnect();
		const body = await request.json();
		const newRecord = await Record.create(body);
		return NextResponse.json(
			{ success: true, data: newRecord },
			{ status: 201 }
		);
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 400 }
		);
	}
}

// GET Handler
export async function GET(request: Request) {
	try {
		await dbConnect();

		// Extract subjectId from query parameters
		const url = new URL(request.url);
		const subjectId = url.searchParams.get("subjectId");

		if (!subjectId) {
			return NextResponse.json(
				{ success: false, error: "Missing subjectId in query parameters" },
				{ status: 400 }
			);
		}

		// Aggregate historical data using MongoDB aggregation pipeline
		const pipeline = [
			{
				$match: { subjectId }, // Filter records by subjectId
			},
			{
				$group: {
					_id: null,
					avgHeartRate: { $avg: "$heartRate.bpm" },
					avgHRV: { $avg: "$hrv.sdnn" },
				},
			},
		];

		const result = await Record.aggregate(pipeline);

		if (!result.length) {
			// Return default values if no data exists for the subjectId
			return NextResponse.json(
				{ success: true, avgHeartRate: 0, avgHRV: 0 },
				{ status: 200 }
			);
		}

		const { avgHeartRate, avgHRV } = result[0];
		return NextResponse.json(
			{ success: true, avgHeartRate, avgHRV },
			{ status: 200 }
		);
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
