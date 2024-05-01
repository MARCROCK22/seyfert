import { BaseInteraction, type RawFile, WebhookMessage, resolveFiles, type ReplyInteractionBody, Modal } from '../..';
import type { InteractionMessageUpdateBodyRequest, MessageWebhookCreateBodyRequest } from '../types/write';
import { BaseShorter } from './base';

export class InteractionShorter extends BaseShorter {
	async reply(id: string, token: string, body: ReplyInteractionBody) {
		//@ts-expect-error
		const { files, ...rest } = body.data ?? {};
		//@ts-expect-error
		const data = body.data instanceof Modal ? body.data : rest;
		return this.client.proxy
			.interactions(id)(token)
			.callback.post({
				body: BaseInteraction.transformBodyRequest(
					{
						type: body.type,
						data,
					},
					this.client,
				),
				files: files ? await resolveFiles(files) : undefined,
			});
	}

	fetchResponse(token: string, messageId: string) {
		return this.client.webhooks.fetchMessage(this.client.applicationId, token, messageId);
	}

	fetchOriginal(token: string) {
		return this.fetchResponse(token, '@original');
	}

	async editMessage(token: string, messageId: string, body: InteractionMessageUpdateBodyRequest) {
		const { files, ...data } = body;
		const apiMessage = await this.client.proxy
			.webhooks(this.client.applicationId)(token)
			.messages(messageId)
			.patch({
				body: BaseInteraction.transformBody(data, this.client),
				files: files ? await resolveFiles(files) : undefined,
			});
		return new WebhookMessage(this.client, apiMessage, this.client.applicationId, token);
	}

	editOriginal(token: string, body: InteractionMessageUpdateBodyRequest) {
		return this.editMessage(token, '@original', body);
	}

	deleteResponse(interactionId: string, token: string, messageId: string) {
		return this.client.proxy
			.webhooks(this.client.applicationId)(token)
			.messages(messageId)
			.delete()
			.then(() => this.client.components?.onMessageDelete(messageId === '@original' ? interactionId : messageId));
	}

	deleteOriginal(interactionId: string, token: string) {
		return this.deleteResponse(interactionId, token, '@original');
	}

	async followup(token: string, { files, ...body }: MessageWebhookCreateBodyRequest) {
		files = files ? await resolveFiles(files) : undefined;
		const apiMessage = await this.client.proxy
			.webhooks(this.client.applicationId)(token)
			.post({
				body: BaseInteraction.transformBody(body, this.client),
				files: files as RawFile[] | undefined,
			});
		return new WebhookMessage(this.client, apiMessage, this.client.applicationId, token);
	}
}
