export interface NtfyEvent {
	topic?: string;
	message: string;
	title: string;
	tags?: string[];
	priority?: 1 | 2 | 3 | 4 | 5;
	actions?: BaseNtfyAction[];
	click?: string;
	attach?: string;
	markdown?: boolean;
	icon?: string;
	filename?: string;
	delay?: string;
	email?: string;
	call?: string;
}

export interface NtfyHeaders {
	'X-Message'?: string;
	'X-Title'?: string;
	'X-Tags'?: string;
	'X-Priority'?: string;
	'X-Actions'?: string;
	'X-Click'?: string;
	'X-Attach'?: string;
	'X-Markdown'?: string;
	'X-Icon'?: string;
	'X-Filename'?: string;
	'X-Delay'?: string;
	'X-Email'?: string;
	'X-Call'?: string;
	'X-Cache'?: string;
	'X-Firebase'?: string;
	'X-UnifiedPush'?: string;
	'X-Poll-ID'?: string;
	'Authorization'?: string;
	'Content-Type'?: string;
}

interface BaseNtfyAction {
	readonly action: 'view' | 'broadcast' | 'http';
	readonly label: string;
	readonly clear?: boolean;
	toJSON(): any;
}

export class NtfyViewAction implements BaseNtfyAction {
	public readonly action = 'view';

	constructor(public readonly label: string, public readonly url: string, public readonly clear?: boolean) {}

	public toJSON() {
		return this;
	}
}

interface NtfyBroadcastOptions {
	readonly intent?: string;
	readonly extras?: Record<string, string>;
	readonly clear?: boolean;
}

export class NtfyBroadcastAction implements BaseNtfyAction {
	public readonly action = 'broadcast';

	constructor(public readonly label: string, public readonly options?: NtfyBroadcastOptions) {}

	public toJSON() {
		Object.assign({
			action: this.action,
			label: this.label
		}, this.options);
	}
}

interface NtfyHttpOptions {
	readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	readonly headers?: Record<string, string>;
	readonly body?: string;
	readonly clear?: boolean;
}

export class NtfyHttpAction implements BaseNtfyAction {
	public readonly action = 'http';

	constructor(public readonly label: string, public readonly url: string, public readonly options?: NtfyHttpOptions) {}

	public toJSON() {
		Object.assign({
			action: this.action,
			label: this.label,
			url: this.url
		}, this.options);
	}
}
