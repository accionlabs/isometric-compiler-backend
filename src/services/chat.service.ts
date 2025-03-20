import { Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { Chat } from "../entities/chat.entity";
import { BaseService } from "./base.service";

@Service()
export class ChatService extends BaseService<Chat> {
    constructor() {
        super(AppDataSource.getRepository(Chat));
    }
}