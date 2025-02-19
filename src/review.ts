import {Event} from './event.js';
import type {FrigateReview, FrigateReviewDetails, FrigateReviewType} from './frigate.js';
import type {Gateway} from './gateway.js';
import {Notification} from './notification.js';
import chalk from 'chalk';

export class Review extends Notification<FrigateReviewDetails> {
	protected readonly logLabel = chalk.magenta('[RVW]');
	private readonly type: FrigateReviewType;

	constructor(gateway: Gateway, public readonly mqttTopic: string, rawPayload: Buffer) {
		const frigateReview: FrigateReview = JSON.parse(rawPayload.toString());
		super(gateway, frigateReview.after);
		this.type = frigateReview.type;
	}

	public async evaluate(): Promise<void> {
		const {allOk, type} = this;
		const logType = chalk[type === 'new' ? 'green' : type === 'update' ? 'yellow' : 'red'](`[${type.substring(0,3).toUpperCase()}]`);
		this.log(chalk.yellow('[EVL]'), `${logType}: ${chalk.blue(allOk.statusLog)}`);
		if (allOk.value) await Promise.all(this.payload.data.detections.map(async (eventId) => (await Event.load(this, eventId)).evaluate()));
		if (type === 'end') for (const [, event] of this.gateway.events) event.clear(this.id);
	}

	protected get objects(): string[] {
		return this.payload.data.objects;
	}

	public get severityOk(): boolean {
		return !this.filters.severity || this.filters.severity.includes(this.payload.severity);
	}

	public get cameraOk(): boolean {
		return !this.filters.camera || this.filters.camera.includes(this.payload.camera);
	}

	public get zoneOk(): boolean {
		return !this.filters.zone || this.filters.zone.some((zone) => this.payload.data.zones.includes(zone));
	}

	public get objectOk(): boolean {
		return !this.filters.object || this.filters.object.some((object) => this.payload.data.objects.includes(object));
	}
}
