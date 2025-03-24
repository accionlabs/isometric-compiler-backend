import { Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { Chat } from "../entities/chat.entity";
import { BaseService } from "./base.service";

@Service()
export class ChatService extends BaseService<Chat> {
    constructor() {
        super(AppDataSource.getRepository(Chat));
    }

    async getChatsByUUID(uuid: string, limit: number = 10, skip: number = 0) {
        return this.getRepository().find({ where: { uuid }, take: limit, skip });
    }

}