import {connectAsync, MqttClient} from 'mqtt';
import {Config} from './config.js';
import {Review} from './review.js';
import chalk from 'chalk';
import type {Event} from './event.js';

export class Gateway {
	private client?: MqttClient;
	public readonly events: Map<string, Event> = new Map();

	constructor(public readonly config: Config) {}

	public static async load(): Promise<Gateway> {
		try {
			const config = await Config.load();
			return new Gateway(config);
		} catch (error) {
			this.prototype.error('loading config', error);
			process.exit(1);
		}
	}

	private error(action: string, error: any): void {
		console.error(chalk.red('Error %s: %s'), action, (error as Error)?.message || error);
	}

	private async onMessage(topic: string, rawPayload: Buffer): Promise<void> {
		const review = new Review(this, topic, rawPayload);
		await review.evaluate();
	}

	public async start(): Promise<void> {
		if (this.client) return;

		const {host, port, username, password, topics} = this.config.mqtt;
		console.log(chalk.cyan('Connecting to MQTT broker at ') + chalk.cyanBright('%s:%d'), host, port);

		try {
			this.client = await connectAsync({host, port, username, password});
			this.client.on('reconnect', () => console.log('Reconnecting to MQTT broker'));
			this.client.on('message', this.onMessage.bind(this));
			console.log(chalk.green('Connected to MQTT broker'));
		} catch (error) {
			this.error('connecting to MQTT broker', error);
			return;
		}

		try {
			const subscriptions = await this.client.subscribeAsync(topics);
			console.log(chalk.magenta('Subscribed to topics: %s'), subscriptions.map((sub) => chalk.magentaBright(sub.topic)).join(', '));
		} catch (error) {
			this.error('subscribing to topics', error);
			await this.stop();
		}

		return new Promise<void>((resolve) => this.client?.once('end', resolve));
	}

	public async stop(): Promise<void> {
		if (!this.client) return;

		console.log(chalk.cyan('\nDisconnecting from MQTT broker'));
		await this.client.endAsync();
		this.client = undefined;
	}
}
