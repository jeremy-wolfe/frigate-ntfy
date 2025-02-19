import {readFile} from 'node:fs/promises';
import {parse} from 'yaml';

export interface MqttConfig {
	readonly host: string;
	readonly port: string | number;
	readonly username?: string;
	readonly password?: string;
	readonly topics?: string[];
}

export type NtfyAuth = {
	readonly token: string;
} | {
	readonly username: string;
	readonly password: string;
}

export interface NtfyConfig {
	readonly url: string;
	readonly topic?: string;
	readonly auth?: NtfyAuth;
}

export type FrigateSeverity = 'detection' | 'alert';

export const frigateFilterNames = ['severity', 'zone', 'camera', 'object'] as const;
export type FrigateFilterName = (typeof frigateFilterNames)[number];

export interface FrigateFilters extends Partial<Readonly<Record<FrigateFilterName, string[]>>> {
	readonly severity?: FrigateSeverity[];
}

export interface FrigateConfig {
	readonly localUrl: string;
	readonly publicUrl: string;
	readonly filters?: FrigateFilters;
}

export interface ConfigFile {
	readonly $schema?: string;
	readonly locale?: string;
	readonly timezone?: string;
	readonly mqtt: Readonly<MqttConfig>;
	readonly ntfy: Readonly<NtfyConfig>;
	readonly frigate: Readonly<FrigateConfig>;
}

export class Config {
	public readonly locale: string;
	public readonly timezone: string;
	public readonly mqtt: MqttConfig & {
		readonly port: number;
		readonly topics: string[];
	};
	public readonly ntfy: NtfyConfig;
	public readonly frigate: FrigateConfig & {
		readonly filters: FrigateFilters & {readonly severity: FrigateSeverity[]};
	};

	constructor({locale, timezone, mqtt, ntfy, frigate}: ConfigFile) {
		this.locale = this.parse(locale) || 'en-US';
		this.timezone = this.parse(timezone) || 'UTC';
		this.mqtt = {
			host: this.parse(mqtt.host),
			port: typeof mqtt.port === 'string' ? parseInt(this.parse(mqtt.port)) : mqtt.port,
			username: this.parse(mqtt.username),
			password: this.parse(mqtt.password),
			topics: mqtt.topics?.map(this.parse) || ['frigate/reviews']
		};
		this.ntfy = {
			url: this.parse(ntfy.url),
			topic: this.parse(ntfy.topic),
			auth: ntfy.auth && ('token' in ntfy.auth ? {
				token: this.parse(ntfy.auth.token)
			} : {
				username: this.parse(ntfy.auth.username),
				password: this.parse(ntfy.auth.password)
			})
		};
		this.frigate = {
			localUrl: this.parse(frigate.localUrl).replace(/\/$/, ''),
			publicUrl: this.parse(frigate.publicUrl).replace(/\/$/, ''),
			filters: {
				severity: frigate.filters?.severity?.map(this.parse) as FrigateSeverity[] || ['alert'],
				zone: frigate.filters?.zone?.map(this.parse),
				camera: frigate.filters?.camera?.map(this.parse),
				object: frigate.filters?.object?.map(this.parse)
			}
		};
	}
	
	public static async load(): Promise<Config> {
		const path = process.env.CONFIG_PATH || 'config.yml';
		const rawConfig = (await readFile(path)).toString();
		const configObject: ConfigFile = path.endsWith('.json') ? JSON.parse(rawConfig) : parse(rawConfig);
		return new Config(configObject);
	}

	private parse<T extends string | undefined>(value?: T): T {
		return value?.replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] || '').trim() as T;
	}
}
