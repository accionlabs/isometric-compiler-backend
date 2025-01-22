import { Service } from "typedi";
import { BaseService } from "./base.service";
import { Diagram } from "../entities/diagram.entity";
import { AppDataSource } from "../configs/database";

@Service()
export class DiagramService extends BaseService<Diagram> {

    constructor() {
        super(AppDataSource.getMongoRepository(Diagram));
        setTimeout(() => {
            this.getRepository().createCollectionIndex({ name: 1, version: 1 }, { unique: true, name: 'diagram_name_version_unique' });
        }, 10000);


    }


}