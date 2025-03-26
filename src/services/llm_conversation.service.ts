import { Service } from 'typedi';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { LLMConversation } from '../entities/llm_conversation.entity';
import { MoreThanOrEqual } from 'typeorm';

@Service()
export class LLMConversationService extends BaseService<LLMConversation> {

    constructor() {
        super(AppDataSource.getRepository(LLMConversation));
    }

    async saveChatContext(chat: Partial<LLMConversation>) {
        if (!chat.key) {
            throw new Error("key is required")
        }
        let conversation = await this.getRepository().findOneBy({ key: chat.key })
        if (conversation) {
            // Update existing record
            Object.assign(conversation, chat);
        } else {
            conversation = this.getRepository().create(chat);
        }

        return this.getRepository().save(conversation);
    }

    async fetchChatHistory(key: string, historyLimitInMinutes: number = 60) {
        const timeLimit = new Date();
        timeLimit.setMinutes(timeLimit.getMinutes() - historyLimitInMinutes);

        return this.getRepository().findOne({
            select: ["context", "metadata", "conversations"],
            where: {
                key,
                updatedAt: MoreThanOrEqual(timeLimit),
            },
        });
    }
}
