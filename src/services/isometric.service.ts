import { Service } from "typedi";
import { Chat } from "../entities/chat.entity";
import { BaseService } from "./base.service";

@Service()
export class IsometricService extends BaseService<Chat> {
}