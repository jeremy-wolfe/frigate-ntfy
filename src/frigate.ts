import type {FrigateSeverity} from './config.js';

export interface FrigateReviewDetails {
	id: string;
	camera: string;
	start_time: number;
	end_time: number | null;
	severity: FrigateSeverity;
	thumb_path: string;
	data: {
		detections: string[];
		objects: string[];
		sub_labels: string[];
		zones: string[];
		audio: string[];
	};
}

export type FrigateReviewType = 'new' | 'update' | 'end';

export interface FrigateReview {
	type: FrigateReviewType;
	before: FrigateReviewDetails;
	after: FrigateReviewDetails;
}

export interface FrigateEventDetails {
	id: string;
	label: string;
	sub_label: string | null;
	camera: string;
	start_time: number;
	end_time: number | null;
	false_positive: boolean | null;
	zones: string[];
	thumbnail: string;
	has_clip: boolean;
	has_snapshot: boolean;
	retain_indefinitely: boolean;
	plus_id: string | null;
	model_hash: string;
	detector_type: string;
	model_type: string;
	data: {
		box: [number, number, number, number];
		region: [number, number, number, number];
		score: number;
		top_score: number;
		attributes: string[];
		type: string;
		max_severity: FrigateSeverity;
	};
}
