import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SemanticModelStatus } from "../enums";


export class CitationRespDto {
    @IsString()
    documentName: string;

    @IsString()
    documentId: string;

}

export class ScenarioRespDto {
    @IsString()
    scenario: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    metadataShapeName?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StepRespDto)
    steps?: StepRespDto[];
}

export class StepRespDto {
    @IsString()
    step: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ActionRespDto)
    actions?: ActionRespDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CitationRespDto)
    citations?: CitationRespDto[];
}

export class ActionRespDto {
    @IsString()
    action: string;

}

class PersonaRespDto {
    @IsString()
    persona: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OutcomeRepsDto)
    outcomes?: OutcomeRepsDto[];
}

class OutcomeRepsDto {
    @IsString()
    outcome: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScenarioRespDto)
    scenarios?: ScenarioRespDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CitationRespDto)
    citations?: CitationRespDto[];
}

class MetadataDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PersonaRespDto)
    qum: PersonaRespDto[];
}

class VisualModelDto {
    [key: string]: any;
}
class SaveMetadataDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PersonaRespDto)
    qum: PersonaRespDto[];
}

export class SaveSemanticModelDto {
    @IsString()
    @IsNotEmpty()
    uuid: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => SaveMetadataDto)
    metadata?: Record<string, any>;

    @IsOptional()
    @ValidateNested()
    @Type(() => VisualModelDto)
    visualModel?: Record<string, any>;

    @IsOptional()
    @IsEnum(SemanticModelStatus)
    status?: SemanticModelStatus;
}


export class UpdateSemanticModelDto {

    @IsOptional()
    @ValidateNested()
    @Type(() => MetadataDto)
    metadata?: MetadataDto;

    @IsOptional()
    @IsArray()
    visualModel?: Record<string, any>;
}


export class SemanticModelDto {
    @IsUUID()
    uuid: string;

    @IsString()
    historyId: string;
}


