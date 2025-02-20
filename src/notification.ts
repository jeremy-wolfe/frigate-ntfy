import chalk, {ColorName} from 'chalk';
import type {Gateway} from './gateway.js';
import type {FrigateEventDetails, FrigateReviewDetails} from './frigate.js';
import {FrigateFilterName, frigateFilterNames, FrigateFilters} from './config.js';

class FilterStatus<T extends FrigateFilterName> {
	public readonly value: boolean;

	constructor(notification: Notification<any>, public readonly name: T) {
		this.value = notification[`${this.name}Ok`];
	}

	public get statusLog(): string {
		const text = this.name.substring(0, 3).toUpperCase();
		return this.value ? chalk.cyan(text) : chalk.strikethrough.gray(text);
	}
}

export function f(value: string, color?: ColorName): string {
	if (color) return chalk[color](`[${value}]`);
	return `[${value}]`;
}

interface FilterStatusResult {
	statuses: FilterStatus<any>[];
	value: boolean;
	statusLog: string;
}

export abstract class Notification<T extends FrigateReviewDetails | FrigateEventDetails> {
	public readonly id: string;
	protected readonly timestamp: string;
	protected readonly filters: FrigateFilters;
	protected abstract readonly logColor: ColorName;
	protected abstract readonly logLabel: string;
	protected abstract get objects(): string[];
	public abstract get severityOk(): boolean;
	public abstract get cameraOk(): boolean;
	public abstract get zoneOk(): boolean;
	public abstract get objectOk(): boolean;

	constructor(
		public readonly gateway: Gateway,
		protected readonly payload: T
	) {
		const {config} = this.gateway;
		const {start_time} = this.payload;
		this.id = this.payload.id;
		this.timestamp = (new Date(start_time * 1000)).toLocaleString(config.locale, {
			timeZone: config.timezone,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			month: '2-digit',
			day: '2-digit',
			year: 'numeric'
		});
		this.filters = config.frigate.filters;
	}

	protected toTitle(value: string): string {
		return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
	}

	protected log(flags: string[], message?: string): void {
		console.log( [
			chalk[this.logColor](this.payload.id.padEnd(25)),
			this.timestamp,
			f(this.logLabel, this.logColor) + flags.join(''),
			this.objectList, '|', this.toTitle(this.payload.camera),
			message || ''
		].join(' '));
	}

	protected get objectList(): string {
		return this.objects.map((object) => this.toTitle(object)).join(', ');
	}

	protected get title(): string {
		return `${this.objectList} found on ${this.toTitle(this.payload.camera)} camera`;
	}

	protected get allOk(): FilterStatusResult {
		const statuses = frigateFilterNames.map((name) => new FilterStatus(this, name));
		return {
			statuses,
			value: statuses.every(({value}) => value),
			statusLog: `[${statuses.map(({statusLog}) => statusLog).join(' ')}]`
		};
	}
}
