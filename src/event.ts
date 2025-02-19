import chalk from 'chalk';
import type {FrigateEventDetails} from './frigate.js';
import {Notification} from './notification.js';
import type {Review} from './review.js';
import type {NtfyEvent, NtfyHeaders} from './ntfy.js';

export class Event extends Notification<FrigateEventDetails> {
	protected readonly logLabel = chalk.blue('[EVT]');

	constructor(private readonly review: Review, payload: FrigateEventDetails) {
		super(review.gateway, payload);
	}

	public static async load(review: Review, id: string): Promise<Event> {
		const {localUrl} = review.gateway.config.frigate;
		const payload: FrigateEventDetails = await (await fetch(`${localUrl}/api/events/${id}`)).json();
		return new Event(review, payload);
	}

	public clear(reviewId: string): void {
		if (!this.gateway.events.has(this.id)) return;
		if (reviewId !== this.review.id) return;
		this.log(chalk.gray('[CLR]'));
		this.gateway.events.delete(this.id);
	}

	public async evaluate(): Promise<void> {
		const {events} = this.review.gateway;
		if (events.has(this.id)) return;

		const {allOk} = this;
		this.log(chalk.yellow('[EVL]'), `: ${chalk.blue(allOk.statusLog)}`);
		if (allOk.value) this.push();
	}

	private async push(): Promise<void> {
		if (this.gateway.events.has(this.id)) return this.log(chalk.yellow('[DUP]'));
		this.gateway.events.set(this.id, this);

		const {url, auth} = this.gateway.config.ntfy;
		const {ntfyHeaders, topic} = this;

		if (auth) {
			if ('token' in auth) {
				ntfyHeaders.Authorization = `Bearer ${auth.token}`;
			} else {
				ntfyHeaders.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`;
			}
		}

		const response = await fetch(`${url}/${topic}`, {
			method: 'PUT',
			headers: ntfyHeaders as Required<NtfyHeaders>,
			body: (await this.getSnapshot()) || undefined
		});

		this.log(chalk.green('[PSH]'), `: ${response.status} ${response.statusText}`);
	}

	private async getSnapshot(): Promise<Blob | void> {
		const {config} = this.gateway;
		const {has_snapshot} = this.payload;
		if (has_snapshot) try {
			const response = await fetch(`${config.frigate.localUrl}/api/events/${this.id}/snapshot.jpg`);
			return response.blob();
		} catch (error) {
			this.log(chalk.red('[ERR]'), `: Error fetching snapshot: ${(error as Error)?.message || error}`);
		}
	}

	private get topic(): string {
		return this.gateway.config.ntfy.topic || this.review.mqttTopic.replace(/[\/\.]+/g, '_');
	}

	private get ntfyData(): Pick<NtfyEvent, 'title' | 'message' | 'click' | 'actions'> {
		const {config} = this.gateway;
		const {zones, has_clip} = this.payload;
		const zoneList = zones.map((zone) => this.toTitle(zone)).join(', ');
		const message = [];

		if (this.timestamp) message.push(`Detected: ${this.timestamp}`);
		if (zoneList?.length) message.push(`Zone${zoneList.length > 1 ? 's' : ''}: ${zoneList}`);

		return {
			title: this.title,
			message: message.join('\n'),
			click: has_clip ? `${config.frigate.localUrl}/api/events/${this.id}/clip.mp4` : undefined,
			actions: []
		};
	}

	private get ntfyEvent(): NtfyEvent {
		const {ntfyData, topic} = this;
		return {topic, ...ntfyData};
	}

	private get ntfyHeaders(): NtfyHeaders {
		const {ntfyData} = this;
		return {
			'X-Title': ntfyData.title,
			'X-Message': ntfyData.message,
			'X-Click': ntfyData.click,
			'X-Actions': JSON.stringify(ntfyData.actions),
			'X-Filename': 'snapshot.jpg'
		};
	}

	public get objects(): string[] {
		const {label} = this.payload;
		const {top_score} = this.payload.data;
		return [`${label} (${Math.round(top_score * 100)}%)`];
	}

	public get severityOk(): boolean {
		return !this.filters.severity || this.gateway.config.frigate.filters.severity.includes(this.payload.data.max_severity);
	}

	public get cameraOk(): boolean {
		return !this.filters.camera || this.filters.camera.includes(this.payload.camera);
	}

	public get zoneOk(): boolean {
		return !this.filters.zone || this.filters.zone.some((zone) => this.payload!.zones.includes(zone));
	}

	public get objectOk(): boolean {
		return !this.filters.object || this.filters.object.includes(this.payload.label);
	}
}
